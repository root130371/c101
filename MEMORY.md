# C101 project memory

Last updated: 2026-10-19

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
