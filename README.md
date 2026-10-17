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

If `schema.sql` was already applied before the rental import queue was added, run:

```text
supabase/upgrade_rental_imports.sql
```

If `schema.sql` was already applied before the billing foundation was added, run:

```text
supabase/upgrade_billing_foundation.sql
```

This creates processor-neutral subscription, usage counter, and billing event
tables. It does not connect a live checkout provider yet; subscription writes
should later come from a trusted Supabase Edge Function/webhook using the
service role.

The current mobile app also supports a no-company/no-merchant onboarding
payment foundation:

- signed-in users can request Tenant Plus from the Account screen;
- requests are stored in `billing_upgrade_requests`;
- requests do not grant paid access by themselves;
- an admin or future verified payment webhook must create/update
  `billing_subscriptions`;
- `ask-assistant` enforces daily chat limits;
- `analyze-evidence` enforces monthly contract/evidence analysis limits.

For early testing without opening a company or connecting a live card processor,
manually grant Tenant Plus after a user requests it:

```sql
insert into public.billing_subscriptions (
  user_id,
  plan_key,
  status,
  processor,
  current_period_start,
  current_period_end
)
select
  id,
  'tenant_plus',
  'active',
  'manual',
  now(),
  now() + interval '30 days'
from auth.users
where email = 'your-user@example.com';
```

Then mark the request approved:

```sql
update public.billing_upgrade_requests
set status = 'approved', updated_at = now()
where user_id = (
  select id from auth.users where email = 'your-user@example.com'
)
and status = 'pending';
```

## App-Store Billing Foundation

The mobile app has the RevenueCat React Native SDK installed for future Apple
App Store / Google Play Billing subscriptions:

```text
react-native-purchases
```

The Account screen now attempts app-store billing first. If the current build
does not support native billing, or if RevenueCat keys are missing, it falls
back to the manual Plus request flow above.

Required public Expo environment values before testing real store billing:

```text
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_...
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=tenant_plus
```

Important: native in-app purchases do not fully work in Expo Go. Use an EAS
development build, Google Play internal/closed testing, or TestFlight for real
purchase testing.

Current RevenueCat stage:

- app SDK installed;
- store billing wrapper added;
- Account screen can subscribe/restore when native billing is available;
- no RevenueCat webhook is connected yet;
- no automatic Supabase entitlement sync is connected yet.

Until webhook sync is added, a successful store purchase should be treated as
store-side proof only. Supabase `billing_subscriptions` still controls server
limits for AI/document usage.

The mobile app uses Google OAuth for sign-in instead of manual email/password accounts. In Supabase Dashboard, enable `Authentication -> Providers -> Google`, add your Google OAuth client credentials, and add the current Expo/web URL plus the native callback to the allowed redirect URLs:

```text
http://localhost:8086
c101://auth/callback
```

For production, also add the production app/site URL.

If Expo/web is currently running on a different port or tunnel URL, add that exact URL to Supabase too. You can also force the app OAuth return URL with:

```text
EXPO_PUBLIC_AUTH_REDIRECT_URL=http://localhost:8086
```

Guest mode is disabled; users must sign in with Google before entering the app. After signing in through Google, make your own account a real listing admin by running this in Supabase SQL Editor:

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

They call Gemini only from Supabase Edge Functions. Never put `GEMINI_API_KEY` in `app.js`, GitHub Pages, or any frontend file.

Add the secret from the project folder after installing/logging into the Supabase CLI:

```powershell
cd C:\Users\alpha\OneDrive\Desktop\c101
supabase link --project-ref gxqcacrtntnfnakitdaf
supabase secrets set GEMINI_API_KEY=your-gemini-key-here
supabase functions deploy analyze-evidence
supabase functions deploy ask-assistant
supabase functions deploy scrape-rental-listing
```

Optional model override:

```powershell
supabase secrets set GEMINI_DOCUMENT_MODEL=gemini-3.5-flash-lite
supabase secrets set GEMINI_CHAT_MODEL=gemini-3.5-flash-lite
```

You can also add it in Supabase Dashboard:

1. Open your Supabase project.
2. Go to `Edge Functions`.
3. Open `Secrets`.
4. Add a secret named exactly `GEMINI_API_KEY`.
5. Paste the Gemini API key as the value.
6. Deploy or redeploy `analyze-evidence` and `ask-assistant`.

Assistant behavior:

- Signed-in tenants get Gemini-backed answers from `ask-assistant`.
- User and assistant messages are saved in `public.assistant_messages`.
- The assistant can answer diverse tenant questions about rent increases, deposits, unpaid rent risk, contracts, evidence, market comparisons, moving costs, and utility estimates.
- It should ask follow-up questions when required facts are missing and should not present legal guidance as definitive legal advice.
- Guest/demo mode asks the user to sign in instead of showing a fake AI answer.

