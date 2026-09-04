type AskAssistantRequest = {
  question?: string;
  language?: "tr" | "en";
  case_context?: Record<string, unknown>;
  property_id?: string | null;
};

type AssistantMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS"
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const model = Deno.env.get("OPENAI_ASSISTANT_MODEL") || Deno.env.get("OPENAI_MODEL") || "gpt-5-mini";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!apiKey) return json({ error: "OPENAI_API_KEY is not configured." }, 501);
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: "Supabase function environment is incomplete." }, 500);
  }

  let body: AskAssistantRequest;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const question = String(body.question || "").trim();
  if (question.length < 3) return json({ error: "Question is too short." }, 400);
  if (question.length > 3000) return json({ error: "Question is too long." }, 400);

  const authHeader = request.headers.get("authorization") || "";
  const user = await getUser(supabaseUrl, anonKey, authHeader);
  if (!user?.id) return json({ error: "Authentication required" }, 401);

  const language = body.language === "en" ? "en" : "tr";
  const propertyId = typeof body.property_id === "string" && body.property_id ? body.property_id : null;

  const [evidence, listings, history] = await Promise.all([
    fetchEvidenceSummaries(supabaseUrl, serviceRoleKey, user.id),
    fetchRentListings(supabaseUrl, serviceRoleKey),
    fetchRecentMessages(supabaseUrl, serviceRoleKey, user.id)
  ]);

  await insertAssistantMessage(supabaseUrl, serviceRoleKey, {
    user_id: user.id,
    property_id: propertyId,
    role: "user",
    content: question
  });

  try {
    const answer = await askOpenAI(apiKey, model, {
      question,
      language,
      case_context: body.case_context || {},
      evidence,
      listings,
      history
    });

    await insertAssistantMessage(supabaseUrl, serviceRoleKey, {
      user_id: user.id,
      property_id: propertyId,
      role: "assistant",
      content: answer.answer_text
    });

    return json({ answer });
  } catch (error) {
    const appError = normalizeAssistantError(error);
    return json(appError, appError.status);
  }
});

async function getUser(supabaseUrl: string, anonKey: string, authHeader: string) {
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      authorization: authHeader
    }
  });
  if (!response.ok) return null;
  return await response.json();
}

async function fetchEvidenceSummaries(supabaseUrl: string, serviceRoleKey: string, userId: string) {
  const url = `${supabaseUrl}/rest/v1/evidence_items?user_id=eq.${encodeURIComponent(userId)}&select=type,status,confidence,summary_tr,summary_en,extracted_json,created_at&order=created_at.desc&limit=12`;
  const response = await fetch(url, { headers: serviceHeaders(serviceRoleKey) });
  if (!response.ok) throw new Error(`Evidence lookup failed: ${await response.text()}`);
  return await response.json();
}

async function fetchRentListings(supabaseUrl: string, serviceRoleKey: string) {
  const url = `${supabaseUrl}/rest/v1/rent_listings?select=title,rent,size,building_age,city,district,neighborhood,address,source,proof,created_at&order=created_at.desc&limit=20`;
  const response = await fetch(url, { headers: serviceHeaders(serviceRoleKey) });
  if (!response.ok) throw new Error(`Rent listing lookup failed: ${await response.text()}`);
  return await response.json();
}

async function fetchRecentMessages(supabaseUrl: string, serviceRoleKey: string, userId: string): Promise<AssistantMessage[]> {
  const url = `${supabaseUrl}/rest/v1/assistant_messages?user_id=eq.${encodeURIComponent(userId)}&select=role,content,created_at&order=created_at.desc&limit=8`;
  const response = await fetch(url, { headers: serviceHeaders(serviceRoleKey) });
  if (!response.ok) throw new Error(`Assistant history lookup failed: ${await response.text()}`);
  const rows = await response.json();
  return Array.isArray(rows) ? rows.reverse() : [];
}

