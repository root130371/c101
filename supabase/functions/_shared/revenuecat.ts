// Server-only reconciliation. Never accept entitlement claims from the app or event body.
type Env = (name: string) => string | undefined;
type Snapshot = {
  active: boolean;
  processor: "apple" | "google" | "manual";
  periodEnd: string | null;
  checkedAt: string;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
  "access-control-allow-methods": "POST, OPTIONS",
};

export function subscriberSnapshot(body: any, entitlementId: string, allowSandbox = false, now = Date.now()): Snapshot {
  if (!body?.subscriber || !Number.isFinite(body.request_date_ms)) throw new Error("Invalid subscriber response");
  const entitlement = body.subscriber.entitlements?.[entitlementId];
  const subscription = body.subscriber.subscriptions?.[entitlement?.product_identifier];
  // Tenant Plus is a recurring store subscription. Promotional/lifetime products are not enabled.
  const processor = subscription?.store === "play_store" ? "google"
    : subscription?.store === "app_store" ? "apple" : "manual";
  const expiry = Date.parse(entitlement?.expires_date || "");
  const grace = Date.parse(entitlement?.grace_period_expires_date || "");
  const end = Math.max(Number.isFinite(expiry) ? expiry : 0, Number.isFinite(grace) ? grace : 0);
  const active = processor !== "manual" && end > now && !subscription.refunded_at
    && (subscription.is_sandbox === false || (allowSandbox && subscription.is_sandbox === true));
  return {
    active,
    processor,
    periodEnd: end ? new Date(end).toISOString() : null,
    checkedAt: new Date(body.request_date_ms).toISOString(),
  };
}

export function webhookUsers(event: any): string[] {
  const ids = event.type === "TRANSFER"
    ? [...(Array.isArray(event.transferred_from) ? event.transferred_from : []), ...(Array.isArray(event.transferred_to) ? event.transferred_to : [])]
    : [event.app_user_id];
  // SDK always uses the authenticated Supabase UUID. Anonymous IDs never grant access.
  return [...new Set(ids.filter((id): id is string => typeof id === "string" && uuid.test(id)))];
}

export function billingHandler(mode: "sync" | "webhook", env: Env, fetcher: typeof fetch = fetch) {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...cors, "content-type": "application/json", "cache-control": "no-store" },
  });
  return async (request: Request): Promise<Response> => {
    if (request.method === "OPTIONS" && mode === "sync") return new Response("ok", { headers: cors });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const url = env("SUPABASE_URL");
    const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
    const rcKey = env("REVENUECAT_SECRET_API_KEY");
    const anonKey = env("SUPABASE_ANON_KEY");
    if (!url || !serviceKey || !rcKey || (mode === "sync" && !anonKey)) {
      return json({ error: "Billing verification is not configured." }, 503);
    }
    const timedFetch: typeof fetch = (input, init) => fetcher(input, { ...init, signal: AbortSignal.timeout(12000) });
    try {
      let users: string[];
      let eventId: string | null = null;
      if (mode === "webhook") {
        const secret = env("REVENUECAT_WEBHOOK_AUTHORIZATION");
        if (!secret) return json({ error: "Webhook authorization is not configured." }, 503);
        if (!await sameSecret(request.headers.get("authorization") || "", secret)) return json({ error: "Unauthorized" }, 401);
        const raw = await request.text();
        if (raw.length > 65536) return json({ error: "Event too large" }, 413);
        let event: any;
        try { event = JSON.parse(raw)?.event; } catch { return json({ error: "Invalid JSON" }, 400); }
        if (!event || typeof event.id !== "string" || event.id.length > 200 || !event.id || typeof event.type !== "string") {
          return json({ error: "Invalid event" }, 400);
        }
        if (event.type === "TEST") return json({ ok: true, test: true });
        eventId = event.id;
        users = webhookUsers(event);
        if (users.length > 20) return json({ error: "Too many identities" }, 400);
      } else {
        const authorization = request.headers.get("authorization") || "";
        if (!/^Bearer\s+\S+$/i.test(authorization)) return json({ error: "Sign in required" }, 401);
        const auth = await timedFetch(`${url}/auth/v1/user`, { headers: { apikey: anonKey!, authorization } });
        if (!auth.ok) return json({ error: "Sign in required" }, 401);
        const user = await auth.json();
        if (!uuid.test(user?.id || "")) return json({ error: "Sign in required" }, 401);
        users = [user.id]; // Ignore request body/user IDs supplied by the client.
      }
      const snapshots: Snapshot[] = [];
      for (const userId of users) {
        // No writes on RevenueCat/network failure, including 404s. Retrying is safe.
        const response = await timedFetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
          headers: { authorization: `Bearer ${rcKey}` },
        });
        if (!response.ok) throw new Error("Subscriber lookup failed");
        const snapshot = subscriberSnapshot(await response.json(), env("REVENUECAT_ENTITLEMENT_ID") || "tenant_plus", env("REVENUECAT_ALLOW_SANDBOX") === "true");
        const saved = await timedFetch(`${url}/rest/v1/rpc/sync_revenuecat_entitlement`, {
          method: "POST",
          headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, "content-type": "application/json" },
          body: JSON.stringify({ p_user_id: userId, p_active: snapshot.active, p_processor: snapshot.processor,
            p_period_end: snapshot.periodEnd, p_checked_at: snapshot.checkedAt, p_event_id: eventId }),
        });
        if (!saved.ok) throw new Error("Entitlement update failed");
        const active = await saved.json();
        if (typeof active !== "boolean") throw new Error("Invalid sync result");
        snapshots.push({ ...snapshot, active });
      }
      return json({ ok: true, active: snapshots[0]?.active ?? false, synced: users.length });
    } catch {
      // Do not log vendor bodies, authorization headers or account details.
      return json({ error: "Subscription verification is temporarily unavailable. Please retry." }, 502);
    }
  };
}

async function sameSecret(actual: string, expected: string) {
  const hash = (value: string) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  const [a, b] = await Promise.all([hash(actual), hash(expected)]);
  const left = new Uint8Array(a), right = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}
