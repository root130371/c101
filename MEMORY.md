# C101 project memory

Last updated: 2026-10-23

## User preference for future memory requests

When the user asks for memory, a recap, or where development stopped on this project, explain the results below in plain language. Distinguish implemented and tested code from live deployment and real store verification. Explain what each remaining step unlocks; do not simply list commits or claim payments are live. The user explicitly requested this reminder on October 19, 2026. This is an instruction for the next relevant conversation, not a scheduled notification.

## Correct project location

The active project is `C:\Users\alpha\OneDrive\Desktop\c101`, repository `https://github.com/root130371/c101`. The `c101` directory inside Pinebot is an older snapshot and must not be used for current development. C101 is a Turkish tenant assistant (Kira Asistani), with an Expo/React Native mobile app, a web prototype and a Supabase backend.

## Saved development checkpoint

- Branch: `work/c101-billing-20261017`; main was not merged or deployed by this work.
- `7e34f3a`: saved the existing uncommitted mobile app, backend changes and progress notes.
- `c58aea00269a9732a2e99293fd8ac19657ad0ed2`: implemented verified store billing and Android build preparation. Both commits were pushed; the remote branch hash was verified and the working tree was clean afterward.
- GitHub Actions passed for this implementation: https://github.com/root130371/c101/actions/runs/39171996551 . This is evidence for that commit, not a guarantee about future changes.
- A source-only pre-change backup was created at `C:\Users\alpha\AppData\Local\Temp\c101-source-before-billing-20261017.zip`. Temporary files are not a permanent backup; GitHub is the durable source checkpoint.

## What changed and why

1. Added authenticated `sync-store-billing` and secret-authorized `revenuecat-webhook`. The server queries RevenueCat rather than trusting a phone or webhook body to claim paid access. Transfers reconcile both Supabase user identities.
2. Added `supabase/upgrade_revenuecat_sync.sql`: service-role-only atomic reconciliation, one RevenueCat subscription row per user, duplicate-event audit protection and timestamp ordering. Older responses cannot overwrite newer state; manual access stays independent. The endpoint returns the canonical saved access state.
3. Subscription handling covers expiration, refunds and billing grace. Turning off renewal retains the paid period. Sandbox access requires explicit server opt-in. Promotional/lifetime products are not enabled by this recurring-subscription integration.
4. Purchase and Restore request backend verification. A completed payment awaiting verification is shown as pending and directs the user to Restore without another purchase. RevenueCat SDK configuration is no longer repeated when switching accounts; the code uses logIn.
5. Fixed missing expiry checks in the mobile entitlement query and both AI functions. Expired rows previously could retain paid limits.
6. Added Android APK preview and Play internal-test AAB build profiles. Owner-controlled package, bundle and Expo project identifiers must be supplied; no production identifiers were invented.
7. Excluded browser profiles, private env files and signing keys from Git. Limited GitHub Pages deployment artifacts to actual website assets. Added billing, database and mobile CI checks.

## Validation completed

- All 12 billing regression tests passed.
- Mobile and shared-server TypeScript checks passed; frontend/config syntax checks passed.
- Isolated PostgreSQL 17 checks passed for repeat migrations, service-role permissions, duplicate events, stale snapshots, expiration, renewal and preservation of manual access. Temporary database container was removed.
- GitHub CI passed at the implementation commit above.
- No real purchase, native store test or live billing activation was completed.

## External state and remaining work

At the October 17 inspection, Supabase project `gxqcacrtntnfnakitdaf` reported `INACTIVE`. Existing deployed functions were `analyze-evidence`, `ask-assistant` and `scrape-rental-listing`. RevenueCat secrets and the two new billing functions were absent. Do not present that historical inspection as a fresh health check.

The user was asked whether RevenueCat/Google Play accounts already exist and to restore the paused Supabase project. No answer or restored state was received before this checkpoint.

Next steps, in order:

1. Restore the existing Supabase project, verify its current status and inspect the deployed schema while preserving data.
2. Apply `upgrade_billing_foundation.sql`, then `upgrade_revenuecat_sync.sql`; deploy the billing functions and updated AI functions after checking prerequisites.
3. Configure the owner's RevenueCat, Google Play and Expo accounts, registered identifiers, entitlement `tenant_plus`, monthly product (proposed `tenant_plus_monthly`), public SDK keys and server-only secrets. Never request private keys in chat or put them in public Expo variables/Git.
4. Replace existing check-then-increment usage accounting with atomic accounting before concurrent paid traffic. Current reconciliation is atomic; existing AI quota accounting is not.
5. Build/install the native test app, upload an AAB to Play internal testing and configure license testers. Expo Go cannot validate native store billing.
6. Test purchase, Restore/reinstall, delayed verification, expiration, refund, cancellation, grace, transfer, duplicate events, authentication and usage limits end to end before enabling paid rollout.

