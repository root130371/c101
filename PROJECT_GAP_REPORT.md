# Kiraci Kalkani Project Gap Report

Last updated: 2026-09-03

## Deployment Reminder

Use this rule before every release:

- Frontend files changed (`index.html`, `styles.css`, `app.js`, `README.md`): push to GitHub. GitHub Pages redeploys the website.
- Edge Function changed (`supabase/functions/**`): deploy Supabase functions again.
- Database changed (`supabase/schema.sql` or SQL migrations): run the SQL in Supabase SQL Editor.
- Secret changed (`OPENAI_API_KEY`, `OPENAI_MODEL`): usually no code deploy is needed, but redeploy the function if behavior looks stale.

Current function deploy command:

```powershell
cd C:\Users\alpha\OneDrive\Desktop\c101
npx.cmd supabase functions deploy analyze-evidence --project-ref gxqcacrtntnfnakitdaf
```

## Current Status

AI foundation is started. The app now has an OpenAI-backed Supabase Edge Function in code, local Supabase CLI setup through `npx.cmd`, and frontend evidence upload calls the function after remote upload. The remaining blocker is deploying the function after Supabase login is complete.

## Remaining Gaps And Focus

1. Backend deployment verification

   The OpenAI function must be deployed and tested with a real uploaded evidence file. Focus: deploy `analyze-evidence`, upload one bank receipt/photo, confirm `summary_tr`, `confidence`, and `extracted_json.ai` update in Supabase.

2. Evidence lifecycle

   Evidence can be uploaded and listed, but users need controls to delete, review, and manage items. Focus: add delete/remove actions, better metadata display, and later full preview/download.

3. Contract workflow

   Contract upload currently tracks a file name/status. Focus: store contracts as evidence, analyze clauses, extract rent/date/parties, and show risk flags separately from generic evidence.

4. Assistant backend

   The assistant is currently template-based. Focus: create a Supabase Edge Function for AI replies that uses rent calculation, evidence summaries, contract findings, and market listings as context.

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
4. Build AI assistant Edge Function.
5. Improve dashboard guidance.
6. Harden account/security behavior.
7. Expand market proof workflow.
8. Do a full mobile pass.
