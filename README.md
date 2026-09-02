# Kiracı Kalkanı Prototype

Mobile-first prototype for a Turkey-focused tenant assistant.

## Included

- Rent increase calculator using a configurable 12-month CPI average.
- Contract upload placeholder and risk flag UI.
- Evidence vault with required file upload before evidence can become usable.
- Local image analysis for evidence photos: preview, dimensions, file size, and quality status.
- Nearby rent comparison map populated from admin-entered Narlıdere data.
- Interactive OpenStreetMap view with pan/zoom, address lookup, map-click coordinate capture, and draggable admin pin placement.
- Assistant draft that uses current rent, requested rent, evidence count, contract status, and nearby listing count.

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

## AI Extraction

The Edge Function skeleton lives here:

```text
supabase/functions/analyze-evidence/index.ts
```

It calls OpenAI only from the Supabase Edge Function. Never put `OPENAI_API_KEY` in `app.js`, GitHub Pages, or any frontend file.

Add the secret from the project folder after installing/logging into the Supabase CLI:

```powershell
cd C:\Users\alpha\OneDrive\Desktop\c101
supabase link --project-ref gxqcacrtntnfnakitdaf
supabase secrets set OPENAI_API_KEY=sk-your-real-key-here
supabase functions deploy analyze-evidence
```

Optional model override:

```powershell
supabase secrets set OPENAI_MODEL=gpt-5-mini
```

You can also add it in Supabase Dashboard:

1. Open your Supabase project.
2. Go to `Edge Functions`.
3. Open `Secrets`.
4. Add a secret named exactly `OPENAI_API_KEY`.
5. Paste the OpenAI API key as the value.
6. Deploy or redeploy `analyze-evidence`.

## Data Note

The nearby-rent map starts empty. It reads public `rent_listings` rows from Supabase when available. A real Supabase admin can add, edit, and delete listings. The demo admin login still works as a local fallback.

Demo admin login:

- Username: `admin`
- Password: `c101admin`

## Run

Open `index.html` directly in a browser.
