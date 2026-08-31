const translations = {
  tr: {
    brand: "Kiraci Kalkani",
    brandSub: "Turkiye kira asistani",
    navDashboard: "Panel",
    navCalculator: "Kira artisi",
    navContract: "Kontrat",
    navDeposit: "Depozito",
    navMarket: "Yakin kiralar",
    navAdmin: "Admin",
    navPacket: "Dosya paketi",
    applyLanguage: "Uygula",
    dataStatusTitle: "Veri durumu",
    dataStatusBody: "Bu test surumunde yakin kira verisi admin tarafindan manuel girilir. Canli ilan verisi icin lisansli kaynak veya kullanici kaniti gerekir.",
    heroEyebrow: "Kiraci odakli koruma paneli",
    heroTitle: "Kontrat, odeme, depozito ve cevre kira kanitlarini tek yerde takip edin.",
    heroCopy: "Zam talebinin makul olup olmadigini hesaplayin, belgeleri duzenleyin, bolgedeki benzer ilanlari kanit olarak saklayin ve anlasmazlik dosyasi hazirlayin.",
    metricRentLabel: "Mevcut kira",
    metricAskLabel: "Talep edilen artis",
    metricMaxLabel: "Hesaplanan ust sinir",
    metricScoreLabel: "Dosya skoru",
    districtLabel: "Il / ilce",
    homeTypeLabel: "Ev tipi",
    calcEyebrow: "Kira artisi",
    calcTitle: "Zam talebi kontrolu",
    currentRent: "Mevcut kira",
    requestedRent: "Talep edilen kira",
    cpiRate: "12 aylik TUFE ortalamasi %",
    renewalDate: "Yenileme tarihi",
    calculate: "Hesapla",
    resultLabel: "Sonuc",
    overLimitTitle: "Talep ust sinirin uzerinde gorunuyor.",
    overLimitBody: (max, diff) => `Hesaplanan ust sinir: ${max}. Talep edilen kira bu sinirdan ${diff} yuksek.`,
    underLimitTitle: "Talep hesaplanan sinir icinde.",
    underLimitBody: (max, diff) => `Hesaplanan ust sinir: ${max}. Talep edilen kira sinirin ${diff} altinda.`,
    contractEyebrow: "Kontrat",
    contractTitle: "Kontrat ozeti ve risk isaretleri",
    uploadContract: "Kontrat yukle",
    ocrWaiting: "OCR bekliyor",
    uploaded: "Yuklendi",
    depositEyebrow: "Depozito ve odeme",
    depositTitle: "Kanit kasasi",
    depositAmount: "Depozito",
    monthlyRent: "Aylik kira",
    payDay: "Son odeme gunu",
    evidenceType: "Kanit tipi",
    addEvidence: "Kanit ekle",
    marketEyebrow: "Yakin kiralar",
    marketTitle: "Mahalle kira kanit haritasi",
    manualData: "Admin verisi",
    noRentDataTitle: "Henuz kira verisi yok.",
    noRentDataBody: "Admin panelinden Narlidere icin ilk kira kanitini ekleyin.",
    filtered: (type) => `${type} filtrelendi`,
    homeDot: "Ev",
    medianRentLabel: "Medyan yakin kira",
    aboveMedian: (delta) => `Talep edilen kira cevre medyanindan ${delta} yuksek.`,
    belowMedian: (delta) => `Talep edilen kira cevre medyanina gore ${delta} daha dusuk.`,
    packetEyebrow: "Dosya paketi",
    packetTitle: "Arabuluculuk / avukat hazirligi",
    assistantTitle: "Asistan sorusu",
    questionDefault: "Ev sahibim kiranin 29.000 TL olmasi gerektigini soyluyor. Nasil cevap hazirlamaliyim?",
    draftAnswer: "Yanit taslagi olustur",
    assistantAnswerTitle: "Taslak yaklasim",
    assistantAnswerBody: "Mevcut kira, yenileme tarihi ve TUFE hesabini yazili sekilde belirtin. Talep edilen tutarin hesaplanan ust siniri astigini, odeme dekontlarinizi ve karsilastirmali kira kanitlarinizi sakladiginizi ekleyin. Bu hukuki danismanlik degildir; yuksek riskli durumda avukat gorusu alin.",
    ready: "Hazir",
    missing: "Eksik / bekliyor",
    evidenceAddedTitle: (type) => `${type} kaydi`,
    evidenceAddedText: "Yeni kanit zaman cizelgesine eklendi.",
    compText: (size, age) => `${size} m2, bina yasi ${age}. Kanit dosyasina eklenebilir karsilastirma.`
    ,
    adminEyebrow: "Admin paneli",
    adminTitle: "Narlidere kira verisi girisi",
    adminLocked: "Giris gerekli",
    adminUnlocked: "Admin aktif",
    adminBadLogin: "Hatali kullanici veya sifre",
    adminUser: "Kullanici",
    adminPass: "Sifre",
    adminLoginBtn: "Giris yap",
    adminListingTitle: "Ilan basligi",
    adminRent: "Kira",
    adminSize: "m2",
    adminAge: "Bina yasi",
    adminNeighborhood: "Mahalle",
    adminAddress: "Adres",
    adminLat: "Enlem",
    adminLng: "Boylam",
    adminSource: "Kaynak",
    adminProof: "Kanit",
    saveListing: "Kaydet",
    findAddress: "Adresi haritada bul",
    addressFound: "Adres bulundu",
    addressNotFound: "Adres bulunamadi",
    addressSearchFailed: "Adres arama basarisiz",
    placeDraggablePin: "Suruklenebilir pin koy",
    pinPlaced: "Pin yerlestirildi; surukleyerek duzeltin",
    useMapCenter: "Harita merkezini kullan",
    mapAdminHint: "Admin girisi aktifken haritaya tiklayin veya suruklenebilir pini hareket ettirin; koordinatlar otomatik guncellenir.",
    mapUnavailable: "Harita kutuphanesi yuklenemedi. Internet baglantisini kontrol edin.",
    adminLogout: "Cikis",
    updateListing: "Guncelle",
    cancelEdit: "Duzenlemeyi iptal et",
    editListing: "Duzenle",
    editingListing: "Kayit duzenleniyor",
    deleteListing: "Sil"
  },
  en: {
    brand: "Tenant Shield",
    brandSub: "Rental assistant for Turkey",
    navDashboard: "Dashboard",
    navCalculator: "Rent increase",
    navContract: "Contract",
    navDeposit: "Deposit",
    navMarket: "Nearby rents",
    navAdmin: "Admin",
    navPacket: "Case packet",
    applyLanguage: "Apply language",
    dataStatusTitle: "Data status",
    dataStatusBody: "In this test version, nearby rent data is entered manually by an admin. Live listing data needs a licensed source or user-submitted proof.",
    heroEyebrow: "Tenant-first protection panel",
    heroTitle: "Track your contract, payments, deposit, and local rent proof in one place.",
    heroCopy: "Check whether a rent increase is reasonable, organize documents, save comparable listings, and prepare a dispute file.",
    metricRentLabel: "Current rent",
    metricAskLabel: "Requested increase",
    metricMaxLabel: "Calculated ceiling",
    metricScoreLabel: "Case score",
    districtLabel: "City / district",
    homeTypeLabel: "Home type",
    calcEyebrow: "Rent increase",
    calcTitle: "Increase request check",
    currentRent: "Current rent",
    requestedRent: "Requested rent",
    cpiRate: "12-month CPI average %",
    renewalDate: "Renewal date",
    calculate: "Calculate",
    resultLabel: "Result",
    overLimitTitle: "The request appears above the calculated ceiling.",
    overLimitBody: (max, diff) => `Calculated ceiling: ${max}. The requested rent is ${diff} above that level.`,
    underLimitTitle: "The request is within the calculated ceiling.",
    underLimitBody: (max, diff) => `Calculated ceiling: ${max}. The requested rent is ${diff} below that level.`,
    contractEyebrow: "Contract",
    contractTitle: "Contract summary and risk flags",
    uploadContract: "Upload contract",
    ocrWaiting: "OCR pending",
    uploaded: "Uploaded",
    depositEyebrow: "Deposit and payment",
    depositTitle: "Evidence vault",
    depositAmount: "Deposit",
    monthlyRent: "Monthly rent",
    payDay: "Payment due day",
    evidenceType: "Evidence type",
    addEvidence: "Add evidence",
    marketEyebrow: "Nearby rents",
    marketTitle: "Neighborhood rent proof map",
    manualData: "Admin data",
    noRentDataTitle: "No rent data yet.",
    noRentDataBody: "Add the first rent proof for Narlidere from the admin panel.",
    filtered: (type) => `${type} filtered`,
    homeDot: "Home",
    medianRentLabel: "Median nearby rent",
    aboveMedian: (delta) => `The requested rent is ${delta} above the local median.`,
    belowMedian: (delta) => `The requested rent is ${delta} below the local median.`,
    packetEyebrow: "Case packet",
    packetTitle: "Mediation / lawyer prep",
    assistantTitle: "Assistant question",
    questionDefault: "My landlord says the rent should be 29,000 TL. How should I prepare a reply?",
    draftAnswer: "Create reply draft",
    assistantAnswerTitle: "Draft approach",
    assistantAnswerBody: "State your current rent, renewal date, and CPI calculation in writing. Add that the requested amount appears to exceed the calculated ceiling, and that you are keeping payment receipts and comparable rent evidence. This is not legal advice; get a lawyer's view in high-risk situations.",
    ready: "Ready",
    missing: "Missing / pending",
    evidenceAddedTitle: (type) => `${type} record`,
    evidenceAddedText: "New evidence was added to the timeline.",
    compText: (size, age) => `${size} m2, building age ${age}. Comparable proof that can be added to the case file.`,
    adminEyebrow: "Admin panel",
    adminTitle: "Narlidere rent data entry",
    adminLocked: "Login required",
    adminUnlocked: "Admin active",
    adminBadLogin: "Wrong username or password",
    adminUser: "Username",
    adminPass: "Password",
    adminLoginBtn: "Log in",
    adminListingTitle: "Listing title",
    adminRent: "Rent",
    adminSize: "m2",
    adminAge: "Building age",
    adminNeighborhood: "Neighborhood",
    adminAddress: "Address",
    adminLat: "Latitude",
    adminLng: "Longitude",
    adminSource: "Source",
    adminProof: "Proof",
    saveListing: "Save",
    findAddress: "Find address on map",
    addressFound: "Address found",
    addressNotFound: "Address not found",
    addressSearchFailed: "Address search failed",
    placeDraggablePin: "Drop draggable pin",
    pinPlaced: "Pin placed; drag it to refine",
    useMapCenter: "Use map center",
    mapAdminHint: "When admin login is active, click the map or drag the pin; coordinates update automatically.",
    mapUnavailable: "Map library could not load. Check your internet connection.",
    adminLogout: "Log out",
    updateListing: "Update",
    cancelEdit: "Cancel edit",
    editListing: "Modify",
    editingListing: "Editing listing",
    deleteListing: "Delete"
  }
};

