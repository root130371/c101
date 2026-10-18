# Store billing checkpoint — 2026-10-17

The app now requests server verification after purchase and restore. The server reads the authenticated Supabase user, queries RevenueCat, and saves a provider-owned entitlement through a service-role-only SQL function. Client claims cannot grant Plus. RevenueCat webhooks query the same API and reconcile transfers on both accounts. Canceled auto-renew retains access until expiration; refunds and expired subscriptions lose access. Grace periods are honored. Sandbox purchases are denied unless explicitly enabled on the server.

## Current external state

Supabase project `gxqcacrtntnfnakitdaf` reported `INACTIVE` on October 17. Its deployed function list contains `analyze-evidence`, `ask-assistant`, and `scrape-rental-listing`; neither billing function is deployed. RevenueCat server secrets are absent. No store purchase, native build, or production activation has been verified. This checkpoint does not assert that the app is ready for paying customers.

## Database and function deployment

1. Restore the existing project in the Supabase dashboard. Preserve its data and settings.
2. Run `supabase/upgrade_billing_foundation.sql`, then `supabase/upgrade_revenuecat_sync.sql` in the SQL editor. Both are safe to rerun. Do not rerun the full initial schema over an existing database.
3. Set Edge Function secrets using the dashboard or an ignored env file: `REVENUECAT_SECRET_API_KEY` (server secret key supporting API v1), `REVENUECAT_ENTITLEMENT_ID=tenant_plus`, and `REVENUECAT_WEBHOOK_AUTHORIZATION` (a long random value, including the `Bearer ` prefix). Never use `EXPO_PUBLIC_` for server secrets. For isolated sandbox testers only, set `REVENUECAT_ALLOW_SANDBOX=true`; keep it false/unset for production. Do not reuse production accounts for sandbox purchases.
4. From the repository root, deploy:

```powershell
npx supabase functions deploy sync-store-billing --project-ref gxqcacrtntnfnakitdaf
npx supabase functions deploy revenuecat-webhook --project-ref gxqcacrtntnfnakitdaf --no-verify-jwt
npx supabase functions deploy ask-assistant --project-ref gxqcacrtntnfnakitdaf
npx supabase functions deploy analyze-evidence --project-ref gxqcacrtntnfnakitdaf
```

`sync-store-billing` must keep gateway JWT verification enabled. The webhook uses its own mandatory secret header. Configure RevenueCat's webhook URL as `https://gxqcacrtntnfnakitdaf.supabase.co/functions/v1/revenuecat-webhook` and copy the exact authorization value. Subscribe to all lifecycle events including transfers. Do not acknowledge failed verification as success: retries must remain possible.

## RevenueCat and Google Play

1. Register the application in the owner's Google Play and Expo accounts and record its final package identifier. Create the RevenueCat project and Android app, connect Play service credentials, and configure `tenant_plus_monthly` with a monthly base plan. Match identifiers to the actual Play product; do not create duplicates if products already exist.
2. Add entitlement `tenant_plus`; attach the product and expose it through the current offering's monthly package. Set an explicit `EXPO_PUBLIC_REVENUECAT_PRODUCT_ID` matching the product reported by the SDK.
3. Copy `c101-mobile/.env.example` to ignored `.env`. Fill the public Android SDK key, Supabase public values, product identifier, and `C101_ANDROID_PACKAGE`. Set `C101_EAS_PROJECT_ID` after linking the owner's Expo project. Add these values to the chosen EAS build environment too. Public SDK keys may ship with the app; RevenueCat server keys and store service-account credentials must not.
4. In `c101-mobile`, authenticate with EAS, link the project and run `npx eas-cli build --platform android --profile preview` for an installable APK. Run `npx eas-cli build --platform android --profile store-test` for the Play internal-testing AAB. Upload that AAB to the internal test track and configure license testers. A standalone APK validates native integration, but the Play test track is the purchase acceptance path. Expo Go cannot validate the native billing module.

## Acceptance checks before enabling paid access

- Run `node --test tests/billing.test.mjs` with Node 24 and `npm run typecheck --prefix c101-mobile`.
- Verify missing/wrong webhook authorization is rejected and a RevenueCat test event returns success.
- Purchase on a license tester: one provider row appears, Plus limits become available, and Restore recovers access after reinstall.
- Delay the verification endpoint: the app reports pending verification and directs the user to Restore, without prompting another purchase or creating a manual request for a completed payment.
- Cancel auto-renew: access lasts through the paid period. Test expiration, refund, billing grace, and transfer to a second Supabase account.
- Retry identical events and submit stale snapshots: no duplicate provider subscriptions or stale grants. Manual access remains intact.
- Test the daily/monthly usage limits and authentication on the deployed AI functions. Existing usage accounting still uses check-then-increment and needs atomic reservation before concurrent paid traffic is opened.

## References

- [RevenueCat webhook reconciliation, authorization and retries](https://www.revenuecat.com/docs/integrations/webhooks)
- [RevenueCat subscriber response](https://www.revenuecat.com/docs/api-v1/customer-info-model)
- [Expo build profiles](https://docs.expo.dev/build/eas-json/)

Remaining work requires active Supabase infrastructure, account-owned store identifiers and keys, and a physical/native store test. Do not describe the payment integration as live until those checks pass.

## Local validation completed

Twelve billing regression tests passed. Mobile and shared-server TypeScript checks and frontend syntax checks passed. PostgreSQL 17 checks passed for repeat migrations, service-role isolation, duplicate events, stale snapshots, expiry, manual access and renewal. The temporary database container was removed. These checks use isolated fixtures; live store acceptance remains pending.
