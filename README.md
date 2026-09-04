# Kiracı Kalkanı Prototype

Mobile-first prototype for a Turkey-focused tenant assistant.

## Included

- Rent increase calculator using a configurable 12-month CPI average.
- Contract upload placeholder and risk flag UI.
- Evidence vault with required file upload before evidence can become usable.
- Local image analysis for evidence photos: preview, dimensions, file size, and quality status.
- Nearby rent comparison map populated from admin-entered Narlıdere data.
- Interactive OpenStreetMap view with pan/zoom, address lookup, map-click coordinate capture, and draggable admin pin placement.
- Authenticated AI assistant that answers tenant questions using the current rent calculation, evidence summaries, contract status, nearby listing data, and saved chat history.

## Backend Foundation

Supabase project:

```text
SUPABASE_URL=https://gxqcacrtntnfnakitdaf.supabase.co
```

Run this file in Supabase SQL Editor when ready:

```text
supabase/schema.sql
```

That creates the first production tables, Row Level Security policies, and a private `evidence` storage bucket.

If `schema.sql` was already applied before the extraction insert policy was added, run:

```text
supabase/upgrade_no_api_key.sql
```

After signing up through the app, make your own account a real listing admin by running this in Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@example.com';
```

Evidence status rules:

- `Mevcut değil`: no file exists.
- `İşleniyor`: upload or extraction is running.
- `Mevcut`: an image file exists and analysis passed.
- `Kontrol gerekli`: PDF/low-quality image/failed extraction needs review.

The current static app supports Supabase Auth. Logged-in users upload evidence files into the private `evidence` bucket under their own user ID. A matching `evidence_items` row is created, and an `extraction_jobs` row is queued for the future AI processor.

## AI Functions

The Edge Functions live here:

```text
supabase/functions/analyze-evidence/index.ts
supabase/functions/ask-assistant/index.ts
```

They call OpenAI only from Supabase Edge Functions. Never put `OPENAI_API_KEY` in `app.js`, GitHub Pages, or any frontend file.

Add the secret from the project folder after installing/logging into the Supabase CLI:

```powershell
cd C:\Users\alpha\OneDrive\Desktop\c101
supabase link --project-ref gxqcacrtntnfnakitdaf
supabase secrets set OPENAI_API_KEY=sk-your-real-key-here
supabase functions deploy analyze-evidence
supabase functions deploy ask-assistant
```

Optional model override:

```powershell
supabase secrets set OPENAI_MODEL=gpt-5-mini
supabase secrets set OPENAI_ASSISTANT_MODEL=gpt-5-mini
```

You can also add it in Supabase Dashboard:

1. Open your Supabase project.
2. Go to `Edge Functions`.
3. Open `Secrets`.
4. Add a secret named exactly `OPENAI_API_KEY`.
5. Paste the OpenAI API key as the value.
6. Deploy or redeploy `analyze-evidence` and `ask-assistant`.

Assistant behavior:

- Signed-in tenants get OpenAI-backed answers from `ask-assistant`.
- User and assistant messages are saved in `public.assistant_messages`.
- The assistant can answer diverse tenant questions about rent increases, deposits, unpaid rent risk, contracts, evidence, market comparisons, moving costs, and utility estimates.
- It should ask follow-up questions when required facts are missing and should not present legal guidance as definitive legal advice.
- Guest/demo mode asks the user to sign in instead of showing a fake AI answer.

If the assistant returns `openai_credit_balance_exhausted`, the OpenAI API organization has no prepaid API credits left. This is separate from ChatGPT plan usage and normally does not have an automatic reset date; add API credits in OpenAI Platform billing and retry after a few minutes.

## Pre-Release AI Provider Warning

Before any official Google Play release, review and replace the prototype AI provider setup. If Gemini Free Tier is used during development, document the privacy/quota tradeoff clearly: free-tier prompts and responses may be used to improve Google products, and daily limits can interrupt the assistant. Production should use a paid provider configuration, tenant consent language, rate limits, abuse controls, and a privacy policy that matches the provider terms.

## Conservative Document AI Policy

PDF, Word, and image uploads should be handled conservatively to avoid wasting quota and exposing unnecessary personal data:

- Upload the original file once to the private Supabase `evidence` bucket.
- Run extraction once per file, then save only structured fields, short summaries, confidence, and risk flags in `evidence_items`.
- Do not resend full PDF/Word files to the chat assistant on every question.
- Chat should use saved summaries and extracted fields by default.
- Only re-analyze the original file when the user explicitly asks a document-specific question that cannot be answered from the saved summary.
- Prefer redacted summaries for AI prompts; avoid sending Turkish ID numbers, bank IBANs, phone numbers, emails, signatures, and full addresses unless strictly needed.
- Limit file size, page count, daily extraction count, and daily chat count per user before production.

## Data Note

The nearby-rent map starts empty. It reads public `rent_listings` rows from Supabase when available. A real Supabase admin can add, edit, and delete listings. The demo admin login still works as a local fallback.

Demo admin login:

- Username: `admin`
- Password: `c101admin`

## Run

Open `index.html` directly in a browser.
