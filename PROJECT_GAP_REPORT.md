# Kiraci Kalkani Project Gap Report

Last updated: 2026-09-03

## Deployment Reminder

Use this rule before every release:

- Frontend files changed (`index.html`, `styles.css`, `app.js`, `README.md`): push to GitHub. GitHub Pages redeploys the website.
- Edge Function changed (`supabase/functions/**`): deploy Supabase functions again.
- Database changed (`supabase/schema.sql` or SQL migrations): run the SQL in Supabase SQL Editor.
- Secret changed (`GEMINI_API_KEY`, `GEMINI_CHAT_MODEL`, `GEMINI_DOCUMENT_MODEL`): usually no code deploy is needed, but redeploy the function if behavior looks stale.

Current function deploy commands:

```powershell
cd C:\Users\alpha\OneDrive\Desktop\c101
npx.cmd supabase functions deploy analyze-evidence --project-ref gxqcacrtntnfnakitdaf
npx.cmd supabase functions deploy ask-assistant --project-ref gxqcacrtntnfnakitdaf
```

## Current Status

AI foundation is started. The app now has Gemini-backed Supabase Edge Functions in code, local Supabase CLI setup through `npx.cmd`, frontend evidence upload calls `analyze-evidence` after remote upload, and the assistant calls `ask-assistant` for signed-in tenants. The remaining blocker is testing the deployed functions with a real signed-in tenant account and uploaded evidence.

## Remaining Gaps And Focus

1. Backend deployment verification

   The Gemini function must be deployed and tested with a real uploaded evidence file. Focus: deploy `analyze-evidence`, upload one bank receipt/photo, confirm `summary_tr`, `confidence`, and `extracted_json.ai` update in Supabase.

2. Evidence lifecycle

   Evidence can be uploaded and listed, but users need controls to delete, review, and manage items. Focus: add delete/remove actions, better metadata display, and later full preview/download.

3. Contract workflow

   Contract upload currently tracks a file name/status. Focus: store contracts as evidence, analyze clauses, extract rent/date/parties, and show risk flags separately from generic evidence.

4. Assistant backend

   The first backend pass is implemented. Focus: deploy `ask-assistant`, sign in with a real tenant account, ask varied questions about deposit, nonpayment risk, utility estimates, rent increases, and contract risk, then confirm rows are saved in `assistant_messages`.

5. Rental market data strategy

   Market listings are manually entered. Focus: keep manual proof entry strong now, then evaluate licensed sources/user-submitted screenshots rather than scraping protected sites.

6. Production security

   Current Supabase rules are a good start, but production needs tighter admin role management, storage/file deletion checks, rate limits, and abuse protection.

7. Account flow completion

   Auth works better now, but production needs email-confirmation handling, password reset landing behavior, account settings, and data export/delete.

8. Dashboard guidance

   The first screen should guide users through the tenant workflow: check rent, upload proof, compare market, draft reply. Focus: convert the dashboard into a step-based progress view.

9. Mobile quality pass

   The UI is responsive, but real phone testing is still needed. Focus: signup, evidence upload, map dragging, admin listing entry, and assistant copy flow on mobile.

## Recommended Build Order

1. Deploy and test AI evidence extraction.
2. Add evidence lifecycle controls.
3. Build contract-as-evidence workflow.
4. Deploy and test AI assistant Edge Function.
5. Improve dashboard guidance.
6. Harden account/security behavior.
7. Expand market proof workflow.
8. Do a full mobile pass.
