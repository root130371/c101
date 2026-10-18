import { billingHandler } from "../_shared/revenuecat.ts";

// Deploy with --no-verify-jwt: RevenueCat uses its own shared authorization secret.
Deno.serve(billingHandler("webhook", (name) => Deno.env.get(name)));