const evidenceLabels = {
  tr: {
    bank: "Banka dekontu",
    message: "Mesaj ekran goruntusu",
    photo: "Ev fotografi",
    listing: "Ilan linki"
  },
  en: {
    bank: "Bank receipt",
    message: "Message screenshot",
    photo: "Home photo",
    listing: "Listing link"
  }
};

const RENT_STORAGE_KEY = "tenantShieldNarlidereRentData";
const ADMIN_USER = "admin";
const ADMIN_PASS = "c101admin";
const NARLIDERE_CENTER = [38.3897, 27.0144];
let rentMap = null;
let rentMarkers = null;
let pendingMarker = null;

const riskData = [
  {
    level: "high",
    title: { tr: "Tahliye taahhudu benzeri madde", en: "Clause resembling an eviction undertaking" },
    text: { tr: "Kontratta ilk talepte tahliye ifadesi varsa uzman incelemesi gerekir.", en: "If the contract says you must leave on first request, it needs expert review." }
  },
  {
    level: "medium",
    title: { tr: "Depozito siniri", en: "Deposit limit" },
    text: { tr: "Depozito uc aylik kira sinirini asmamali; banka kaniti saklanmali.", en: "The deposit should not exceed three months of rent; keep bank proof." }
  },
  {
    level: "low",
    title: { tr: "Odeme kaniti", en: "Payment proof" },
    text: { tr: "Banka aciklamasinda ay ve adres bilgisi kullanmak dosyayi guclendirir.", en: "Using month and address in the bank note strengthens your file." }
  }
];