If the assistant returns `gemini_resource_exhausted`, the Gemini project has hit a free-tier quota or rate limit. Requests-per-day quotas reset at midnight Pacific Time; minute/token limits reset sooner.

## Research-Grounded Assistant Plan

The current assistant answers from the app's saved case data, extracted evidence summaries, rent calculations, market rows, and chat history. That is the cheapest/default path and should stay the default for normal questions.

For questions that need current public information, add an optional research-grounded path instead of guessing. Examples:

- "What is the current TEFE/TUFE limit?"
- "My landlord increased rent this month; what official rate should I compare against?"
- "Find the relevant Turkish law article for deposit return."
- "Use official sources to explain what happens if I miss rent twice."

Recommended behavior:

- Use ordinary Gemini chat for document summaries, draft replies, checklist logic, and questions that can be answered from stored case facts.
- Use Gemini Grounding with Google Search only when the answer needs current or source-backed public information.
- Prefer official Turkish sources first, especially `tuik.gov.tr`, `mevzuat.gov.tr`, `resmigazete.gov.tr`, courts/government pages, and then reputable secondary explanations if official pages are not enough.
- Show source links/citations in the assistant response whenever grounding is used.
- Store only the final short answer, cited URLs, and source titles in `assistant_messages`; do not store full scraped pages.
- Add a clear UI marker such as "Sources checked" when grounded search was used.
- Keep this off for every-message use because search grounding can have separate quota, pricing, and latency from normal model calls.

Implementation note: Gemini supports Google Search grounding through the Gemini API, returning grounding metadata/citations that the frontend can display. Relevant docs: `https://ai.google.dev/gemini-api/docs/google-search`.

## Assistant Routing And Product Value Plan

The assistant should not behave like a generic search answer machine. Users come to the app because they want help with their own tenancy situation, contract, evidence, deposit risk, rent increase, or landlord message.

Default behavior should be a router plus guided intake:

- First classify the user message internally.
- If the question is simple and general, answer normally with the cheap model.
- If the question is personal/situation-specific, ask 2-4 focused follow-up questions before giving a conclusion.
- If the question depends on the uploaded contract, use the saved contract summary/extracted clauses or ask the user to upload/select the relevant contract.
- If the question depends on photos/files/evidence, use the saved evidence analysis or ask for the relevant upload.
- If the question depends on current legal rates, official law text, deadlines, or public sources, use the grounded/search path and show citations.
- If the user needs action, generate a practical output such as a landlord message, checklist, objection letter draft, evidence list, or risk summary.

Example:

```text
User: I nailed something to the wall. Will I get my deposit back?

Bad generic answer:
It depends on the contract and whether there is damage.

Better app behavior:
Ask whether the holes were repaired, whether there are move-in/move-out photos, whether the contract mentions wall fixtures, and whether the landlord already made a deduction. Then give a low/medium/high deposit-risk estimate, evidence checklist, and a landlord message draft.
```

Grounded search should not be used for every message. It should be triggered only when the answer needs current/source-backed public information, such as the current rent increase rate, official legal article, deadline, government form, or official-source citation.

Planned internal router JSON shape:

```json
{
  "intent": "deposit_damage",
  "needs_grounding": false,
  "needs_contract": true,
  "needs_evidence": true,
  "missing_facts": [
    "Was the wall repaired?",
    "Do you have move-in photos?",
    "Does the contract mention wall fixtures?"
  ],
  "answer_mode": "guided_intake"
}
```

Product rule:

- The default assistant value is personalized case handling, not generic legal text.
- Use follow-up questions to collect missing facts.
- Use uploaded contract/evidence summaries when relevant.
- Use grounded search only when source freshness or citation matters.
- Prefer outputs the tenant can act on: risk level, checklist, message draft, document draft, and next steps.

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

- Both `ask-assistant` and `analyze-evidence` now use Gemini.
- Chat and document analysis depend on the same `GEMINI_API_KEY`, but use separate model secrets so each path can be tuned independently.
- To move to another provider later, preserve the same function contracts and database updates.

Recommended future configuration:

```text
GEMINI_API_KEY=...
GEMINI_CHAT_MODEL=gemini-3.5-flash-lite
GEMINI_DOCUMENT_MODEL=gemini-3.5-flash-lite
```

Document analysis quota policy:

