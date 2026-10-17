# Codex UI Integration & Design System Guide: Kira Asistanı Mobile App

This document serves as an explicit design system specification and integration guide for **Codex** (and AI/human software engineers) to build, replicate, and refine the **Kira Asistanı (Turkey Tenant Guide)** mobile UI application.

---

## 1. Executive Summary & Design Rationale

### Context & Target Audience
In Turkey, rental property management is often accompanied by high legal friction, shifting TÜFE (CPI) rent increase caps, and complex obligations under the Turkish Code of Obligations (*Türk Borçlar Kanunu - TBK*). Tenants require a mobile app that feels **authoritative, reassuring, fast, and frictionless**.

### Core Visual Principles
1. **Warm Emerald Palette (`#1e5338` / `#22c55e`)**: Green conveys legality, financial safety, and resolution. Combining rich dark emerald headers with a soft warm paper background (`#F5F3EF`) prevents visual fatigue while maintaining an official, trustworthy feel.
2. **Mobile-First Touch Ergonomics**:
   - Fixed Bottom Navigation Bar anchored with safe touch padding (`py-2`, minimum 44px touch targets).
   - High visual hierarchy using rounded cards (`rounded-2xl` / `rounded-3xl`) with soft elevated shadows (`0 10px 30px -5px rgba(0, 0, 0, 0.05)`).
   - Micro-tactile feedback using `active:scale-95` on touchable elements.
3. **Scannable Micro-Information**: Bold numerical highlights, badges for legal rate alerts (TÜFE), and segmented card layouts for easy parsing during active negotiations with landlords.

---

## 2. Design System Tokens & Configuration

