# C101 Sahibinden Opera Extension

Unpacked local extension for collecting visible Sahibinden rental listing fields into JSON for the C101 admin importer.

## Install In Opera

1. Open Opera.
2. Go to `opera://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select this folder:

```text
C:\Users\alpha\OneDrive\Desktop\c101\tools\sahibinden-opera-extension
```

## Use

1. Open the extension popup.
2. Paste Sahibinden listing URLs into `URL kuyruğu`.
3. Click `Kuyruğu kaydet`.
4. Click `Sonrakini aç`.
5. On the opened listing page, open the extension popup and click `Bu ilanı al`.
6. To move faster, click `Al ve sonrakini aç`.
7. When finished, click `JSON kopyala`.
8. Paste the JSON into C101 `Account -> İlan verisini yapıştır`.
9. Click `İlanları kuyruğa al`, review, and approve.

## Notes

- This does not bypass access blocks, captchas, or login requirements.
- It extracts only fields visible to your browser.
- Duplicate URLs replace older collected rows.
- `Her şeyi temizle` clears both the URL queue and collected listing batch.
