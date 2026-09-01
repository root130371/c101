const RENT_KEY = "tenantShieldNarlidereRentData";
const EVIDENCE_KEY = "tenantShieldEvidence";
const CONTRACT_KEY = "tenantShieldContract";
const LANG_KEY = "tenantShieldLang";
const ADMIN_USER = "admin";
const ADMIN_PASS = "c101admin";
const NARLIDERE_CENTER = [38.3897, 27.0144];
const SUPABASE_URL = "https://gxqcacrtntnfnakitdaf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWNhY3J0bnRuZm5ha2l0ZGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTE2MTksImV4cCI6MjEwMzg2NzYxOX0.gbpaPYNbldBKeLUwgJmauyPNGMmVRHTAAMBXPjD7bSw";
const EVIDENCE_BUCKET = "evidence";

const i18n = {
  tr: {
    brand: "Kiracı Kalkanı",
    brandSub: "Türkiye kira asistanı",
    navDashboard: "Panel",
    navCalculator: "Kira artışı",
    navContract: "Kontrat",
    navDeposit: "Kanıt kasası",
    navMarket: "Yakın kiralar",
    navAdmin: "Admin",
    navAssistant: "Asistan",
    applyLanguage: "Uygula",
    dataStatusTitle: "Veri durumu",
    dataStatusBody: "Bu test sürümünde yakın kira verisi admin tarafından manuel girilir. Canlı ilan verisi için lisanslı kaynak veya kullanıcı kanıtı gerekir.",
    heroEyebrow: "Kiracı koruma paneli",
    heroTitle: "Kira artışı, kontrat, kanıt ve emsal ilanları tek yerde yönetin.",
    heroCopy: "Zam talebini hesaplayın, belgelerin durumunu görün, yakın kira kanıtlarını haritada takip edin ve cevap taslağı hazırlayın.",
    heroPrimary: "Zamı kontrol et",
    heroSecondary: "Emsal kira ekle",
    metricRentLabel: "Mevcut kira",
    metricAskLabel: "Talep edilen kira",
    metricMaxLabel: "Hesaplanan üst sınır",
    metricScoreLabel: "Dosya skoru",
    statusContract: "Kontrat",
    statusEvidence: "Kanıt",
    statusMarket: "Kira verisi",
    statusAdmin: "Admin",
    available: "Mevcut",
    unavailable: "Mevcut değil",
    districtLabel: "İl / ilçe",
    homeTypeLabel: "Ev tipi",
    calcEyebrow: "Kira artışı",
    calcTitle: "Zam talebi kontrolü",
    currentRent: "Mevcut kira",
    requestedRent: "Talep edilen kira",
    cpiRate: "12 aylık TÜFE ortalaması %",
    renewalDate: "Yenileme tarihi",
    calculate: "Hesapla",
    resultLabel: "Sonuç",
    overLimitTitle: "Talep üst sınırın üzerinde görünüyor.",
    overLimitBody: (max, diff) => `Hesaplanan üst sınır ${max}. Talep edilen kira bu sınırdan ${diff} yüksek.`,
    underLimitTitle: "Talep hesaplanan sınır içinde.",
    underLimitBody: (max, diff) => `Hesaplanan üst sınır ${max}. Talep edilen kira sınırın ${diff} altında.`,
    contractEyebrow: "Kontrat",
    contractTitle: "Kontrat özeti ve risk işaretleri",
    uploadContract: "Kontrat yükle",
    ocrWaiting: "OCR bekliyor",
    uploaded: "Yüklendi",
    depositEyebrow: "Depozito ve ödeme",
    depositTitle: "Kanıt kasası",
    evidenceType: "Kanıt tipi",
    evidenceNote: "Not",
    evidenceFile: "Dosya / fotoğraf",
    addEvidence: "Kanıt ekle",
    bank: "Banka dekontu",
    message: "Mesaj ekran görüntüsü",
    photo: "Ev fotoğrafı",
    listing: "İlan linki",
    processing: "İşleniyor",
    reviewRequired: "Kontrol gerekli",
    fileRequired: "Kanıt eklemek için önce bir dosya veya fotoğraf yükleyin.",
    fileWaiting: "Dosya seçildi, analiz hazırlanıyor.",
    analysisReady: "Fotoğraf analiz edildi",
    analysisPdf: "PDF yüklendi. Tam metin çıkarımı için AI backend gerekir.",
    analysisImage: (width, height, size) => `Görüntü okunabildi: ${width}x${height}px, ${size}.`,
    analysisLowRes: "Görüntü düşük çözünürlüklü; yazı veya detaylar okunamayabilir.",
    analysisGood: "Görüntü kalitesi kanıt için uygun görünüyor.",
    uploadLocal: "Dosya bu cihazda kaydedildi; Supabase bucket hazır olunca kalıcı yükleme yapılacak.",
    uploadNeedsLogin: "Kalıcı Supabase yükleme için kullanıcı girişi gerekir; dosya bu cihazda geçici kanıt olarak tutuldu.",
    uploadRemote: "Dosya Supabase Storage'a yüklendi.",
    uploadFailedLocal: "Supabase yükleme başarısız oldu; dosya bu cihazda geçici kanıt olarak tutuldu.",
    marketEyebrow: "Yakın kiralar",
    marketTitle: "Mahalle kira kanıt haritası",
    manualData: "Admin verisi",
    noRentDataTitle: "Henüz kira verisi yok.",
    noRentDataBody: "Admin panelinden ilk Narlıdere kira kanıtını ekleyin.",
    medianRentLabel: "Medyan yakın kira",
    aboveMedian: (delta) => `Talep edilen kira çevre medyanından ${delta} yüksek.`,
    belowMedian: (delta) => `Talep edilen kira çevre medyanından ${delta} düşük.`,
    adminEyebrow: "Admin paneli",
    adminTitle: "Kira verisi girişi",
    adminLocked: "Giriş gerekli",
    adminUnlocked: "Admin aktif",
    adminBadLogin: "Hatalı kullanıcı veya şifre",
    adminUser: "Kullanıcı",
    adminPass: "Şifre",
    adminLoginBtn: "Giriş yap",
    adminListingTitle: "İlan başlığı",
    adminRent: "Kira",
    adminSize: "m2",
    adminAge: "Bina yaşı",
    adminNeighborhood: "Mahalle",
    adminAddress: "Adres",
    adminLat: "Enlem",
    adminLng: "Boylam",
    adminSource: "Kaynak",
    adminProof: "Kanıt",
    saveListing: "Kaydet",
    updateListing: "Güncelle",
    findAddress: "Adresi haritada bul",
    addressFound: "Adres bulundu",
    addressNotFound: "Adres bulunamadı",
    addressSearchFailed: "Adres arama başarısız",
    placeDraggablePin: "Sürüklenebilir pin koy",
    pinPlaced: "Pin yerleştirildi; sürükleyerek düzeltin",
    useMapCenter: "Harita merkezini kullan",
    mapAdminHint: "Admin girişi aktifken haritaya tıklayarak veya pini sürükleyerek konum alanlarını doldurabilirsiniz.",
    mapUnavailable: "Harita kütüphanesi yüklenemedi. İnternet bağlantısını kontrol edin.",
    adminLogout: "Çıkış",
    cancelEdit: "Düzenlemeyi iptal et",
    editListing: "Düzenle",
    deleteListing: "Sil",
    assistantEyebrow: "Asistan",
    assistantTitle: "Cevap taslağı hazırlayın",
    questionDefault: "Ev sahibim kiranın 29.000 TL olması gerektiğini söylüyor. Nasıl cevap hazırlamalıyım?",
    draftAnswer: "Yanıt taslağı oluştur",
    assistantAnswerTitle: "Taslak yaklaşım",
    ready: "Hazır",
    missing: "Eksik / bekliyor",
    contractSummary: "Kontrat özeti",
    paymentProof: "Kira ödeme dekontları",
    rentComparisons: "Yakın kira karşılaştırmaları",
    replyDraft: "Yanıt taslağı"
  },
  en: {
    brand: "Tenant Shield",
    brandSub: "Rental assistant for Turkey",
    navDashboard: "Dashboard",
    navCalculator: "Rent increase",
    navContract: "Contract",
    navDeposit: "Evidence vault",
    navMarket: "Nearby rents",
    navAdmin: "Admin",
    navAssistant: "Assistant",
    applyLanguage: "Apply",
    dataStatusTitle: "Data status",
    dataStatusBody: "In this test version, nearby rent data is entered manually by an admin. Live listing data needs a licensed source or user-submitted proof.",
    heroEyebrow: "Tenant protection panel",
    heroTitle: "Manage rent increases, contracts, proof, and comparable listings in one place.",
    heroCopy: "Calculate the request, review file status, track nearby rent proof on the map, and prepare a reply draft.",
    heroPrimary: "Check increase",
    heroSecondary: "Add comparable",
    metricRentLabel: "Current rent",
    metricAskLabel: "Requested rent",
    metricMaxLabel: "Calculated ceiling",
    metricScoreLabel: "Case score",
    statusContract: "Contract",
    statusEvidence: "Evidence",
    statusMarket: "Rent data",
    statusAdmin: "Admin",
    available: "Available",
    unavailable: "Not available",
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
    overLimitBody: (max, diff) => `Calculated ceiling is ${max}. The requested rent is ${diff} above that level.`,
    underLimitTitle: "The request is within the calculated ceiling.",
    underLimitBody: (max, diff) => `Calculated ceiling is ${max}. The requested rent is ${diff} below that level.`,
    contractEyebrow: "Contract",
    contractTitle: "Contract summary and risk flags",
    uploadContract: "Upload contract",
    ocrWaiting: "OCR pending",
    uploaded: "Uploaded",
    depositEyebrow: "Deposit and payment",
    depositTitle: "Evidence vault",
    evidenceType: "Evidence type",
    evidenceNote: "Note",
    evidenceFile: "File / photo",
    addEvidence: "Add evidence",
    bank: "Bank receipt",
    message: "Message screenshot",
    photo: "Home photo",
    listing: "Listing link",
    processing: "Processing",
    reviewRequired: "Review required",
    fileRequired: "Upload a file or photo before adding evidence.",
    fileWaiting: "File selected, preparing analysis.",
    analysisReady: "Photo analyzed",
    analysisPdf: "PDF uploaded. Full text extraction needs the AI backend.",
    analysisImage: (width, height, size) => `Image readable: ${width}x${height}px, ${size}.`,
    analysisLowRes: "Image resolution is low; text or details may be hard to read.",
    analysisGood: "Image quality looks suitable for evidence.",
    uploadLocal: "File was saved on this device; permanent upload will work once the Supabase bucket is ready.",
    uploadNeedsLogin: "Permanent Supabase upload requires user login; the file was kept as temporary evidence on this device.",
    uploadRemote: "File uploaded to Supabase Storage.",
    uploadFailedLocal: "Supabase upload failed; file was kept as temporary evidence on this device.",
    marketEyebrow: "Nearby rents",
    marketTitle: "Neighborhood rent proof map",
    manualData: "Admin data",
    noRentDataTitle: "No rent data yet.",
    noRentDataBody: "Add the first Narlidere rent proof from the admin panel.",
    medianRentLabel: "Median nearby rent",
    aboveMedian: (delta) => `The requested rent is ${delta} above the local median.`,
    belowMedian: (delta) => `The requested rent is ${delta} below the local median.`,
    adminEyebrow: "Admin panel",
    adminTitle: "Rent data entry",
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
    updateListing: "Update",
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
    cancelEdit: "Cancel edit",
    editListing: "Modify",
    deleteListing: "Delete",
    assistantEyebrow: "Assistant",
    assistantTitle: "Prepare a reply draft",
    questionDefault: "My landlord says the rent should be 29,000 TL. How should I prepare a reply?",
    draftAnswer: "Create reply draft",
    assistantAnswerTitle: "Draft approach",
    ready: "Ready",
    missing: "Missing / pending",
    contractSummary: "Contract summary",
    paymentProof: "Rent payment receipts",
    rentComparisons: "Nearby rent comparisons",
    replyDraft: "Reply draft"
  }
};