Detailed instructions and acceptance checks: `docs/BILLING_SETUP.md`. Development history: `mobile_app_progress.md`, especially Payment Stage 2C. The setup guide contains links to the primary RevenueCat and Expo references used.

## Project switch

On October 19 the user requested saving this context, explaining these results on future c101 memory requests, and then switching back to Pinebot. Resume Pinebot as the active project after this memory save; no new Pinebot trading changes are authorized by the switch alone.


## 2026-10-23 Development resumed: atomic AI quotas

- User switched back from Pinebot and authorized continued development. Active checkout remains C:\Users\alpha\OneDrive\Desktop\c101; Pinebot's nested snapshot must not be used. Checkout was clean at b63ea94 before this work; no Pinebot trading changes accompany the project switch.
- Implemented service-role-only reserve_ai_usage/settle_ai_usage RPCs in supabase/upgrade_atomic_usage.sql. Admission holds a counter-row lock, derives active/unexpired Free/Plus limits inside the transaction, preserves existing counts and UTC periods, and includes pending requests in used_count. Refunds/commits are idempotent and committed requests cannot be refunded.
- Both AI endpoints use shared quota reservations instead of check-then-overwrite accounting. Handled work failures refund once; missing/malformed reservation RPC responses block provider work. Lost commit acknowledgement returns completed work without refunding it. Crashes or ambiguous reserve/settlement failures retain occupied quota for manual reconciliation; there is no unsafe automatic expiry. New periods are independent. Separate HTTP retries/document analyses are not deduplicated by this change. Evidence error writes now require confirmed ownership.
- Validation: 20 billing/shared/actual-handler tests passed; an additional real PostgreSQL concurrency test passed (40 admissions allow exactly five, 20 simultaneous releases refund exactly once). PostgreSQL17 repeat migrations, service permissions, cap enforcement, independent metrics, duplicate requests/settlements, entitlement expiry/upgrade, UTC periods and prior billing regressions passed. Edge Function TypeScript passed. Tests use disposable local data and mocked Gemini; no paid provider/store requests. CI now includes quota/Edge checks.
- Deployment/runbook: docs/ATOMIC_USAGE.md. Pause/drain BOTH AI functions, apply the new migration after billing foundation/RevenueCat migrations, deploy both updated functions, verify before resuming. Never mix old non-atomic handlers with new traffic. No cloud schema/function deployment, store activation, commit or push was performed in this development step.
- Fresh Supabase CLI projects-list check on Oct23 confirms gxqcacrtntnfnakitdaf is still INACTIVE (linked=false locally). Do not deploy migrations/functions until the existing project is restored and its schema inspected. Owner RevenueCat/Play/Expo setup and native purchase acceptance remain unverified; asked user for setup state. Atomic quota code closes one code gap; it does not make billing live.
- Final actual-checkout verification: all 21 tests passed including the real database concurrency test; Edge Function and mobile TypeScript plus frontend syntax and git diff whitespace checks passed. Changes are local and uncommitted on work/c101-billing-20261017.


## 2026-10-23 Continued development: trustworthy mobile usage display

- Fresh Supabase projects-list check still reports gxqcacrtntnfnakitdaf INACTIVE. No restoration/deployment or store activation occurred. Continued independently with a concrete mobile presentation defect after the atomic quota work.
- Fixed account usage reads that previously returned an empty list on error and thus displayed zero used/full allowance. Loading, unavailable and fresh snapshots are now distinct, with a Refresh plan and usage action and recoverable asynchronous load failures. Only a successful empty query implies zero usage.
- Added billingUsage.ts: filters each metric to its exact UTC period, ignores old first-of-month chat rows, rejects malformed/duplicate current counters, invalidates affected metrics after a period boundary, and derives remaining allowance from the verified current plan rather than an old counter limit. Pending reservations remain in used counts. Unknown entitlement is displayed explicitly; no plan card claims active Free and subscribe is disabled during loading/unknown-plan state. Restore remains available for verification recovery.
- Keyed the account panel by authenticated user identity so old-account async updates cannot populate the next account. Purchase/restore refresh account data afterward. Corrected existing Turkish verified-purchase/restore confirmations that still described the earlier unimplemented sync stage.
- Twelve new production-helper tests cover offline/exception/malformed data, zero-use success, period mixing and rollover, upgrade/expiry, unknown/loading plans and UTC/year boundaries. Prepared mobile code TypeScript check passed before applying. CI includes the new tests. No device/store acceptance is claimed. Prior local atomic quota changes are preserved.
- Final validation in the actual checkout: all 32 billing/quota/mobile-usage tests passed, mobile and Edge Function TypeScript passed, and git diff whitespace checks passed. Database code was unchanged in this display step; prior isolated PostgreSQL concurrency/migration results remain the earlier validation, not a fresh live check.
- Development remains local/uncommitted; deployment requires restoring Supabase and reviewing its existing schema, followed by the coordinated migration/AI deployment in docs/ATOMIC_USAGE.md.