let lang = localStorage.getItem("tenantShieldLang") || "tr";
let pendingLang = lang;
let activeMarketIndex = 0;
let adminLoggedIn = sessionStorage.getItem("tenantShieldAdmin") === "1";
let editingIndex = null;
const evidence = [
  { title: { tr: "Eylul kira dekontu", en: "September rent receipt" }, text: { tr: "Banka dekontu eklendi, aciklama yeterli.", en: "Bank receipt added, description is sufficient." } },
  { title: { tr: "Tasinma fotograflari", en: "Move-in photos" }, text: { tr: "Salon, mutfak ve banyo icin giris fotograflari mevcut.", en: "Entry photos exist for the living room, kitchen, and bathroom." } },
  { title: { tr: "Zam talebi mesaji", en: "Rent increase message" }, text: { tr: "Ev sahibinin 29.000 TL talebi zaman cizelgesine islendi.", en: "The landlord's 29,000 TL request was added to the timeline." } }
];
const checklist = [
  { title: { tr: "Kontrat ozeti", en: "Contract summary" }, done: true },
  { title: { tr: "Kira odeme dekontlari", en: "Rent payment receipts" }, done: true },
  { title: { tr: "Depozito kaniti", en: "Deposit proof" }, done: true },
  { title: { tr: "Yakin kira karsilastirmalari", en: "Nearby rent comparisons" }, done: false },
  { title: { tr: "Bakim/onarim talepleri", en: "Maintenance requests" }, done: false },
  { title: { tr: "Yanit taslagi", en: "Reply draft" }, done: false }
];

