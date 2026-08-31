# Kiracı Kalkanı Prototype

Mobile-first static prototype for a Turkey-focused tenant assistant.

## Included

- Rent increase calculator using a configurable 12-month CPI average.
- Contract upload placeholder and risk flag UI.
- Deposit and payment evidence vault.
- Nearby rent comparison map populated only from admin-entered Narlidere data.
- Interactive OpenStreetMap view with pan/zoom, address lookup, map-click
  coordinate capture, and draggable admin pin placement.
- Dispute-preparation checklist and guarded assistant draft.

## Data Note

The nearby-rent map starts empty. Use the admin panel to enter Izmir /
Narlidere comparison rents manually. Admins can enter an address, search it on
the map, click the map, or drop a draggable pin and refine the exact location.
A production version should avoid scraping Sahibinden without permission.
Safer options are licensed data feeds, partner integrations, user-submitted
proof, and archived listing links/screenshots.

Demo admin login:

- Username: `admin`
- Password: `c101admin`

## Run

Open `index.html` directly in a browser.
