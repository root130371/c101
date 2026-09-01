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

Evidence status rules:

- `Mevcut değil`: no file exists.
- `İşleniyor`: upload or extraction is running.
- `Mevcut`: an image file exists and analysis passed.
- `Kontrol gerekli`: PDF/low-quality image/failed extraction needs review.

The current static app keeps evidence locally until real Supabase Auth is added. Once users can log in, evidence uploads should go into Supabase Storage under the user's own folder.

## Data Note

The nearby-rent map starts empty. Use the admin panel to enter İzmir / Narlıdere comparison rents manually. A production version should avoid scraping Sahibinden without permission. Safer options are licensed data feeds, partner integrations, user-submitted proof, and archived listing links/screenshots.

Demo admin login:

- Username: `admin`
- Password: `c101admin`

## Run

Open `index.html` directly in a browser.