function t(key, ...args) {
  const value = translations[lang][key];
  return typeof value === "function" ? value(...args) : value;
}

function money(value) {
  return `TL${Number(value || 0).toLocaleString(lang === "tr" ? "tr-TR" : "en-US", { maximumFractionDigits: 0 })}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function readRentData() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RENT_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRentData(items) {
  localStorage.setItem(RENT_STORAGE_KEY, JSON.stringify(items));
}

function initMap() {
  const mapEl = document.querySelector("#rentMap");
  if (!mapEl || rentMap || typeof L === "undefined") {
    if (mapEl && typeof L === "undefined") {
      mapEl.innerHTML = `<div class="map-fallback">${t("mapUnavailable")}</div>`;
    }
    return;
  }

  rentMap = L.map("rentMap", {
    center: NARLIDERE_CENTER,
    zoom: 15,
    minZoom: 12,
    maxZoom: 19,
    scrollWheelZoom: true
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(rentMap);

  rentMarkers = L.layerGroup().addTo(rentMap);
  rentMap.on("click", (event) => {
    if (!adminLoggedIn) return;
    setAdminCoordinates(event.latlng.lat, event.latlng.lng, true);
  });
}

function setAdminCoordinates(lat, lng, showMarker = false) {
  document.querySelector("#adminLatInput").value = Number(lat).toFixed(6);
  document.querySelector("#adminLngInput").value = Number(lng).toFixed(6);
  if (showMarker && rentMap && typeof L !== "undefined") {
    if (pendingMarker) pendingMarker.remove();
    pendingMarker = L.marker([lat, lng], { draggable: true, opacity: 0.8 }).addTo(rentMap);
    pendingMarker.on("dragend", () => {
      const next = pendingMarker.getLatLng();
      setAdminCoordinates(next.lat, next.lng, false);
    });
  }
}

function adminSearchQuery() {
  const address = document.querySelector("#adminAddressInput").value.trim();
  const neighborhood = document.querySelector("#adminNeighborhoodInput").value.trim();
  return address || neighborhood;
}

function resetAdminForm() {
  document.querySelector("#adminForm").reset();
  editingIndex = null;
  document.querySelector("#adminForm button[type='submit']").textContent = t("saveListing");
  document.querySelector("#cancelEdit").classList.add("hidden");
  if (pendingMarker) {
    pendingMarker.remove();
    pendingMarker = null;
  }
}

function loadListingForEdit(index) {
  const items = readRentData();
  const item = items[index];
  if (!item) return;
  editingIndex = index;
  document.querySelector("#adminTitleInput").value = item.title || "";
  document.querySelector("#adminRentInput").value = item.rent || "";
  document.querySelector("#adminSizeInput").value = item.size || "";
  document.querySelector("#adminAgeInput").value = item.age || "";
  document.querySelector("#adminNeighborhoodInput").value = item.neighborhood || "";
  document.querySelector("#adminAddressInput").value = item.address || "";
  document.querySelector("#adminLatInput").value = item.lat || "";
  document.querySelector("#adminLngInput").value = item.lng || "";
  document.querySelector("#adminSourceInput").value = item.source || "";
  document.querySelector("#adminProofInput").value = item.proof || "";
  document.querySelector("#adminForm button[type='submit']").textContent = t("updateListing");
  document.querySelector("#cancelEdit").classList.remove("hidden");
  document.querySelector("#adminStatus").textContent = t("editingListing");
  if (rentMap && Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng))) {
    rentMap.setView([Number(item.lat), Number(item.lng)], 17);
    setAdminCoordinates(Number(item.lat), Number(item.lng), true);
  }
  document.querySelector("#admin").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function geocodeAdminAddress() {
  const query = adminSearchQuery();
  if (!query) return;
  const status = document.querySelector("#adminStatus");
  status.textContent = "...";
  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "1",
      addressdetails: "1"
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const results = await response.json();
    if (!Array.isArray(results) || !results.length) {
      status.textContent = t("addressNotFound");
      return;
    }
    const first = results[0];
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      status.textContent = t("addressNotFound");
      return;
    }
    setAdminCoordinates(lat, lng, true);
    if (rentMap) rentMap.setView([lat, lng], 17);
    status.textContent = t("addressFound");
  } catch {
    status.textContent = t("addressSearchFailed");
  }
}

async function placeDraggablePin() {
  const query = adminSearchQuery();
  if (query) {
    await geocodeAdminAddress();
  } else if (rentMap) {
    const center = rentMap.getCenter();
    setAdminCoordinates(center.lat, center.lng, true);
  }
  document.querySelector("#adminStatus").textContent = t("pinPlaced");
}

function applyTranslations() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (translations[lang][key]) node.textContent = t(key);
  });
  document.querySelectorAll(".lang-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === lang);
    button.classList.toggle("selected", button.dataset.lang === pendingLang);
  });
  document.querySelector("#questionBox").value = t("questionDefault");
  document.querySelector("#refreshMarket").title = lang === "tr" ? "Yakin kiralari yenile" : "Refresh nearby rents";
  initMap();
  renderEvidenceOptions();
  calculateRent();
  renderRisks();
  renderEvidence();
  renderMarket(activeMarketIndex);
  renderChecklist();
  renderAdmin();
  document.querySelector("#adminForm button[type='submit']").textContent = editingIndex === null ? t("saveListing") : t("updateListing");
}

function renderEvidenceOptions() {
  const select = document.querySelector("#evidenceType");
  [...select.options].forEach((option) => {
    option.textContent = evidenceLabels[lang][option.value];
  });
}

function calculateRent() {
  const current = Number(document.querySelector("#currentRent").value || 0);
  const requested = Number(document.querySelector("#requestedRent").value || 0);
  const cpi = Number(document.querySelector("#cpiRate").value || 0);
  const max = Math.round(current * (1 + cpi / 100));
  const diff = requested - max;
  const result = document.querySelector("#rentResult");

  document.querySelector("#metricRent").textContent = money(current);
  document.querySelector("#metricAsk").textContent = money(requested);
  document.querySelector("#metricMax").textContent = money(max);

  if (diff > 0) {
    result.innerHTML = `<span>${t("resultLabel")}</span><strong>${t("overLimitTitle")}</strong><p>${t("overLimitBody", money(max), money(diff))}</p>`;
  } else {
    result.innerHTML = `<span>${t("resultLabel")}</span><strong>${t("underLimitTitle")}</strong><p>${t("underLimitBody", money(max), money(Math.abs(diff)))}</p>`;
  }
  renderMarket(activeMarketIndex);
}

function renderRisks() {
  document.querySelector("#riskList").innerHTML = riskData.map((risk) => `
    <article class="risk ${risk.level}">
      <strong>${risk.title[lang]}</strong>
      <p>${risk.text[lang]}</p>
    </article>
  `).join("");
}

function renderEvidence() {
  document.querySelector("#evidenceTimeline").innerHTML = evidence.map((item) => `
    <article class="timeline-item">
      <strong>${item.title[lang]}</strong>
      <p>${item.text[lang]}</p>
    </article>
  `).join("");
  document.querySelector("#caseScore").textContent = `${Math.min(96, 48 + evidence.length * 8)}%`;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function renderMarket(activeIndex = 0) {
  const comps = readRentData();
  const requested = Number(document.querySelector("#requestedRent").value || 0);

  if (rentMarkers) rentMarkers.clearLayers();

  if (!comps.length) {
    activeMarketIndex = 0;
    document.querySelector("#medianRent").textContent = "--";
    document.querySelector("#rentVerdict").textContent = t("noRentDataBody");
    document.querySelector("#listingList").innerHTML = `
      <article class="listing empty">
        <strong>${t("noRentDataTitle")}</strong>
        <p>${t("noRentDataBody")}</p>
      </article>
    `;
    if (rentMap) rentMap.setView(NARLIDERE_CENTER, 15);
    return;
  }

  activeMarketIndex = Math.min(activeIndex, comps.length - 1);
  const med = median(comps.map((item) => item.rent));
  const delta = requested - med;

  document.querySelector("#medianRent").textContent = money(med);
  document.querySelector("#rentVerdict").textContent = delta > 0
    ? t("aboveMedian", money(delta))
    : t("belowMedian", money(Math.abs(delta)));

  document.querySelector("#listingList").innerHTML = comps.map((item, index) => `
    <article class="listing ${index === activeMarketIndex ? "active" : ""}" data-index="${index}">
      <small>${item.source || "-"} | ${item.proof || "-"}</small>
      <strong>${item.title || "Narlidere"} | ${money(item.rent)}</strong>
      ${item.neighborhood ? `<p>${escapeHtml(item.neighborhood)}</p>` : ""}
      ${item.address ? `<p>${escapeHtml(item.address)}</p>` : ""}
      <p>${t("compText", item.size, item.age)}</p>
      ${adminLoggedIn ? `
        <div class="listing-actions">
          <button class="secondary small-action" data-edit="${index}" type="button">${t("editListing")}</button>
          <button class="danger small-delete" data-delete="${index}" type="button">${t("deleteListing")}</button>
        </div>
      ` : ""}
    </article>
  `).join("");

  if (rentMap && rentMarkers && typeof L !== "undefined") {
    const bounds = [];
    comps.forEach((item, index) => {
      const lat = Number(item.lat);
      const lng = Number(item.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      bounds.push([lat, lng]);
      const marker = L.marker([lat, lng]).addTo(rentMarkers);
      marker.bindPopup(`
        <strong>${escapeHtml(item.title || "Narlidere")}</strong><br>
        ${escapeHtml(money(item.rent))}<br>
        ${escapeHtml(item.neighborhood || "")}<br>
        ${escapeHtml(item.address || "")}<br>
        ${escapeHtml(item.size || "-")} m2 | ${escapeHtml(item.age || "-")}
      `);
      marker.on("click", () => {
        renderMarket(index);
      });
      if (index === activeMarketIndex) marker.openPopup();
    });
    if (bounds.length) rentMap.fitBounds(bounds, { padding: [42, 42], maxZoom: 16 });
  }
}

function renderAdmin() {
  const login = document.querySelector("#adminLogin");
  const form = document.querySelector("#adminForm");
  const status = document.querySelector("#adminStatus");
  login.classList.toggle("hidden", adminLoggedIn);
  form.classList.toggle("hidden", !adminLoggedIn);
  status.textContent = adminLoggedIn ? t("adminUnlocked") : t("adminLocked");
}

function renderChecklist() {
  document.querySelector("#packetChecklist").innerHTML = checklist.map((item) => `
    <div class="check-item">
      <strong>${item.done ? "OK" : "--"} ${item.title[lang]}</strong>
      <span>${item.done ? t("ready") : t("missing")}</span>
    </div>
  `).join("");
}

document.querySelectorAll(".lang-option").forEach((button) => {
  button.addEventListener("click", () => {
    pendingLang = button.dataset.lang;
    document.querySelectorAll(".lang-option").forEach((option) => {
      option.classList.toggle("selected", option.dataset.lang === pendingLang);
    });
  });
});
document.querySelector("#applyLanguage").addEventListener("click", () => {
  if (pendingLang !== lang) {
    lang = pendingLang;
    localStorage.setItem("tenantShieldLang", lang);
    applyTranslations();
  }
});
document.querySelector("#calculateRent").addEventListener("click", calculateRent);
document.querySelector("#districtSelect").addEventListener("change", () => renderMarket(0));
document.querySelector("#homeType").addEventListener("change", () => {
  document.querySelector("#marketStatus").textContent = t("filtered", document.querySelector("#homeType").value);
});
document.querySelector("#refreshMarket").addEventListener("click", () => {
  document.querySelector("#marketStatus").textContent = t("manualData");
  renderMarket(activeMarketIndex);
});
document.querySelector("#contractUpload").addEventListener("change", (event) => {
  document.querySelector("#ocrStamp").textContent = event.target.files[0] ? t("uploaded") : t("ocrWaiting");
});
document.querySelector("#addEvidence").addEventListener("click", () => {
  const type = evidenceLabels[lang][document.querySelector("#evidenceType").value];
  evidence.unshift({
    title: { tr: translations.tr.evidenceAddedTitle(type), en: translations.en.evidenceAddedTitle(type) },
    text: { tr: translations.tr.evidenceAddedText, en: translations.en.evidenceAddedText }
  });
  renderEvidence();
});
document.querySelector("#listingList").addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit]");
  if (editButton && adminLoggedIn) {
    loadListingForEdit(Number(editButton.dataset.edit));
    return;
  }
  const deleteButton = event.target.closest("[data-delete]");
  if (deleteButton && adminLoggedIn) {
    const items = readRentData();
    items.splice(Number(deleteButton.dataset.delete), 1);
    writeRentData(items);
    resetAdminForm();
    renderMarket(0);
    return;
  }
  const card = event.target.closest(".listing");
  if (card) renderMarket(Number(card.dataset.index));
});
document.querySelector("#askAssistant").addEventListener("click", () => {
  document.querySelector("#assistantAnswer").innerHTML = `<strong>${t("assistantAnswerTitle")}</strong><p>${t("assistantAnswerBody")}</p>`;
  checklist[5].done = true;
  renderChecklist();
});
document.querySelector("#useMapCenter").addEventListener("click", () => {
  if (!rentMap) return;
  const center = rentMap.getCenter();
  setAdminCoordinates(center.lat, center.lng, true);
});
document.querySelector("#geocodeAddress").addEventListener("click", geocodeAdminAddress);
document.querySelector("#placeDraggablePin").addEventListener("click", placeDraggablePin);
document.querySelector("#cancelEdit").addEventListener("click", () => {
  resetAdminForm();
  renderAdmin();
});
document.querySelector("#adminLogin").addEventListener("submit", (event) => {
  event.preventDefault();
  const user = document.querySelector("#adminUser").value.trim();
  const pass = document.querySelector("#adminPass").value;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    adminLoggedIn = true;
    sessionStorage.setItem("tenantShieldAdmin", "1");
    renderAdmin();
    renderMarket(activeMarketIndex);
  } else {
    document.querySelector("#adminStatus").textContent = t("adminBadLogin");
  }
});
document.querySelector("#adminForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.querySelector("#adminTitleInput").value.trim();
  const rent = Number(document.querySelector("#adminRentInput").value || 0);
  const size = Number(document.querySelector("#adminSizeInput").value || 0);
  const age = Number(document.querySelector("#adminAgeInput").value || 0);
  const neighborhood = document.querySelector("#adminNeighborhoodInput").value.trim();
  const address = document.querySelector("#adminAddressInput").value.trim();
  const latRaw = document.querySelector("#adminLatInput").value.trim();
  const lngRaw = document.querySelector("#adminLngInput").value.trim();
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  const source = document.querySelector("#adminSourceInput").value.trim();
  const proof = document.querySelector("#adminProofInput").value.trim();
  if (!title || rent <= 0 || !latRaw || !lngRaw || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const items = readRentData();
  const editIndex = editingIndex;
  const payload = { title, rent, size, age, neighborhood, address, lat, lng, source, proof, district: "Manual", updatedAt: new Date().toISOString() };
  if (editIndex !== null && items[editIndex]) {
    items[editIndex] = { ...items[editIndex], ...payload };
  } else {
    items.unshift({ ...payload, createdAt: new Date().toISOString() });
  }
  writeRentData(items);
  resetAdminForm();
  renderMarket(editIndex === null ? 0 : editIndex);
});
document.querySelector("#adminLogout").addEventListener("click", () => {
  adminLoggedIn = false;
  resetAdminForm();
  sessionStorage.removeItem("tenantShieldAdmin");
  renderAdmin();
  renderMarket(activeMarketIndex);
});

applyTranslations();