### Tailwind CSS Extension Config
When initializing Tailwind CSS in Next.js, Vite, or React Native (NativeWind), configure the theme extension as follows:

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',
          700: '#1e5338', // Signature Dark Emerald Accent
          800: '#143b27',
          900: '#0e291b',
        },
        warmBg: '#F5F3EF',      // Neutral tactile paper background
        cardBg: '#FFFFFF',
        sandAccent: '#EFECE6'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'mobile-bottom': '0 -4px 20px -2px rgba(0, 0, 0, 0.08)',
        'card-soft': '0 10px 30px -5px rgba(0, 0, 0, 0.05)',
        'float-btn': '0 8px 24px -4px rgba(22, 163, 74, 0.4)'
      }
    }
  }
}
```

---

## 3. UI Shell & Mobile App Architecture

Codex must maintain the strictly constrained single-screen mobile layout.

```
┌────────────────────────────────────────────────────────┐
│ [09:41]                [Dynamic Island]           [5G] │ <-- Mobile Status Bar
├────────────────────────────────────────────────────────┤
│ 🏠 Kira Asistanı [TR]                           [🔔]   │ <-- App Header
├────────────────────────────────────────────────────────┤
│                                                        │
│             DYNAMIC TAB SCROLL AREA                    │
│             (Home / Calc / Rights / Log / Chat)        │
│                                                        │
├────────────────────────────────────────────────────────┤
│ [🏠 Home]  [🧮 Calc]  [⚖️ Rights]  [🔍 Log]  [🤖 AI]   │ <-- Sticky Bottom Nav Bar
└────────────────────────────────────────────────────────┘
```

### Mobile Layout Key Rules
- **Viewport Locking**: Apply `user-scalable=no, maximum-scale=1.0` in viewport meta tags.
- **Scroll Containment**: Main content container uses `flex-1 overflow-y-auto no-scrollbar pb-24`.
- **Z-Index Stack**:
  - Main Content: `z-0`
  - Sticky Bottom Navigation: `z-40` with `backdrop-blur-md`
  - Floating Toasts / Alerts: `z-50`

---

## 4. Feature Implementation Guidelines for Codex

### A. Home Dashboard (`HomeTab`)
1. **Hero Rent Status Card**:
   - Dark gradient background (`bg-gradient-to-br from-brand-800 to-brand-900`).
   - Quick action buttons:
     - **Payment Toggle**: Toggles payment state (`isPaid`) and displays dynamic urgency badge (`Son X Gün` vs `Ödendi ✓`).
     - **WhatsApp Dekont Copier**: Formats a polite, legally structured Turkish notice to the landlord and copies to clipboard with toast notification.
2. **Format Standard**: Always format numbers using Turkish currency standards:
   ```javascript
   amount.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
   // Outputs: "18.500" or "18.500,00"
   ```

---

### B. TÜFE Rent Increase Calculator (`CalculatorTab`)
1. **Mathematical Formula**:
   $$ \text{Max Increase Amount} = \frac{\text{Current Rent} \times \text{TÜFE Rate}}{100} $$
   $$ \text{Legal Max Rent} = \text{Current Rent} + \text{Max Increase Amount} $$
2. **Copyable Legal Notification Draft**:
   When the user clicks **"Ev Sahibine Gönderilecek Yasal Mesajı Kopyala"**, Codex must assemble a text citing **TBK Article 344**:
   ```javascript
   const draftText = `Sayın Ev Sahibim,

Yasal düzenlemelere (TBK Madde 344) göre yenileme dönemindeki azami kira artış oranı 12 aylık TÜFE ortalaması olan %${tufe}'dir.

Mevcut Kira: ₺${currentRent.toLocaleString('tr-TR')}
Yasal Zam Miktarı: ₺${maxIncreaseAmount.toLocaleString('tr-TR')}
Yeni Yasal Kira Tavanı: ₺${legalMaxRent.toLocaleString('tr-TR')}

Ödemelerimi zamanında yapan bir kiracı olarak, yeni dönem kiramızı yasal tavan olan ₺${legalMaxRent.toLocaleString('tr-TR')} üzerinden devam ettirmeyi teklif ediyorum. Bilgilerinize sunarım.`;
   ```

---

### C. Tahliye Taahhütnamesi Risk Wizard (`RightsTab`)
1. **Multi-Step Diagnostic State Tree**:
   - **Step 1**: Was the undertaking signed on the same date as the tenancy contract?
     - `Yes` -> Outcome: **GEÇERSİZ (Invalid)**. Under Yargıtay precedent, commitments signed simultaneously with contract execution are deemed under duress.
     - `No` -> Proceed to Step 2.
   - **Step 2**: Was the eviction date left blank upon signing?
     - `Yes` -> Outcome: **YÜKSEK RİSK (High Risk)**. Landlord can fill in dates retroactively.
     - `No` -> Outcome: **ŞEKLEN GEÇERLİ (Valid on Form)**.

---

### D. Move-In Damage Inspector (`InspectionTab`)
1. **Interactive Defect Log**:
   - State array storing `{ id, room, desc, status, photo }`.
   - Category tag selection (`Mutfak`, `Banyo`, `Salon`, `Yatak Odası`, `Balkon`).
   - Mock camera trigger giving feedback via Toast system.

---

### E. AI Legal Assistant Chat (`ChatTab`)
1. **Rule-Based Keyword Intelligence**:
   Codex can wire this to OpenAI/Gemini API, but must retain instant keyword fallback logic for fast mobile performance:
   - Keyword `zam` / `artış`: Cites TBK 344 & calculates exact ceiling.
   - Keyword `kombi` / `tamir` / `masraf`: Cites TBK 301 (Landlord maintenance liability).
   - Keyword `tahliye` / `oğlum`: Explains genuine need requirement & 3-year re-rental ban (TBK 355).

---

## 5. Refactoring Checklist for Codex (Production React / Native)

When porting this code into a production repository:

- [ ] **Extract Modular Components**: Separate into `StatusCard.jsx`, `RentCalculator.jsx`, `LegalWizard.jsx`, `InspectionLog.jsx`, and `ChatAssistant.jsx`.
- [ ] **Replace Clipboard Logic**: Upgrade from fallback `document.execCommand('copy')` to `navigator.clipboard.writeText()` with fallback for mobile WebViews.
- [ ] **Add Haptic Feedback**: Integrate `navigator.vibrate(50)` on touch events for native-like feel on Android/iOS WebView wrappers.
- [ ] **Port to NativeWind (If React Native)**: Map Tailwind classes to React Native `View` and `Text` primitives using NativeWind v4.
- [ ] **Persist State**: Connect state variables (`rentData`, `inspectionItems`) to `localStorage` or `AsyncStorage`.

```javascript
// Example LocalStorage Persistence Pattern for Codex
useEffect(() => {
  const savedRent = localStorage.getItem('kira_asistani_rent');
  if (savedRent) setRentData(JSON.parse(savedRent));
}, []);

useEffect(() => {
  localStorage.setItem('kira_asistani_rent', JSON.stringify(rentData));
}, [rentData]);
```

---

## 6. Summary of Key UX Decisions
- **No Heavy Fonts**: Clean Jakarta Sans typography optimizes load time on low-connectivity mobile networks.
- **Zero Modal Fatigue**: Toasts and inline expandable panels (`<details>`) replace jarring modal popups.
- **Pre-written Copy-Paste Actions**: Saves tenants from drafting uncomfortable legal phrasing manually.