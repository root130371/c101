import { test } from 'node:test';
import assert from 'node:assert/strict';
import { billingHandler, subscriberSnapshot, webhookUsers } from '../supabase/functions/_shared/revenuecat.ts';

const user = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';
const now = Date.now();
const future = new Date(now + 86400000).toISOString();
const past = new Date(now - 86400000).toISOString();
const settings = { SUPABASE_URL: 'https://project.test', SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 'service', REVENUECAT_SECRET_API_KEY: 'secret',
  REVENUECAT_WEBHOOK_AUTHORIZATION: 'Bearer webhook' };
const env = key => settings[key];
const customer = (entitlement = {}, subscription = {}) => ({ request_date_ms: now,
  subscriber: { entitlements: { tenant_plus: { product_identifier: 'monthly', expires_date: future, ...entitlement } },
    subscriptions: { monthly: { store: 'play_store', is_sandbox: false, ...subscription } } } });
const post = (body = {}, authorization = 'Bearer session') => new Request('https://function.test', {
  method: 'POST', headers: { authorization }, body: JSON.stringify(body),
});

test('active subscription grants access; canceled auto-renew keeps the paid period', () => {
  assert.equal(subscriberSnapshot(customer({}, { unsubscribe_detected_at: past }), 'tenant_plus', false, now).active, true);
});
test('expiration and refunds revoke access', () => {
  assert.equal(subscriberSnapshot(customer({ expires_date: past }), 'tenant_plus', false, now).active, false);
  assert.equal(subscriberSnapshot(customer({}, { refunded_at: past }), 'tenant_plus', false, now).active, false);
});
test('verified grace period preserves access', () => {
  const result = subscriberSnapshot(customer({ expires_date: past, grace_period_expires_date: future }), 'tenant_plus', false, now);
  assert.equal(result.active, true);
  assert.equal(result.periodEnd, future);
});
test('sandbox requires explicit server opt-in; unknown stores and permanent products are denied', () => {
  assert.equal(subscriberSnapshot(customer({}, { is_sandbox: true }), 'tenant_plus', false, now).active, false);
  assert.equal(subscriberSnapshot(customer({}, { is_sandbox: true }), 'tenant_plus', true, now).active, true);
  assert.equal(subscriberSnapshot(customer({}, { store: 'promotional' }), 'tenant_plus', true, now).active, false);
  assert.equal(subscriberSnapshot(customer({ expires_date: null }), 'tenant_plus', true, now).active, false);
});
test('missing entitlement revokes access; malformed provider payload fails closed', () => {
  assert.equal(subscriberSnapshot({ request_date_ms: now, subscriber: {} }, 'tenant_plus', false, now).active, false);
  assert.throws(() => subscriberSnapshot({}, 'tenant_plus'));
});
test('transfer reconciles both sides once and ignores anonymous IDs', () => {
  assert.deepEqual(webhookUsers({ type: 'TRANSFER', transferred_from: [user, '$RCAnonymousID:abc'], transferred_to: [other, user] }), [user, other]);
});
test('webhook refuses wrong authorization before any external request', async () => {
  let calls = 0;
  const response = await billingHandler('webhook', env, async () => { calls++; throw Error(); })(post({}, 'Bearer wrong'));
  assert.equal(response.status, 401);
  assert.equal(calls, 0);
});
test('sync authenticates the session and ignores forged client user and entitlement', async () => {
  const requests = [];
  const handler = billingHandler('sync', env, async (url, options) => {
    requests.push([url, options]);
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: user });
    if (url.includes('revenuecat.com')) return Response.json(customer());
    return Response.json(true);
  });
  const response = await handler(post({ user_id: other, active: true }));
  assert.equal(response.status, 200);
  assert.ok(requests[1][0].endsWith(user));
  const payload = JSON.parse(requests[2][1].body);
  assert.equal(payload.p_user_id, user);
  assert.equal(payload.p_active, true);
});
test('vendor failure preserves database access state and remains retryable', async () => {
  const urls = [];
  const handler = billingHandler('sync', env, async url => {
    urls.push(url);
    return url.endsWith('/auth/v1/user') ? Response.json({ id: user }) : new Response('', { status: 503 });
  });
  assert.equal((await handler(post())).status, 502);
  assert.equal(urls.length, 2);
});
test('canonical database state overrides an older active provider snapshot', async () => {
  const handler = billingHandler('sync', env, async url => {
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: user });
    if (url.includes('revenuecat.com')) return Response.json(customer());
    return Response.json(false);
  });
  const response = await handler(post());
  assert.equal((await response.json()).active, false);
});
test('failed database write does not acknowledge webhook success', async () => {
  const handler = billingHandler('webhook', env, async url => url.includes('revenuecat.com')
    ? Response.json(customer()) : new Response('', { status: 500 }));
  assert.equal((await handler(post({ event: { id: 'evt', type: 'RENEWAL', app_user_id: user } }, 'Bearer webhook'))).status, 502);
});
test('transfer passes a stable event ID for each account to the atomic RPC', async () => {
  const rows = [];
  const handler = billingHandler('webhook', env, async (url, options) => {
    if (url.includes('revenuecat.com')) return Response.json(customer());
    rows.push(JSON.parse(options.body));
    return Response.json(true);
  });
  const request = () => post({ event: { id: 'transfer-1', type: 'TRANSFER', transferred_from: [user], transferred_to: [other] } }, 'Bearer webhook');
  assert.equal((await handler(request())).status, 200);
  assert.equal((await handler(request())).status, 200);
  assert.deepEqual(rows.map(r => [r.p_user_id, r.p_event_id]), [[user, 'transfer-1'], [other, 'transfer-1'], [user, 'transfer-1'], [other, 'transfer-1']]);
});
