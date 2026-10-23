export type UsageMetric = "chat_messages" | "contract_analyses" | "evidence_analyses";
export type UsageCounter = { metric: UsageMetric; periodStart: string; used: number };
export type UsageSnapshot = {
  state: "fresh" | "unavailable" | "loading";
  counters: UsageCounter[];
  observedAt: string | null;
};

export function usagePeriods(now = new Date()) {
  const daily = now.toISOString().slice(0, 10);
  return { daily, monthly: `${daily.slice(0, 7)}-01` };
}

// An empty successful query means zero usage; a failed query means unknown.
export async function readUsageSnapshot(
  loadRows: (periods: { daily: string; monthly: string }) => Promise<{ data: unknown; error: unknown }>,
  now = new Date(),
): Promise<UsageSnapshot> {
  const unavailable: UsageSnapshot = { state: "unavailable", counters: [], observedAt: null };
  try {
    const periods = usagePeriods(now);
    const { data, error } = await loadRows(periods);
    if (error || !Array.isArray(data)) return unavailable;
    const counters: UsageCounter[] = [];
    const seen = new Set<string>();
    for (const row of data) {
      if (!row || typeof row !== "object") return unavailable;
      const metric = row.metric;
      if (!["chat_messages", "contract_analyses", "evidence_analyses"].includes(metric)) continue;
      const expected = metric === "chat_messages" ? periods.daily : periods.monthly;
      if (row.period_start !== expected) continue;
      if (!Number.isSafeInteger(row.used_count) || row.used_count < 0 || seen.has(metric)) return unavailable;
      seen.add(metric);
      counters.push({ metric, periodStart: expected, used: row.used_count });
    }
    return { state: "fresh", counters, observedAt: now.toISOString() };
  } catch {
    return unavailable;
  }
}

export function usageDisplay(
  snapshot: UsageSnapshot,
  metric: UsageMetric,
  currentPlanLimit: number | null,
  now = new Date(),
): { used: number; limit: number; remaining: number } | null {
  // Do not carry yesterday's empty or populated snapshot into a new period.
  if (snapshot.state !== "fresh" || !snapshot.observedAt || currentPlanLimit === null
    || !Number.isSafeInteger(currentPlanLimit) || currentPlanLimit < 0) return null;
  const observedDate = new Date(snapshot.observedAt);
  if (!Number.isFinite(observedDate.getTime())) return null;
  const periods = usagePeriods(now);
  const observed = usagePeriods(observedDate);
  const expected = metric === "chat_messages" ? periods.daily : periods.monthly;
  if (expected !== (metric === "chat_messages" ? observed.daily : observed.monthly)) return null;
  const counter = snapshot.counters.find(row => row.metric === metric && row.periodStart === expected);
  const used = counter?.used ?? 0;
  // The saved counter's old plan limit must not override an upgrade or expiry.
  return { used, limit: currentPlanLimit, remaining: Math.max(0, currentPlanLimit - used) };
}
