# Atomic AI usage accounting

Both AI functions reserve allowance in PostgreSQL before performing work. The
reservation increments the existing usage counter while holding its row lock;
concurrent requests cannot read and spend the same last slot. Chat retains UTC
daily periods, documents UTC monthly periods, and the existing Free/Plus limits.
The database derives the plan from unexpired active/trialing subscriptions;
neither a phone nor a request payload can choose a higher allowance.

Successful work commits its reservation. Handled failures release it exactly
once. Pending work counts toward the visible usage count, preventing simultaneous
requests from overspending. A failed settlement or process crash keeps the slot
occupied, rather than assuming the provider call never happened. There is no
automatic expiry/refund. This can temporarily reduce allowance after an outage;
new periods use new counters and are unaffected by pending prior-period work.

## Deployment

1. Pause/drain traffic to **both** AI functions. Old deployed handlers still use
   the previous read/write algorithm and must not run alongside new handlers.
2. Apply billing foundation and RevenueCat migrations as documented in
   `BILLING_SETUP.md`, then `supabase/upgrade_atomic_usage.sql`. Existing usage
   counts are preserved. Never reset production counters as part of migration.
3. Deploy both `ask-assistant` and `analyze-evidence`; the shared module is
   bundled with them. Missing RPCs fail closed before provider work.
4. Verify authentication, denied admission, successful requests and provider
   failure handling in the target environment, then resume traffic.

If reverting the handlers, pause/drain traffic and reconcile reservations first;
do not restore the old counter algorithm while new requests are still running.
The migration is additive and does not need dropping for a source rollback.

## Interrupted requests

Server logs identify a request UUID if commit/release acknowledgement fails.
Only trusted service-role/server tooling may inspect `usage_reservations` and
call `settle_ai_usage(request_id, succeeded)`. Anonymous/authenticated clients
have no access to the ledger or these RPCs. Do not expose service credentials.
After confirming a request is finished, commit completed work or release a
confirmed failed request. Duplicate settlements are harmless; committed work
cannot subsequently be refunded by this RPC. Do not release an actively running
or uncertain request solely because it is old. A reserve-response timeout can
also leave a pending slot; inspect the ledger and request logs before settling.

Request IDs are generated on the server for each invocation. This change does
not deduplicate separate HTTP retries or concurrent analyses of one document.
It guarantees quota admission/settlement serialization, not exactly-once Gemini
execution, provider-cost accounting, or recovery of responses lost in transit.

## Validation

- `node --test tests/billing.test.mjs tests/usage.test.mjs`
- `node c101-mobile/node_modules/typescript/bin/tsc -p supabase/functions/tsconfig.json`
- In an isolated PostgreSQL database, apply the setup/billing migrations and
  the new migration twice, then run `tests/billing-db.sql` and `tests/usage-db.sql`.
- Set `C101_USAGE_DB_TEST=1` and normal PostgreSQL test connection variables,
  then run `node --test tests/usage-concurrency.test.mjs`. For a disposable local
  Docker DB, set `C101_TEST_POSTGRES_CONTAINER` to its name instead.

The concurrency test starts 40 PostgreSQL sessions for a five-request allowance
and verifies only five are admitted. Twenty simultaneous releases of one
reservation must refund one slot. Never point this test at production.

Local checks do not establish live deployment or store-purchase acceptance.

## Mobile usage presentation

The account screen distinguishes loading/unavailable data from a successful zero-use
lookup. A failed query never implies a full remaining allowance. Chat counters
use today's UTC date; document counters use the current UTC month. Old chat rows
from the first day of the month cannot overwrite today's count. The displayed
limit comes from the currently verified entitlement, so a saved counter's older
limit does not override an upgrade or expiry. Pending backend reservations remain
included in used_count. Server admission remains authoritative.

Use Refresh plan and usage to recover after a network failure or period change.
Snapshots crossing a daily/monthly boundary require refreshing the affected metric.
Unverified plans do not show numerical remaining allowances or an active Free
plan, and the subscribe action is disabled until verification succeeds. Purchase
Restore remains available to retry verification. Account panels remount when the
signed-in user changes, preventing prior-account billing state from carrying over.
This is local tested code; device/store and live-backend acceptance remain pending.
