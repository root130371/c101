export type UsageMetric = 'chat_messages' | 'contract_analyses' | 'evidence_analyses';
type UsageDecision = { allowed: boolean; plan: 'free' | 'tenant_plus'; limit: number; used: number; request_id?: string };

export class UsageLimitError extends Error {
  metric: UsageMetric;
  usage: UsageDecision;
  constructor(metric: UsageMetric, usage: UsageDecision) {
    super('Plan limit reached.');
    this.metric = metric;
    this.usage = usage;
  }
  payload() {
    return { error: this.message, error_code: 'usage_limit_reached', metric: this.metric,
      plan: this.usage.plan, limit: this.usage.limit, used: this.usage.used,
      recovery: this.metric === 'chat_messages'
        ? 'Upgrade to Tenant Plus or wait for the daily chat counter to reset.'
        : 'Upgrade to Tenant Plus or wait for the monthly document counter to reset.' };
  }
}

// Reserve before any paid work. Crashes/unknown settlement keep quota occupied;
// retrying a settlement is safe, but automatically expiring reservations is not.
export async function withUsageReservation<T>(
  url: string, serviceKey: string, userId: string, metric: UsageMetric,
  work: () => Promise<T>, request: typeof fetch = fetch,
): Promise<T> {
  const requestId = crypto.randomUUID();
  const rpc = async (name: string, body: Record<string, unknown>) => {
    const response = await request(`${url}/rest/v1/rpc/${name}`, {
      method: 'POST', headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}`,
        'content-type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`AI usage ${name} failed (${response.status}).`);
    return await response.json();
  };
  const decision: UsageDecision = await rpc('reserve_ai_usage', {
    p_user_id: userId, p_metric: metric, p_request_id: requestId,
  });
  if (!decision || typeof decision.allowed !== 'boolean'
    || !['free', 'tenant_plus'].includes(decision.plan)
    || !Number.isInteger(decision.limit) || decision.limit < 0
    || !Number.isInteger(decision.used) || decision.used < 0
    || (decision.allowed && decision.request_id !== requestId)) {
    throw new Error('Invalid AI usage reservation response.');
  }
  if (!decision.allowed) throw new UsageLimitError(metric, decision);
  let result: T;
  try {
    result = await work();
  } catch (error) {
    try { await rpc('settle_ai_usage', { p_request_id: requestId, p_succeeded: false }); }
    catch (settlementError) { console.error('AI quota release requires reconciliation', requestId, settlementError); }
    throw error;
  }
  // Do not refund completed work if its settlement acknowledgement is lost.
  try { await rpc('settle_ai_usage', { p_request_id: requestId, p_succeeded: true }); }
  catch (error) { console.error('AI quota commit requires reconciliation', requestId, error); }
  return result;
}
