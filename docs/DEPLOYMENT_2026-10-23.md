# Backend deployment: October 23, 2026

## Live result

Existing project `gxqcacrtntnfnakitdaf` was resumed through Supabase's project
restore API and reached `ACTIVE_HEALTHY`. The existing user and data were
preserved. This was a project resume, not a new project or a point-in-time rollback.

Before deployment, read-only catalog inspection confirmed the core tables and
policies existed, but billing/quota tables and the mobile extraction-job INSERT
policy were absent. Existing function sources were downloaded locally under
Pinebot's ignored `.tmp/c101-live-before-20261023` directory for rollback.

Both AI endpoints were temporarily put into maintenance, then drained beyond
the documented maximum worker duration. Applied:

1. `upgrade_billing_foundation.sql`
2. `upgrade_revenuecat_sync.sql`
3. `upgrade_atomic_usage.sql`
4. `upgrade_evidence_job_policy.sql`

The fourth migration adds only authenticated, owned-evidence, queued-job INSERTs.
It rejects cross-user evidence, forged user IDs, forged completion/provider data
and anonymous inserts. The initial schema now uses the same restriction.

Final deployed functions:

| Function | Version | JWT gateway verification |
| --- | --- | --- |
| ask-assistant | 11 | enabled |
| analyze-evidence | 10 | enabled |
| sync-store-billing | 1 | enabled |
| revenuecat-webhook | 1 | disabled; handler requires configured webhook secret |
| scrape-rental-listing | 2 | unchanged |

## Verification

- Backend rejects unauthenticated requests to both AI endpoints and billing sync.
- A disposable account authenticated without sending email. It uploaded a small
  generated PDF, saved evidence metadata and queued an owned extraction job.
- Client attempts to call service-only quota RPCs or forge a completed job were
  blocked. Service-only subscription reconciliation permissions were checked.
- Saturated fixture quotas made live chat and document endpoints return 402
  before provider work. Unconfigured billing endpoints returned 503, granting
  no entitlement.
- One real Gemini chat response and one small PDF analysis succeeded through the
  deployed functions. Each consumed exactly one quota allowance.
- Test storage file, user and cascading database fixtures were removed. Final
  count returned to one original user, zero test evidence and zero reservations.
- Google provider configuration is enabled. Native `c101://auth/callback` was
  added to the redirect allowlist while preserving existing entries. Native
  source no longer rewrites custom schemes or defaults to an old development IP.
  Six redirect tests passed, but Google sign-in on an installed device remains
  an acceptance test.
- All 38 local billing/quota/mobile/redirect tests and mobile TypeScript passed.
  The evidence policy passed repeat-migration and row-security tests in disposable
  PostgreSQL. CI for source checkpoint `98a8935` passed:
  https://github.com/root130371/c101/actions/runs/39974692139 .

These are dated observations, not a continuing health guarantee. Live test
accounts used backend authentication, not an interactive Google OAuth flow.

## Remaining external setup

RevenueCat server key/webhook authorization and native public SDK keys are not
configured. No Google Play package, Expo project or native build environment was
found in local env files. Billing functions are deployed but intentionally return
unavailable until configured; real payments, subscription lifecycle events and
native store acceptance are not verified. No paid plan or store product was
created, and main/GitHub Pages were not deployed.

Next: supply account-owned RevenueCat/Play/Expo configuration through local or
provider settings, build the Android test app, and run the purchase/restore and
device sign-in checks in `BILLING_SETUP.md`. Never paste private keys into chat.
