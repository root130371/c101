import { billingHandler } from "../_shared/revenuecat.ts";

Deno.serve(billingHandler("sync", (name) => Deno.env.get(name)));