const riskData = [
  { level: "high", title: { tr: "Tahliye taahhüdü benzeri madde", en: "Clause resembling an eviction undertaking" }, text: { tr: "Kontratta ilk talepte tahliye ifadesi varsa uzman incelemesi gerekir.", en: "If the contract says you must leave on first request, it needs expert review." } },
  { level: "medium", title: { tr: "Depozito sınırı", en: "Deposit limit" }, text: { tr: "Depozito üç aylık kira sınırını aşmamalı; banka kanıtı saklanmalı.", en: "The deposit should not exceed three months of rent; keep bank proof." } },
  { level: "low", title: { tr: "Ödeme kanıtı", en: "Payment proof" }, text: { tr: "Banka açıklamasında ay ve adres bilgisi kullanmak dosyayı güçlendirir.", en: "Using month and address in the bank note strengthens your file." } }
];

let lang = localStorage.getItem(LANG_KEY) || "tr";
let pendingLang = lang;
let rentMap = null;
let rentMarkers = null;
let pendingMarker = null;
let adminLoggedIn = sessionStorage.getItem("tenantShieldAdmin") === "1";
let editingIndex = null;
let selectedEvidenceAnalysis = null;
let supabaseClient = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const tr = (key, ...args) => {
  const value = i18n[lang][key];
  return typeof value === "function" ? value(...args) : value;
};