async function insertAssistantMessage(supabaseUrl: string, serviceRoleKey: string, payload: Record<string, unknown>) {
  const response = await fetch(`${supabaseUrl}/rest/v1/assistant_messages`, {
    method: "POST",
    headers: serviceHeaders(serviceRoleKey, true),
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Assistant message save failed: ${await response.text()}`);
}

async function askOpenAI(apiKey: string, model: string, context: Record<string, unknown>) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      instructions: [
        "You are Kiraci Kalkani, a tenant-side assistant for renters in Turkey.",
        "Answer diverse tenant questions about rent increases, deposits, unpaid rent risk, contracts, evidence, moving costs, utility estimates, and landlord communication.",
        "Use the provided case context, evidence summaries, nearby listing data, and recent chat history when relevant.",
        "Do calculations explicitly from supplied numbers. If a calculation needs missing facts, ask concise follow-up questions and give a labelled rough estimate only when reasonable.",
        "Do not claim to be a lawyer and do not present legal advice as definitive. For high-risk legal, eviction, lawsuit, or repeated nonpayment questions, explain practical risk and advise consulting a qualified Turkish lawyer or tenant association.",
        "Do not invent statutes, court outcomes, live tariff prices, or government deadlines. Say when current official data is needed.",
        "Return strict JSON only with keys: title, summary, guidance, draft, note, answer_text. Use the user's language."
      ].join(" "),
      text: {
        format: {
          type: "json_schema",
          name: "tenant_assistant_answer",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              guidance: { type: "string" },
              draft: { type: "string" },
              note: { type: "string" },
              answer_text: { type: "string" }
            },
            required: ["title", "summary", "guidance", "draft", "note", "answer_text"]
          }
        }
      },
      input: [
        {
          role: "user",
          content: [{
            type: "input_text",
            text: JSON.stringify(context)
          }]
        }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new AssistantError("openai_request_failed", `OpenAI assistant failed: ${text}`, 502, parseJsonObjectSafe(text));
  }
  const result = await response.json();
  const parsed = parseJsonObject(extractOutputText(result));
  const title = stringOrFallback(parsed.title, "Assistant answer");
  const summary = stringOrFallback(parsed.summary, "");
  const guidance = stringOrFallback(parsed.guidance, "");
  const draft = typeof parsed.draft === "string" ? parsed.draft : "";
  const note = stringOrFallback(parsed.note, "");
  const answerText = stringOrFallback(
    parsed.answer_text,
    [title, summary, guidance, draft, note].filter(Boolean).join("\n\n")
  );

  return {
    title,
    summary,
    guidance,
    draft,
    note,
    answer_text: answerText
  };
}

function serviceHeaders(serviceRoleKey: string, jsonBody = false) {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    ...(jsonBody ? { "content-type": "application/json", prefer: "return=minimal" } : {})
  };
}

function extractOutputText(result: Record<string, unknown>) {
  if (typeof result.output_text === "string") return result.output_text;
  const output = Array.isArray(result.output) ? result.output : [];
  return output
    .flatMap((item: any) => Array.isArray(item.content) ? item.content : [])
    .map((content: any) => content.text || "")
    .join("\n")
    .trim();
}

function parseJsonObject(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("OpenAI did not return parseable JSON.");
    return JSON.parse(match[0]);
  }
}

function parseJsonObjectSafe(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function stringOrFallback(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

class AssistantError extends Error {
  code: string;
  status: number;
  details: unknown;

  constructor(code: string, message: string, status = 500, details: unknown = null) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function normalizeAssistantError(error: unknown) {
  if (error instanceof AssistantError) {
    const openaiCode = (error.details as any)?.error?.code;
    if (openaiCode === "credit_balance_exhausted") {
      return {
        status: 402,
        error: "AI credits are exhausted for the OpenAI API organization.",
        error_code: "openai_credit_balance_exhausted",
        recovery: "Add API credits in OpenAI Platform billing, then retry after a few minutes.",
        reset: "This does not have a known automatic reset. It is a prepaid API credit balance, not a monthly free allowance.",
        billing_url: "https://platform.openai.com/settings/organization/billing"
      };
    }
    return {
      status: error.status,
      error: error.message,
      error_code: error.code
    };
  }

  const message = error instanceof Error ? error.message : "Unknown assistant error";
  return {
    status: 500,
    error: message,
    error_code: "assistant_failed"
  };
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8"
    }
  });
}