- Treat each document upload as expensive compared with a normal chat question.
- Analyze each uploaded file once and store the extracted result in `evidence_items`.
- Future chat questions should use `summary_tr`, `summary_en`, `confidence`, and `extracted_json` instead of resending the original file.
- For large contracts, analyze only a limited page range or ask the user to upload/select the relevant pages.
- Word files should be converted/extracted to text first; avoid sending full `.docx` binaries repeatedly.
- A reasonable prototype limit is 3 document analyses per user per day and 10-20 chat questions per user per day.

OpenAI billing rule:

- The app no longer needs OpenAI API credits while both functions use Gemini.
- A normal ChatGPT Free/Plus/Pro account quota is not enough for this deployed app.
- ChatGPT subscriptions and OpenAI API billing are separate systems.
- ChatGPT personal usage credits are for supported ChatGPT/Codex/Work features and are not API credits for this app.
- There is no supported way for a public website or Supabase Edge Function to spend the owner's normal ChatGPT message quota.

For this no-card prototype, both `analyze-evidence` and `ask-assistant` use Gemini Free Tier-compatible defaults. Keep the conservative limits above. Before Google Play release, revisit provider privacy terms, explicit consent, rate limits, abuse controls, and paid production billing.

## AI Cost And GLM Comparison

Keep the planned limits unchanged for business estimates:

Free plan:

- 5 chat messages per day.
- 1 contract upload per month.
- 2 evidence/file uploads per month.

Tenant Plus plan at 10 USD/month:

- 50 chat messages per day.
- 10 contract uploads per month.
- 25 evidence/file uploads per month.
- Saved analyses, PDF/Word exports, longer answers, more grounded/source-backed answers, and saved case history.

Token assumptions used for estimates:

- Normal chat: 1,000 input tokens and 500 output tokens.
- Contract upload analysis: 8,000 input tokens and 1,500 output tokens.
- Evidence/file analysis: 5,000 input tokens and 1,200 output tokens.

Approximate paid API prices checked during planning:

- Gemini Flash-Lite style estimate: input 0.30 USD / 1M tokens, output 2.50 USD / 1M tokens.
- GLM-4.5-Air: input 0.20 USD / 1M tokens, output 1.10 USD / 1M tokens.
- GLM-4.7-FlashX: input 0.07 USD / 1M tokens, output 0.40 USD / 1M tokens.
- GLM web search tool: about 0.01 USD per search use.

Provider references:

- Gemini pricing: `https://ai.google.dev/gemini-api/docs/pricing`
- Z.AI / GLM pricing: `https://docs.z.ai/guides/overview/pricing`

Approximate per-action cost:

| Provider/model | Normal chat | Contract upload | Evidence upload |
| --- | ---: | ---: | ---: |
| Gemini Flash-Lite estimate | 0.00155 USD | 0.00615 USD | 0.00450 USD |
| GLM-4.5-Air | 0.00075 USD | 0.00325 USD | 0.00232 USD |
| GLM-4.7-FlashX | 0.00027 USD | 0.00116 USD | 0.00083 USD |

Approximate free-user monthly AI cost at the planned free limits:

| Provider/model | Cost per free user/month | Cost for 1,000 free users/month |
| --- | ---: | ---: |
| Gemini Flash-Lite estimate | about 0.25 USD | about 250 USD |
| GLM-4.5-Air | about 0.12 USD | about 120 USD |
| GLM-4.7-FlashX | about 0.04 USD | about 43 USD |

Approximate monthly profit at 10 percent paid conversion and 10 USD/month, before salaries, taxes, legal review, and larger hosting costs:

| Total users | Paid users | Gemini estimate | GLM-4.5-Air estimate | GLM-4.7-FlashX estimate |
| ---: | ---: | ---: | ---: | ---: |
| 100 | 10 | about 60-85 USD | about 70-95 USD | about 75-100 USD |
| 1,000 | 100 | about 600-850 USD | about 720-970 USD | about 800-1,050 USD |
| 10,000 | 1,000 | about 6,000-8,500 USD | about 7,200-9,700 USD | about 8,000-10,500 USD |

Important business rule:

- GLM can reduce normal model-token costs substantially.
- Grounded/search answers can erase those savings if every message uses web search.
- Keep grounded answers separately limited and use them only for current law/rates, official sources, deadlines, government forms, or citation-heavy answers.
- Before using GLM or any non-current provider in production, review data privacy, retention, training-use terms, Turkey/KVKK implications, Google Play disclosures, and tenant upload consent.

## Data Note

The nearby-rent map starts empty. It reads public `rent_listings` rows from Supabase when available. A real Supabase admin can add, edit, and delete listings. The demo admin login still works as a local fallback.

Demo admin login:

- Username: `admin`
- Password: `c101admin`

## Run

Open `index.html` directly in a browser.