function money(value) {
  return `TL${Number(value || 0).toLocaleString(lang === "tr" ? "tr-TR" : "en-US", { maximumFractionDigits: 0 })}`;
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initSupabase() {
  if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}

function readRentData() {
  const items = readJson(RENT_KEY, []);
  return Array.isArray(items) ? items : [];
}

function readEvidence() {
  const items = readJson(EVIDENCE_KEY, []);
  return Array.isArray(items) ? items : [];
}

function fileSizeLabel(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function statusLabel(status) {
  if (status === "available") return tr("available");
  if (status === "processing") return tr("processing");
  if (status === "review_required") return tr("reviewRequired");
  return tr("unavailable");
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => resolve({ dataUrl: reader.result, width: image.naturalWidth, height: image.naturalHeight });
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function analyzeEvidenceFile(file) {
  if (!file) return null;
  const base = {
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    fileSize: file.size,
    fileSizeLabel: fileSizeLabel(file.size),
    status: "review_required",
    confidence: 0.4,
    summary: tr("analysisPdf")
  };

  if (!file.type.startsWith("image/")) {
    return base;
  }

  const image = await readImage(file);
  const enoughResolution = image.width >= 1000 && image.height >= 700;
  return {
    ...base,
    previewUrl: image.dataUrl,
    width: image.width,
    height: image.height,
    status: enoughResolution ? "available" : "review_required",
    confidence: enoughResolution ? 0.78 : 0.48,
    summary: `${tr("analysisImage", image.width, image.height, base.fileSizeLabel)} ${tr(enoughResolution ? "analysisGood" : "analysisLowRes")}`
  };
}

async function uploadEvidenceFile(file, analysis) {
  if (!supabaseClient) return { storageStatus: "local", message: tr("uploadLocal") };
  const { data: authData } = await supabaseClient.auth.getUser();
  const user = authData?.user;
  if (!user) {
    return { storageStatus: "local", message: tr("uploadNeedsLogin") };
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${Date.now()}-${safeName}`;
  const { error } = await supabaseClient.storage.from(EVIDENCE_BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (error) {
    return { storageStatus: "local", message: tr("uploadFailedLocal"), error: error.message };
  }

  return { storageStatus: "remote", storagePath: path, message: tr("uploadRemote"), analysis };
}

function calculateRent() {
  const current = Number($("#currentRent").value || 0);
  const requested = Number($("#requestedRent").value || 0);
  const cpi = Number($("#cpiRate").value || 0);
  const max = Math.round(current * (1 + cpi / 100));
  const diff = Math.abs(requested - max);
  const over = requested > max;

  $("#metricRent").textContent = money(current);
  $("#metricAsk").textContent = money(requested);
  $("#metricMax").textContent = money(max);
  $("#rentResult").innerHTML = `<span>${tr("resultLabel")}</span><h3>${tr(over ? "overLimitTitle" : "underLimitTitle")}</h3><p>${tr(over ? "overLimitBody" : "underLimitBody", money(max), money(diff))}</p>`;
  updateScore();
  renderMarket();
}

function updateScore() {
  const evidenceCount = readEvidence().filter((item) => item.status === "available").length;
  const listingCount = readRentData().length;
  const hasContract = Boolean(readJson(CONTRACT_KEY, null));
  const score = Math.min(100, 25 + evidenceCount * 10 + listingCount * 8 + (hasContract ? 25 : 0));
  $("#caseScore").textContent = `${score}%`;
}

function renderRisks() {
  $("#riskList").innerHTML = riskData.map((item) => `<article class="risk ${item.level}"><strong>${item.title[lang]}</strong><p>${item.text[lang]}</p></article>`).join("");
}

function renderEvidence() {
  const evidence = readEvidence();
  const types = ["bank", "message", "photo", "listing"];
  $("#evidenceGrid").innerHTML = types.map((type) => {
    const item = evidence.find((entry) => entry.type === type && entry.fileName);
    const status = item?.status || "missing";
    return `<article class="evidence-state ${status === "available" ? "ok" : "missing"}"><span>${tr(type)}</span><strong>${statusLabel(status)}</strong></article>`;
  }).join("");

  $("#evidenceTimeline").innerHTML = evidence.length
    ? evidence.map((item) => `<article class="timeline-item">
        ${item.previewUrl ? `<img class="evidence-thumb" src="${item.previewUrl}" alt="">` : ""}
        <strong>${tr(item.type)} · ${statusLabel(item.status)}</strong>
        <p>${escapeHtml(item.summary || item.note || tr(item.type))}</p>
        <small>${escapeHtml(item.fileName || "")} ${item.fileSizeLabel ? `· ${escapeHtml(item.fileSizeLabel)}` : ""} · ${new Date(item.createdAt).toLocaleString(lang === "tr" ? "tr-TR" : "en-US")}</small>
      </article>`).join("")
    : `<article class="timeline-item empty"><strong>${tr("unavailable")}</strong><p>${lang === "tr" ? "Henüz kanıt eklenmedi." : "No evidence has been added yet."}</p></article>`;

  updateStatuses();
  updateScore();
}

function renderEvidenceOptions() {
  $("#evidenceType").innerHTML = ["bank", "message", "photo", "listing"]
    .map((type) => `<option value="${type}">${tr(type)}</option>`)
    .join("");
}

function renderPendingEvidenceAnalysis(analysis) {
  if (!analysis) {
    $("#evidenceAnalysis").innerHTML = "";
    return;
  }
  $("#evidenceAnalysis").innerHTML = `<article class="analysis-card ${analysis.status === "available" ? "ok" : "warn"}">
    ${analysis.previewUrl ? `<img class="evidence-preview" src="${analysis.previewUrl}" alt="">` : ""}
    <div>
      <strong>${statusLabel(analysis.status)}</strong>
      <p>${escapeHtml(analysis.summary)}</p>
      <small>${escapeHtml(analysis.fileName)} · ${escapeHtml(analysis.fileSizeLabel)}</small>
    </div>
  </article>`;
}

function renderContract() {
  const contract = readJson(CONTRACT_KEY, null);
  $("#ocrStamp").textContent = contract?.name ? `${tr("uploaded")}: ${contract.name}` : tr("ocrWaiting");
  updateStatuses();
}

async function addEvidence() {
  const file = $("#evidenceFile").files[0];
  if (!file) {
    $("#evidenceAnalysis").innerHTML = `<article class="analysis-card warn"><strong>${tr("unavailable")}</strong><p>${tr("fileRequired")}</p></article>`;
    return;
  }

  $("#evidenceAnalysis").innerHTML = `<article class="analysis-card warn"><strong>${tr("processing")}</strong><p>${tr("fileWaiting")}</p></article>`;
  const analysis = selectedEvidenceAnalysis || await analyzeEvidenceFile(file);
  const upload = await uploadEvidenceFile(file, analysis);
  const items = readEvidence();
  const type = $("#evidenceType").value;
  const note = $("#evidenceNote").value.trim();
  items.unshift({
    type,
    note,
    status: analysis.status,
    confidence: analysis.confidence,
    summary: `${analysis.summary} ${upload.message}`,
    fileName: analysis.fileName,
    fileType: analysis.fileType,
    fileSize: analysis.fileSize,
    fileSizeLabel: analysis.fileSizeLabel,
    width: analysis.width,
    height: analysis.height,
    previewUrl: analysis.previewUrl,
    storageStatus: upload.storageStatus,
    storagePath: upload.storagePath,
    createdAt: new Date().toISOString()
  });
  writeJson(EVIDENCE_KEY, items);
  $("#evidenceNote").value = "";
  $("#evidenceFile").value = "";
  selectedEvidenceAnalysis = null;
  renderPendingEvidenceAnalysis(null);
  renderEvidence();
}

function renderChecklist() {
  const hasContract = Boolean(readJson(CONTRACT_KEY, null));
  const hasPayment = readEvidence().some((item) => item.type === "bank" && item.status === "available");
  const hasMarket = readRentData().length > 0;
  const items = [
    [tr("contractSummary"), hasContract],
    [tr("paymentProof"), hasPayment],
    [tr("rentComparisons"), hasMarket],
    [tr("replyDraft"), Boolean($("#assistantAnswer").textContent.trim())]
  ];
  $("#packetChecklist").innerHTML = items.map(([title, done]) => `<div class="check ${done ? "done" : ""}"><span>${done ? "✓" : "!"}</span>${title}</div>`).join("");
}

function updateStatuses() {
  const hasContract = Boolean(readJson(CONTRACT_KEY, null));
  const hasEvidence = readEvidence().some((item) => item.status === "available");
  const hasMarket = readRentData().length > 0;
  $("#contractStatus").textContent = tr(hasContract ? "available" : "unavailable");
  $("#evidenceStatus").textContent = tr(hasEvidence ? "available" : "unavailable");
  $("#marketDataStatus").textContent = tr(hasMarket ? "available" : "unavailable");
  $("#adminStatusMini").textContent = tr(adminLoggedIn ? "adminUnlocked" : "adminLocked");
  $("#adminStatus").textContent = tr(adminLoggedIn ? "adminUnlocked" : "adminLocked");
  renderChecklist();
}

function initMap() {
  const mapEl = $("#rentMap");
  if (!mapEl || rentMap) return;
  if (typeof L === "undefined") {
    mapEl.innerHTML = `<div class="map-fallback">${tr("mapUnavailable")}</div>`;
    return;
  }
  rentMap = L.map("rentMap", { center: NARLIDERE_CENTER, zoom: 15, minZoom: 12, maxZoom: 19, scrollWheelZoom: true });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(rentMap);
  rentMarkers = L.layerGroup().addTo(rentMap);
  rentMap.on("click", (event) => {
    if (adminLoggedIn) setAdminCoordinates(event.latlng.lat, event.latlng.lng, true);
  });
}

function renderMarket() {
  const data = readRentData();
  const requested = Number($("#requestedRent").value || 0);
  $("#marketDataStatus").textContent = tr(data.length ? "available" : "unavailable");
  if (rentMarkers) rentMarkers.clearLayers();

  if (!data.length) {
    $("#medianRent").textContent = money(0);
    $("#rentVerdict").textContent = tr("noRentDataBody");
    $("#listingList").innerHTML = `<article class="listing"><strong>${tr("noRentDataTitle")}</strong><p>${tr("noRentDataBody")}</p></article>`;
    return;
  }

  const sorted = data.map((item) => Number(item.rent || 0)).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  $("#medianRent").textContent = money(median);
  $("#rentVerdict").textContent = tr(requested >= median ? "aboveMedian" : "belowMedian", money(Math.abs(requested - median)));
  $("#listingList").innerHTML = data.map((item, index) => `<article class="listing"><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.neighborhood || "Narlıdere")} · ${money(item.rent)} · ${escapeHtml(item.size)} m2</small><p>${escapeHtml(item.address || item.source || "")}</p></div>${adminLoggedIn ? `<div class="listing-actions"><button type="button" data-edit="${index}">${tr("editListing")}</button><button type="button" data-delete="${index}">${tr("deleteListing")}</button></div>` : ""}</article>`).join("");

  if (rentMarkers) {
    data.forEach((item) => {
      if (!Number.isFinite(Number(item.lat)) || !Number.isFinite(Number(item.lng))) return;
      L.marker([Number(item.lat), Number(item.lng)]).addTo(rentMarkers).bindPopup(`<strong>${escapeHtml(item.title)}</strong><br>${money(item.rent)}`);
    });
  }
  updateStatuses();
}

function setAdminCoordinates(lat, lng, showMarker = false) {
  $("#adminLatInput").value = Number(lat).toFixed(6);
  $("#adminLngInput").value = Number(lng).toFixed(6);
  if (showMarker && rentMap && typeof L !== "undefined") {
    if (pendingMarker) pendingMarker.remove();
    pendingMarker = L.marker([lat, lng], { draggable: true, opacity: 0.85 }).addTo(rentMap);
    pendingMarker.on("dragend", () => {
      const next = pendingMarker.getLatLng();
      setAdminCoordinates(next.lat, next.lng);
    });
  }
}

function resetAdminForm() {
  $("#adminForm").reset();
  editingIndex = null;
  $("#adminForm button[type='submit']").textContent = tr("saveListing");
  $("#cancelEdit").classList.add("hidden");
  if (pendingMarker) {
    pendingMarker.remove();
    pendingMarker = null;
  }
}

function renderAdminState() {
  $("#adminLogin").classList.toggle("hidden", adminLoggedIn);
  $("#adminForm").classList.toggle("hidden", !adminLoggedIn);
  updateStatuses();
  renderMarket();
}

function saveListing(event) {
  event.preventDefault();
  const item = {
    title: $("#adminTitleInput").value.trim() || "Narlıdere kira kanıtı",
    rent: Number($("#adminRentInput").value || 0),
    size: Number($("#adminSizeInput").value || 0),
    age: Number($("#adminAgeInput").value || 0),
    neighborhood: $("#adminNeighborhoodInput").value.trim() || "Narlıdere",
    address: $("#adminAddressInput").value.trim(),
    lat: Number($("#adminLatInput").value || NARLIDERE_CENTER[0]),
    lng: Number($("#adminLngInput").value || NARLIDERE_CENTER[1]),
    source: $("#adminSourceInput").value.trim() || "Kullanıcı kanıtı",
    proof: $("#adminProofInput").value.trim(),
    updatedAt: new Date().toISOString()
  };
  const data = readRentData();
  if (editingIndex === null) data.unshift(item);
  else data[editingIndex] = item;
  writeJson(RENT_KEY, data);
  resetAdminForm();
  renderMarket();
}

function editListing(index) {
  const item = readRentData()[index];
  if (!item) return;
  editingIndex = index;
  $("#adminTitleInput").value = item.title || "";
  $("#adminRentInput").value = item.rent || "";
  $("#adminSizeInput").value = item.size || "";
  $("#adminAgeInput").value = item.age || "";
  $("#adminNeighborhoodInput").value = item.neighborhood || "";
  $("#adminAddressInput").value = item.address || "";
  $("#adminLatInput").value = item.lat || "";
  $("#adminLngInput").value = item.lng || "";
  $("#adminSourceInput").value = item.source || "";
  $("#adminProofInput").value = item.proof || "";
  $("#adminForm button[type='submit']").textContent = tr("updateListing");
  $("#cancelEdit").classList.remove("hidden");
  setAdminCoordinates(item.lat || NARLIDERE_CENTER[0], item.lng || NARLIDERE_CENTER[1], true);
}

async function geocodeAddress() {
  const query = [$("#adminAddressInput").value.trim(), $("#adminNeighborhoodInput").value.trim()].filter(Boolean).join(", ");
  if (!query) return;
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
    const [result] = await response.json();
    if (!result) {
      $("#adminStatus").textContent = tr("addressNotFound");
      return;
    }
    setAdminCoordinates(result.lat, result.lon, true);
    rentMap?.setView([result.lat, result.lon], 17);
    $("#adminStatus").textContent = tr("addressFound");
  } catch {
    $("#adminStatus").textContent = tr("addressSearchFailed");
  }
}

function assistantReply() {
  const current = Number($("#currentRent").value || 0);
  const requested = Number($("#requestedRent").value || 0);
  const cpi = Number($("#cpiRate").value || 0);
  const max = Math.round(current * (1 + cpi / 100));
  const evidenceCount = readEvidence().length;
  const listingCount = readRentData().length;
  const hasContract = Boolean(readJson(CONTRACT_KEY, null));
  const answer = lang === "tr"
    ? `Taslak yaklaşım: Mevcut kiranız ${money(current)}, talep edilen kira ${money(requested)}. ${cpi}% TÜFE ortalamasına göre hesaplanan üst sınır ${money(max)}. Kontrat durumu: ${tr(hasContract ? "available" : "unavailable")}. Kanıt sayısı: ${evidenceCount}. Yakın kira kaydı: ${listingCount}. Cevabınızda hesaplamayı, ödeme kanıtlarını ve emsal kira kayıtlarını ayrı maddeler halinde belirtin. Bu hukuki danışmanlık değildir; yüksek riskli durumda avukat görüşü alın.`
    : `Draft approach: Your current rent is ${money(current)}, and the requested rent is ${money(requested)}. With a ${cpi}% CPI average, the calculated ceiling is ${money(max)}. Contract status: ${tr(hasContract ? "available" : "unavailable")}. Evidence items: ${evidenceCount}. Nearby rent records: ${listingCount}. In your reply, separate the calculation, payment proof, and comparable rent records into clear points. This is not legal advice; get a lawyer's view in high-risk situations.`;
  $("#assistantAnswer").innerHTML = `<strong>${tr("assistantAnswerTitle")}</strong><p>${answer}</p>`;
  renderChecklist();
}

function applyLanguage() {
  lang = pendingLang;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
  $$("[data-i18n]").forEach((node) => {
    node.textContent = tr(node.dataset.i18n);
  });
  renderEvidenceOptions();
  $("#questionBox").value = tr("questionDefault");
  $$(".lang-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === lang);
    button.classList.remove("selected");
  });
  calculateRent();
  renderRisks();
  renderContract();
  renderEvidence();
  renderAdminState();
}

function bindEvents() {
  $("#calculateRent").addEventListener("click", calculateRent);
  ["#currentRent", "#requestedRent", "#cpiRate"].forEach((selector) => $(selector).addEventListener("input", calculateRent));
  $("#contractUpload").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    writeJson(CONTRACT_KEY, { name: file.name, uploadedAt: new Date().toISOString() });
    $("#ocrStamp").textContent = `${tr("uploaded")}: ${file.name}`;
    updateStatuses();
    updateScore();
  });
  $("#addEvidence").addEventListener("click", addEvidence);
  $("#evidenceFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    selectedEvidenceAnalysis = null;
    if (!file) {
      renderPendingEvidenceAnalysis(null);
      return;
    }
    $("#evidenceAnalysis").innerHTML = `<article class="analysis-card warn"><strong>${tr("processing")}</strong><p>${tr("fileWaiting")}</p></article>`;
    try {
      selectedEvidenceAnalysis = await analyzeEvidenceFile(file);
      renderPendingEvidenceAnalysis(selectedEvidenceAnalysis);
    } catch {
      selectedEvidenceAnalysis = {
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        fileSizeLabel: fileSizeLabel(file.size),
        status: "review_required",
        confidence: 0,
        summary: tr("analysisLowRes")
      };
      renderPendingEvidenceAnalysis(selectedEvidenceAnalysis);
    }
  });
  $("#askAssistant").addEventListener("click", assistantReply);
  $("#refreshMarket").addEventListener("click", renderMarket);
  $$(".lang-option").forEach((button) => {
    button.addEventListener("click", () => {
      pendingLang = button.dataset.lang;
      $$(".lang-option").forEach((item) => item.classList.toggle("selected", item === button));
    });
  });
  $("#applyLanguage").addEventListener("click", applyLanguage);
  $("#adminLogin").addEventListener("submit", (event) => {
    event.preventDefault();
    adminLoggedIn = $("#adminUser").value === ADMIN_USER && $("#adminPass").value === ADMIN_PASS;
    if (adminLoggedIn) sessionStorage.setItem("tenantShieldAdmin", "1");
    $("#adminStatus").textContent = tr(adminLoggedIn ? "adminUnlocked" : "adminBadLogin");
    renderAdminState();
  });
  $("#adminLogout").addEventListener("click", () => {
    adminLoggedIn = false;
    sessionStorage.removeItem("tenantShieldAdmin");
    resetAdminForm();
    renderAdminState();
  });
  $("#adminForm").addEventListener("submit", saveListing);
  $("#cancelEdit").addEventListener("click", resetAdminForm);
  $("#geocodeAddress").addEventListener("click", geocodeAddress);
  $("#placeDraggablePin").addEventListener("click", () => {
    const center = rentMap?.getCenter() || { lat: NARLIDERE_CENTER[0], lng: NARLIDERE_CENTER[1] };
    setAdminCoordinates(center.lat, center.lng, true);
    $("#adminStatus").textContent = tr("pinPlaced");
  });
  $("#useMapCenter").addEventListener("click", () => {
    const center = rentMap?.getCenter();
    if (center) setAdminCoordinates(center.lat, center.lng, true);
  });
  $("#listingList").addEventListener("click", (event) => {
    const edit = event.target.closest("[data-edit]");
    const del = event.target.closest("[data-delete]");
    if (edit) editListing(Number(edit.dataset.edit));
    if (del) {
      const data = readRentData();
      data.splice(Number(del.dataset.delete), 1);
      writeJson(RENT_KEY, data);
      renderMarket();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initSupabase();
  bindEvents();
  $("#questionBox").value = tr("questionDefault");
  initMap();
  renderRisks();
  renderEvidence();
  renderContract();
  applyLanguage();
});
