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

## Evidence Analysis AI Dependency Report

Evidence analysis and assistant chat are two separate AI pipelines:

```text
supabase/functions/analyze-evidence/index.ts
  Analyzes uploaded evidence files such as PDFs, images, receipts, screenshots, and later Word documents.

supabase/functions/ask-assistant/index.ts
  Answers tenant questions using saved case facts, extracted evidence summaries, rent calculations, market listings, and chat history.
```

Important dependency rule:

- If only `ask-assistant` is moved to Gemini, chat can work on Gemini but document/evidence analysis may still fail on OpenAI quota.
- If only `analyze-evidence` is moved to Gemini, document summaries can work on Gemini but chat may still fail on OpenAI quota.
- To make the whole prototype work without OpenAI API credits, both functions should use the same configurable provider layer.

Recommended future configuration:

```text
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_CHAT_MODEL=gemini-2.5-flash
GEMINI_DOCUMENT_MODEL=gemini-2.5-flash
```

Document analysis quota policy:

- Treat each document upload as expensive compared with a normal chat question.
- Analyze each uploaded file once and store the extracted result in `evidence_items`.
- Future chat questions should use `summary_tr`, `summary_en`, `confidence`, and `extracted_json` instead of resending the original file.
- For large contracts, analyze only a limited page range or ask the user to upload/select the relevant pages.
- Word files should be converted/extracted to text first; avoid sending full `.docx` binaries repeatedly.
- A reasonable prototype limit is 3 document analyses per user per day and 10-20 chat questions per user per day.

OpenAI billing rule:

- The current OpenAI-backed evidence analysis requires OpenAI API billing/credits.
- A normal ChatGPT Free/Plus/Pro account quota is not enough for this deployed app.
- ChatGPT subscriptions and OpenAI API billing are separate systems.
- ChatGPT personal usage credits are for supported ChatGPT/Codex/Work features and are not API credits for this app.
- There is no supported way for a public website or Supabase Edge Function to spend the owner's normal ChatGPT message quota.

For a no-card prototype, migrate both `analyze-evidence` and `ask-assistant` to Gemini Free Tier, then keep the conservative limits above. Before Google Play release, revisit provider privacy terms, explicit consent, rate limits, abuse controls, and paid production billing.

## Data Note

The nearby-rent map starts empty. It reads public `rent_listings` rows from Supabase when available. A real Supabase admin can add, edit, and delete listings. The demo admin login still works as a local fallback.

Demo admin login:

- Username: `admin`
- Password: `c101admin`

## Run

Open `index.html` directly in a browser.
