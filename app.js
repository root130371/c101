const RENT_KEY = "tenantShieldNarlidereRentData";
const EVIDENCE_KEY = "tenantShieldEvidence";
const CONTRACT_KEY = "tenantShieldContract";
const LANG_KEY = "tenantShieldLang";
const GUEST_KEY = "tenantShieldGuestMode";
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
    navAccount: "Hesap",
    navAdmin: "Admin",
    navAssistant: "Asistan",
    applyLanguage: "Uygula",
    dataStatusTitle: "Veri durumu",
    dataStatusBody: "Bu test sürümünde yakın kira verisi admin tarafından manuel girilir. Canlı ilan verisi için lisanslı kaynak veya kullanıcı kanıtı gerekir.",
    welcomeEyebrow: "Kiracı dosyanı başlat",
    welcomeTitle: "Kanıtlarını güvenle sakla, kira talebini kontrol et.",
    welcomeBody: "Hesap açarsan kanıt dosyaların Supabase Storage'a kalıcı yüklenir. İstersen hesap açmadan demo modunda devam edebilirsin.",
    welcomeBenefitUpload: "Kalıcı kanıt yükleme",
    welcomeBenefitMap: "Emsal kira haritası",
    welcomeBenefitAssistant: "Asistan hazırlığı",
    continueGuest: "Hesap açmadan devam et",
    forgotPassword: "Şifremi unuttum",
    orContinue: "veya",
    welcomeHint: "Kalıcı yükleme için hesap önerilir; demo modunda veriler bu tarayıcıda kalır.",
    topbarEyebrow: "Genel bakış",
    topbarTitle: "Kiracı dosyanız",
    topbarAccount: "Hesap",
    topbarEvidence: "Kanıt yükle",
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
    statusAccount: "Hesap",
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
    scannerTitle: "Belge veya fotoğraf tarat",
    scannerBody: "Fotoğraf, dekont, mesaj ekran görüntüsü veya PDF yükleyin.",
    scannerCta: "Dosya seç",
    scannerConfidence: "Okunabilirlik",
    scannerStatus: "Tarama durumu",
    addEvidence: "Kanıt ekle",
    viewEvidence: "Aç",
    renameEvidence: "Notu düzenle",
    deleteEvidence: "Sil",
    evidenceDeleted: "Kanıt silindi.",
    evidenceUpdated: "Kanıt güncellendi.",
    evidenceOpenFailed: "Kanıt açılamadı; lütfen tekrar deneyin.",
    evidenceDeleteFailed: "Kanıt silinemedi; lütfen tekrar deneyin.",
    evidenceNotePrompt: "Bu kanıt için yeni not yazın:",
    contractSaved: "Kontrat kanıt kasasına eklendi.",
    bank: "Banka dekontu",
    message: "Mesaj ekran görüntüsü",
    photo: "Ev fotoğrafı",
      listing: "İlan linki",
      contract: "Kontrat",
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
    extractionRemote: "AI analizi tamamlandı.",
    uploadFailedLocal: "Supabase yükleme başarısız oldu; dosya bu cihazda geçici kanıt olarak tutuldu.",
    accountEyebrow: "Hesap",
    accountTitle: "Kalıcı kanıt yükleme",
    accountLoggedOut: "Giriş gerekli",
    accountLoggedIn: "Giriş yapıldı",
    emailLabel: "E-posta",
    passwordLabel: "Şifre",
    signIn: "Giriş yap",
    signUp: "Kayıt ol",
    signOut: "Çıkış yap",
    authHint: "Kanıtları kalıcı saklamak için giriş yapın. Giriş yoksa dosyalar sadece bu tarayıcıda geçici kalır.",
    authSessionText: "Kanıt dosyaları bu hesap altında Supabase Storage'a kalıcı olarak yüklenecek.",
    authMissingFields: "E-posta ve şifre girin.",
    authInvalidEmail: "Geçerli bir e-posta adresi girin.",
    authShortPassword: "Şifre en az 6 karakter olmalı.",
    authWorking: "İşlem yapılıyor...",
    authSignUpSent: "Kayıt isteği gönderildi. Supabase e-posta onayı istiyorsa gelen kutunuzu kontrol edin.",
    authSignedIn: "Giriş başarılı.",
    authSignedOut: "Çıkış yapıldı.",
    resetSent: "Şifre sıfırlama bağlantısı e-postanıza gönderildi.",
    guestMode: "Demo modunda devam ediyorsunuz. Kalıcı kanıt yüklemek için istediğiniz zaman hesap açabilirsiniz.",
    authError: (message) => `Hesap işlemi başarısız: ${message}`,
    authUnavailable: "Supabase bağlantısı yüklenemedi. İnternet bağlantısını kontrol edin.",
    marketEyebrow: "Yakın kiralar",
    marketTitle: "Mahalle kira kanıt haritası",
    manualData: "Admin verisi",
    noRentDataTitle: "Henüz kira verisi yok.",
    noRentDataBody: "Admin panelinden ilk Narlıdere kira kanıtını ekleyin.",
    medianRentLabel: "Medyan yakın kira",
    aboveMedian: (delta) => `Talep edilen kira çevre medyanından ${delta} yüksek.`,
    belowMedian: (delta) => `Talep edilen kira çevre medyanından ${delta} düşük.`,
    marketAbove: "Medyan üstü",
    marketBelow: "Medyan altı",
    marketEqual: "Medyan civarı",
    rentPerM2: "m2 kira",
    listingSourceLabel: "Kaynak",
    listingProofLabel: "Kanıt",
    proofMissing: "Kanıt girilmedi",
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
    copyDraft: "Kopyala",
    copiedDraft: "Kopyalandı",
    assistantAnswerTitle: "Taslak yaklaşım",
    assistantSummary: "Durum özeti",
    assistantEvidence: "Kullanılacak kanıtlar",
    assistantGuidance: "Yol haritası",
    assistantReplySection: "Yanıt taslağı",
    assistantRiskNote: "Not",
    assistantWorking: "Asistan hazırlanıyor...",
    assistantNeedsLogin: "AI asistan için giriş yapın. Bu yanıt Gemini destekli çalışır ve demo modunda yerel taslak göstermez.",
    assistantUnavailable: "AI asistan yanıt veremedi. Aşağıdaki hata ayrıntısını kontrol edin.",
    chipRentIncrease: "Zam talebine cevap",
    chipDeposit: "Depozito kanıtı",
    chipMarketProof: "Emsal kira ile savun",
    chipContractRisk: "Kontrat riskini sor",
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
    navAccount: "Account",
    navAdmin: "Admin",
    navAssistant: "Assistant",
    applyLanguage: "Apply",
    dataStatusTitle: "Data status",
    dataStatusBody: "In this test version, nearby rent data is entered manually by an admin. Live listing data needs a licensed source or user-submitted proof.",
    welcomeEyebrow: "Start your tenant file",
    welcomeTitle: "Store proof safely and check rent requests.",
    welcomeBody: "Create an account to upload evidence permanently to Supabase Storage, or continue in demo mode without an account.",
    welcomeBenefitUpload: "Permanent evidence upload",
    welcomeBenefitMap: "Comparable rent map",
    welcomeBenefitAssistant: "Assistant preparation",
    continueGuest: "Continue without account",
    forgotPassword: "Forgot password",
    orContinue: "or",
    welcomeHint: "An account is recommended for permanent uploads; demo data stays in this browser.",
    topbarEyebrow: "Overview",
    topbarTitle: "Your tenant file",
    topbarAccount: "Account",
    topbarEvidence: "Upload proof",
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
    statusAccount: "Account",
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
    scannerTitle: "Scan a document or photo",
    scannerBody: "Upload a photo, receipt, message screenshot, or PDF.",
    scannerCta: "Choose file",
    scannerConfidence: "Readability",
    scannerStatus: "Scan status",
    addEvidence: "Add evidence",
    viewEvidence: "Open",
    renameEvidence: "Edit note",
    deleteEvidence: "Delete",
    evidenceDeleted: "Evidence deleted.",
    evidenceUpdated: "Evidence updated.",
    evidenceOpenFailed: "Evidence could not be opened; please try again.",
    evidenceDeleteFailed: "Evidence could not be deleted; please try again.",
    evidenceNotePrompt: "Write a new note for this evidence:",
    contractSaved: "Contract added to the evidence vault.",
    bank: "Bank receipt",
    message: "Message screenshot",
    photo: "Home photo",
      listing: "Listing link",
      contract: "Contract",
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
    extractionRemote: "AI analysis completed.",
    uploadFailedLocal: "Supabase upload failed; file was kept as temporary evidence on this device.",
    accountEyebrow: "Account",
    accountTitle: "Permanent evidence upload",
    accountLoggedOut: "Login required",
    accountLoggedIn: "Signed in",
    emailLabel: "Email",
    passwordLabel: "Password",
    signIn: "Sign in",
    signUp: "Sign up",
    signOut: "Sign out",
    authHint: "Sign in to store evidence permanently. Without login, files stay temporary in this browser.",
    authSessionText: "Evidence files will be permanently uploaded to Supabase Storage under this account.",
    authMissingFields: "Enter email and password.",
    authInvalidEmail: "Enter a valid email address.",
    authShortPassword: "Password must be at least 6 characters.",
    authWorking: "Working...",
    authSignUpSent: "Signup request sent. If Supabase requires email confirmation, check your inbox.",
    authSignedIn: "Signed in.",
    authSignedOut: "Signed out.",
    resetSent: "Password reset link was sent to your email.",
    guestMode: "You are continuing in demo mode. You can create an account anytime for permanent evidence uploads.",
    authError: (message) => `Account action failed: ${message}`,
    authUnavailable: "Supabase connection could not load. Check your internet connection.",
    marketEyebrow: "Nearby rents",
    marketTitle: "Neighborhood rent proof map",
    manualData: "Admin data",
    noRentDataTitle: "No rent data yet.",
    noRentDataBody: "Add the first Narlidere rent proof from the admin panel.",
    medianRentLabel: "Median nearby rent",
    aboveMedian: (delta) => `The requested rent is ${delta} above the local median.`,
    belowMedian: (delta) => `The requested rent is ${delta} below the local median.`,
    marketAbove: "Above median",
    marketBelow: "Below median",
    marketEqual: "Near median",
    rentPerM2: "Rent / m2",
    listingSourceLabel: "Source",
    listingProofLabel: "Proof",
    proofMissing: "No proof entered",
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
    copyDraft: "Copy",
    copiedDraft: "Copied",
    assistantAnswerTitle: "Draft approach",
    assistantSummary: "Situation summary",
    assistantEvidence: "Evidence to use",
    assistantGuidance: "Guidance",
    assistantReplySection: "Reply draft",
    assistantRiskNote: "Note",
    assistantWorking: "Assistant is preparing...",
    assistantNeedsLogin: "Sign in to use the AI assistant. This answer is Gemini-backed and no local draft is shown in demo mode.",
    assistantUnavailable: "The AI assistant could not respond. Check the error detail below.",
    chipRentIncrease: "Reply to rent increase",
    chipDeposit: "Deposit proof",
    chipMarketProof: "Use market proof",
    chipContractRisk: "Ask about contract risk",
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
let currentUser = null;
let currentProfile = null;
let welcomeAuthMode = "login";
let selectedListingIndex = null;
let contractPreviewRequest = 0;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const tr = (key, ...args) => {
  const value = i18n[lang][key];
  return typeof value === "function" ? value(...args) : value;
};

function money(value) {
  return `TL${Number(value || 0).toLocaleString(lang === "tr" ? "tr-TR" : "en-US", { maximumFractionDigits: 0 })}`;
}

function rentPerSquareMeter(item) {
  const rent = Number(item.rent || 0);
  const size = Number(item.size || 0);
  return size > 0 ? Math.round(rent / size) : 0;
}

function marketComparison(item, median) {
  const rent = Number(item.rent || 0);
  if (!median || Math.abs(rent - median) <= median * 0.03) {
    return { key: "marketEqual", className: "equal" };
  }
  return rent > median
    ? { key: "marketAbove", className: "above" }
    : { key: "marketBelow", className: "below" };
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

function canEditListings() {
  return adminLoggedIn || currentProfile?.role === "admin";
}

function initSupabase() {
  if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      currentUser = session?.user || null;
      if (!currentUser) currentProfile = null;
      await loadProfile();
      renderAuthState();
      loadRemoteEvidence();
      loadRemoteRentListings();
    });
  }
}

async function loadProfile() {
  currentProfile = null;
  if (!supabaseClient || !currentUser) return;
  const { data } = await supabaseClient
    .from("profiles")
    .select("id,email,role")
    .eq("id", currentUser.id)
    .maybeSingle();
  currentProfile = data || null;
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
  if (status === "uploaded") return tr("uploaded");
  if (status === "processing") return tr("processing");
  if (status === "review_required") return tr("reviewRequired");
  return tr("unavailable");
}

function isImageFile(fileOrName) {
  const type = fileOrName?.type || fileOrName?.fileType || "";
  const name = fileOrName?.name || fileOrName?.fileName || "";
  return type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|heic|heif)$/i.test(name);
}

function latestEvidenceByType(type) {
  return readEvidence().find((item) => item.type === type && item.fileName) || null;
}

function contractEvidence() {
  const items = readEvidence().filter((item) => item.type === "contract" && item.fileName);
  const richItem = items.find((item) => item.previewUrl || item.storagePath);
  return richItem || items[0] || readJson(CONTRACT_KEY, null);
}

function hasContractEvidence() {
  return Boolean(contractEvidence());
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => resolve({ element: image, dataUrl: reader.result, width: image.naturalWidth, height: image.naturalHeight });
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function makeThumbnail(image, maxWidth = 360) {
  const scale = Math.min(1, maxWidth / image.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext("2d");
  context.drawImage(image.element, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
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

  if (!isImageFile(file)) {
    return base;
  }

  const image = await readImage(file);
  const enoughResolution = image.width >= 1000 && image.height >= 700;
  return {
    ...base,
    previewUrl: makeThumbnail(image),
    width: image.width,
    height: image.height,
    status: enoughResolution ? "available" : "review_required",
    confidence: enoughResolution ? 0.78 : 0.48,
    summary: `${tr("analysisImage", image.width, image.height, base.fileSizeLabel)} ${tr(enoughResolution ? "analysisGood" : "analysisLowRes")}`
  };
}

async function uploadEvidenceFile(file, analysis) {
  if (!supabaseClient) return { storageStatus: "local", message: tr("uploadLocal") };
  if (!currentUser) {
    return { storageStatus: "local", message: tr("uploadNeedsLogin") };
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${currentUser.id}/${Date.now()}-${safeName}`;
  const { error } = await supabaseClient.storage.from(EVIDENCE_BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (error) {
    return { storageStatus: "local", message: tr("uploadFailedLocal"), error: error.message };
  }

  return { storageStatus: "remote", storagePath: path, message: tr("uploadRemote"), analysis };
}

async function saveRemoteEvidence(item) {
  if (!supabaseClient || !currentUser || item.storageStatus !== "remote") return;
  const { data, error } = await supabaseClient
    .from("evidence_items")
    .insert({
      user_id: currentUser.id,
      type: item.type,
      status: item.status,
      file_bucket: EVIDENCE_BUCKET,
      file_path: item.storagePath,
      file_name: item.fileName,
      file_type: item.fileType,
      file_size: item.fileSize,
      confidence: item.confidence,
      summary_tr: lang === "tr" ? item.summary : null,
      summary_en: lang === "en" ? item.summary : null,
      extracted_json: item.extractedJson || {
        width: item.width || null,
        height: item.height || null,
        note: item.note || null,
        storage_status: item.storageStatus
      }
    })
    .select("id")
    .single();

  if (!error && data?.id) {
    item.remoteId = data.id;
    await createExtractionJob(item);
  }
}

async function createExtractionJob(item) {
  if (!supabaseClient || !currentUser || !item.remoteId) return;
  await supabaseClient.from("extraction_jobs").insert({
    evidence_id: item.remoteId,
    user_id: currentUser.id,
    status: "queued",
    provider: "pending_gemini"
  });
  const { data, error } = await supabaseClient.functions.invoke("analyze-evidence", {
    body: { evidence_id: item.remoteId }
  });
  if (error || !data?.extraction) return;
  item.status = data.status || item.status;
  item.confidence = data.extraction.confidence ?? item.confidence;
  item.summary = `${lang === "tr" ? data.extraction.summary_tr : data.extraction.summary_en} ${tr("extractionRemote")}`;
  await loadRemoteEvidence();
}

async function deleteEvidence(index) {
  const items = readEvidence();
  const item = items[index];
  if (!item) return;

  if (supabaseClient && currentUser && item.remoteId) {
    const { error } = await supabaseClient
      .from("evidence_items")
      .delete()
      .eq("id", item.remoteId)
      .eq("user_id", currentUser.id);
    if (error) {
      $("#evidenceAnalysis").innerHTML = `<article class="analysis-card warn"><strong>${tr("reviewRequired")}</strong><p>${tr("evidenceDeleteFailed")}</p></article>`;
      return;
    }
  }

  if (supabaseClient && currentUser && item.storagePath) {
    await supabaseClient.storage.from(EVIDENCE_BUCKET).remove([item.storagePath]);
  }

  items.splice(index, 1);
  writeJson(EVIDENCE_KEY, items);
  if (item.type === "contract") localStorage.removeItem(CONTRACT_KEY);
  $("#evidenceAnalysis").innerHTML = `<article class="analysis-card ok"><strong>${tr("available")}</strong><p>${tr("evidenceDeleted")}</p></article>`;
  renderEvidence();
  renderContract();
}

async function updateEvidenceNote(index) {
  const items = readEvidence();
  const item = items[index];
  if (!item) return;
  const note = window.prompt(tr("evidenceNotePrompt"), item.note || item.summary || "");
  if (note === null) return;
  item.note = note.trim();
  if (supabaseClient && currentUser && item.remoteId) {
    await supabaseClient
      .from("evidence_items")
      .update({
        summary_tr: lang === "tr" ? item.note : null,
        summary_en: lang === "en" ? item.note : null,
        extracted_json: {
          ...(item.extractedJson || {}),
          width: item.width || null,
          height: item.height || null,
          note: item.note || null,
          storage_status: item.storageStatus
        },
        updated_at: new Date().toISOString()
      })
      .eq("id", item.remoteId)
      .eq("user_id", currentUser.id);
  }
  writeJson(EVIDENCE_KEY, items);
  $("#evidenceAnalysis").innerHTML = `<article class="analysis-card ok"><strong>${tr("available")}</strong><p>${tr("evidenceUpdated")}</p></article>`;
  renderEvidence();
  renderContract();
}

async function openEvidence(index) {
  const item = readEvidence()[index];
  if (!item) return;
  let url = item.previewUrl || "";
  if (!url && supabaseClient && item.storagePath) {
    const { data, error } = await supabaseClient.storage.from(EVIDENCE_BUCKET).createSignedUrl(item.storagePath, 60);
    if (!error) url = data?.signedUrl || "";
  }
  if (!url) {
    $("#evidenceAnalysis").innerHTML = `<article class="analysis-card warn"><strong>${tr("reviewRequired")}</strong><p>${tr("evidenceOpenFailed")}</p></article>`;
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

async function loadRemoteEvidence() {
  if (!supabaseClient || !currentUser) return;
  const { data, error } = await supabaseClient
    .from("evidence_items")
    .select("id,type,status,file_name,file_type,file_size,confidence,summary_tr,summary_en,extracted_json,created_at,file_path")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) return;

  const remoteItems = data.map((item) => ({
    remoteId: item.id,
    type: item.type,
    status: item.status,
    confidence: Number(item.confidence || 0),
    summary: item.summary_tr || item.summary_en || "",
    fileName: item.file_name,
    fileType: item.file_type,
    fileSize: item.file_size,
    fileSizeLabel: fileSizeLabel(Number(item.file_size || 0)),
    width: item.extracted_json?.width || null,
    height: item.extracted_json?.height || null,
    note: item.extracted_json?.note || "",
    extractedJson: item.extracted_json || {},
    storageStatus: "remote",
    storagePath: item.file_path,
    createdAt: item.created_at
  }));

  const localOnly = readEvidence().filter((item) => !item.remoteId);
  writeJson(EVIDENCE_KEY, [...remoteItems, ...localOnly]);
  renderEvidence();
  renderContract();
}

function mapRemoteListing(item) {
  return {
    remoteId: item.id,
    title: item.title,
    rent: Number(item.rent || 0),
    size: Number(item.size || 0),
    age: Number(item.building_age || 0),
    neighborhood: item.neighborhood || "Narlıdere",
    address: item.address || "",
    lat: item.lat === null ? null : Number(item.lat),
    lng: item.lng === null ? null : Number(item.lng),
    source: item.source || "",
    proof: item.proof || "",
    updatedAt: item.updated_at || item.created_at
  };
}

function listingPayload(item) {
  return {
    created_by: currentUser?.id || null,
    title: item.title,
    rent: item.rent,
    size: item.size,
    building_age: item.age,
    city: "İzmir",
    district: "Narlıdere",
    neighborhood: item.neighborhood,
    address: item.address,
    lat: Number.isFinite(Number(item.lat)) ? Number(item.lat) : null,
    lng: Number.isFinite(Number(item.lng)) ? Number(item.lng) : null,
    source: item.source,
    proof: item.proof,
    updated_at: new Date().toISOString()
  };
}

async function loadRemoteRentListings() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient
    .from("rent_listings")
    .select("id,title,rent,size,building_age,neighborhood,address,lat,lng,source,proof,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) return;
  writeJson(RENT_KEY, data.map(mapRemoteListing));
  renderMarket();
}

async function saveRemoteRentListing(item) {
  if (!supabaseClient || currentProfile?.role !== "admin") return item;
  const payload = listingPayload(item);
  const query = item.remoteId
    ? supabaseClient.from("rent_listings").update(payload).eq("id", item.remoteId).select("id").single()
    : supabaseClient.from("rent_listings").insert(payload).select("id").single();
  const { data, error } = await query;
  if (error) {
    $("#adminStatus").textContent = error.message;
    return item;
  }
  return { ...item, remoteId: data.id };
}

async function deleteRemoteRentListing(item) {
  if (!supabaseClient || currentProfile?.role !== "admin" || !item?.remoteId) return;
  await supabaseClient.from("rent_listings").delete().eq("id", item.remoteId);
}

function setAuthMessage(message, scope = "all", tone = "info") {
  const targets = scope === "welcome"
    ? ["#welcomeMessage"]
    : scope === "account"
      ? ["#authMessage"]
      : ["#authMessage", "#welcomeMessage"];
  targets.forEach((selector) => {
    const node = $(selector);
    node.textContent = message;
    node.classList.remove("error", "success", "info");
    node.classList.add(tone);
  });
}

function setAuthBusy(scope, busy) {
  const selectors = scope === "welcome"
    ? ["#welcomeSubmit", "#welcomeForgot", "#continueGuest", "#welcomeLoginTab", "#welcomeSignupTab"]
    : ["#signInButton", "#signUpButton", "#resetPasswordButton"];
  selectors.forEach((selector) => {
    const node = $(selector);
    if (node) node.disabled = busy;
  });
}

function validateAuthInput(email, password, mode) {
  if (!email || !password) return tr("authMissingFields");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return tr("authInvalidEmail");
  if (mode === "signup" && password.length < 6) return tr("authShortPassword");
  return "";
}

function renderAuthState() {
  const signedIn = Boolean(currentUser);
  $("#authForm").classList.toggle("hidden", signedIn);
  $("#authSession").classList.toggle("hidden", !signedIn);
  $("#authUserEmail").textContent = currentUser?.email || "";
  $("#accountStatus").textContent = tr(signedIn ? "accountLoggedIn" : "accountLoggedOut");
  $("#accountStatusMini").textContent = tr(signedIn ? "accountLoggedIn" : "accountLoggedOut");
  renderWelcomeGate();
  renderAdminState();
}

function credentials(scope = "account") {
  if (scope === "welcome") {
    return {
      email: $("#welcomeEmail").value.trim(),
      password: $("#welcomePassword").value
    };
  }
  return {
    email: $("#authEmail").value.trim(),
    password: $("#authPassword").value
  };
}

function renderWelcomeGate() {
  const shouldShow = !currentUser && localStorage.getItem(GUEST_KEY) !== "1";
  $("#welcomeGate").classList.toggle("hidden", !shouldShow);
  $("#welcomeSubmit").textContent = tr(welcomeAuthMode === "login" ? "signIn" : "signUp");
  $("#welcomePassword").autocomplete = welcomeAuthMode === "login" ? "current-password" : "new-password";
  $$(".auth-tabs button").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === welcomeAuthMode);
  });
}

async function signIn(scope = "account") {
  if (!supabaseClient) {
    setAuthMessage(tr("authUnavailable"), scope, "error");
    return;
  }
  const { email, password } = credentials(scope);
  const validation = validateAuthInput(email, password, "login");
  if (validation) {
    setAuthMessage(validation, scope, "error");
    return;
  }
  setAuthBusy(scope, true);
  setAuthMessage(tr("authWorking"), scope, "info");
  try {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (!error) localStorage.removeItem(GUEST_KEY);
    setAuthMessage(error ? tr("authError", error.message) : tr("authSignedIn"), scope, error ? "error" : "success");
  } catch (error) {
    setAuthMessage(tr("authError", error.message || "Network error"), scope, "error");
  } finally {
    setAuthBusy(scope, false);
  }
}

async function signUp(scope = "account") {
  if (!supabaseClient) {
    setAuthMessage(tr("authUnavailable"), scope, "error");
    return;
  }
  const { email, password } = credentials(scope);
  const validation = validateAuthInput(email, password, "signup");
  if (validation) {
    setAuthMessage(validation, scope, "error");
    return;
  }
  setAuthBusy(scope, true);
  setAuthMessage(tr("authWorking"), scope, "info");
  try {
    const { error } = await supabaseClient.auth.signUp({ email, password });
    setAuthMessage(error ? tr("authError", error.message) : tr("authSignUpSent"), scope, error ? "error" : "success");
  } catch (error) {
    setAuthMessage(tr("authError", error.message || "Network error"), scope, "error");
  } finally {
    setAuthBusy(scope, false);
  }
}

async function signOut() {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.auth.signOut();
  setAuthMessage(error ? tr("authError", error.message) : tr("authSignedOut"), "all", error ? "error" : "success");
}

async function resetPassword(scope = "account") {
  if (!supabaseClient) {
    setAuthMessage(tr("authUnavailable"), scope, "error");
    return;
  }
  const { email } = credentials(scope);
  if (!email) {
    setAuthMessage(tr("authMissingFields"), scope, "error");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setAuthMessage(tr("authInvalidEmail"), scope, "error");
    return;
  }
  setAuthBusy(scope, true);
  setAuthMessage(tr("authWorking"), scope, "info");
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href.split("#")[0]
    });
    setAuthMessage(error ? tr("authError", error.message) : tr("resetSent"), scope, error ? "error" : "success");
  } catch (error) {
    setAuthMessage(tr("authError", error.message || "Network error"), scope, "error");
  } finally {
    setAuthBusy(scope, false);
  }
}

function continueAsGuest() {
  localStorage.setItem(GUEST_KEY, "1");
  setAuthMessage(tr("guestMode"), "all", "info");
  renderWelcomeGate();
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
  const hasContract = hasContractEvidence();
  const score = Math.min(100, 25 + evidenceCount * 10 + listingCount * 8 + (hasContract ? 25 : 0));
  $("#caseScore").textContent = `${score}%`;
}

function renderRisks() {
  $("#riskList").innerHTML = riskData.map((item) => `<article class="risk ${item.level}"><strong>${item.title[lang]}</strong><p>${item.text[lang]}</p></article>`).join("");
}

function renderEvidence() {
  const evidence = readEvidence();
  const types = ["contract", "bank", "message", "photo", "listing"];
  $("#evidenceGrid").innerHTML = types.map((type) => {
    const item = type === "contract"
      ? contractEvidence()
      : evidence.find((entry) => entry.type === type && entry.fileName);
    const status = item?.status || "missing";
    const icon = {
      bank: "ph-receipt",
      message: "ph-chat-circle-text",
      photo: "ph-image-square",
      listing: "ph-link",
      contract: "ph-file-text"
    }[type];
    return `<article class="evidence-state ${status !== "missing" ? "ok" : "missing"}">
      <i class="ph ${icon}"></i>
      <span>${tr(type)}</span>
      <strong>${statusLabel(status)}</strong>
    </article>`;
  }).join("");

  $("#evidenceTimeline").innerHTML = evidence.length
    ? evidence.map((item, index) => `<article class="timeline-item">
        ${item.previewUrl ? `<img class="evidence-thumb" src="${item.previewUrl}" alt="">` : ""}
        <div>
          <strong>${tr(item.type)} · ${statusLabel(item.status)}</strong>
          <p>${escapeHtml(item.summary || item.note || tr(item.type))}</p>
          <small>${escapeHtml(item.fileName || "")} ${item.fileSizeLabel ? `· ${escapeHtml(item.fileSizeLabel)}` : ""} · ${new Date(item.createdAt).toLocaleString(lang === "tr" ? "tr-TR" : "en-US")}</small>
        </div>
        <div class="evidence-actions">
          <button class="secondary evidence-action" type="button" data-open-evidence="${index}">${tr("viewEvidence")}</button>
          <button class="secondary evidence-action" type="button" data-rename-evidence="${index}">${tr("renameEvidence")}</button>
          <button class="danger evidence-delete" type="button" data-delete-evidence="${index}">${tr("deleteEvidence")}</button>
        </div>
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
  const confidence = Math.max(0, Math.min(100, Number(analysis.confidence || 0)));
  $("#evidenceAnalysis").innerHTML = `<article class="analysis-card ${analysis.status === "available" ? "ok" : "warn"}">
    <div class="analysis-preview">
      ${analysis.previewUrl ? `<img class="evidence-preview" src="${analysis.previewUrl}" alt="">` : `<i class="ph ph-file-pdf"></i>`}
    </div>
    <div class="analysis-content">
      <div class="analysis-head">
        <span>${tr("scannerStatus")}</span>
        <strong>${statusLabel(analysis.status)}</strong>
      </div>
      <p>${escapeHtml(analysis.summary)}</p>
      <div class="analysis-meter" aria-label="${tr("scannerConfidence")} ${confidence}%"><span style="width: ${confidence}%"></span></div>
      <small>${tr("scannerConfidence")}: ${confidence}% · ${escapeHtml(analysis.fileName)} · ${escapeHtml(analysis.fileSizeLabel)}</small>
    </div>
  </article>`;
}

function contractPlaceholderMarkup(label = tr("ocrWaiting")) {
  return `<div class="doc-line w80"></div><div class="doc-line w60"></div><div class="doc-line w90"></div><div class="stamp" id="ocrStamp">${escapeHtml(label)}</div>`;
}

function contractPreviewMarkup(contract, url = "") {
  const name = contract?.fileName || contract?.name || "";
  const fileType = contract?.fileType || "";
  const isImage = fileType.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(name);
  const isPdf = fileType.includes("pdf") || /\.pdf$/i.test(name);
  const label = name ? `${tr("uploaded")}: ${name}` : tr("ocrWaiting");

  if (url && isImage) {
    return `<img class="contract-preview-media" src="${escapeHtml(url)}" alt="${escapeHtml(name)}"><div class="stamp" id="ocrStamp">${escapeHtml(label)}</div>`;
  }

  if (url && isPdf) {
    return `<object class="contract-preview-media contract-preview-pdf" data="${escapeHtml(url)}" type="application/pdf">
      <div class="contract-file-fallback"><i class="ph ph-file-pdf"></i><strong>${escapeHtml(name)}</strong></div>
    </object><div class="stamp" id="ocrStamp">${escapeHtml(label)}</div>`;
  }

  if (name) {
    return `<div class="contract-file-fallback"><i class="ph ${isPdf ? "ph-file-pdf" : "ph-file-text"}"></i><strong>${escapeHtml(name)}</strong><span>${escapeHtml(statusLabel(contract?.status || "uploaded"))}</span></div><div class="stamp" id="ocrStamp">${escapeHtml(label)}</div>`;
  }

  return contractPlaceholderMarkup(label);
}

async function renderContract() {
  const contract = contractEvidence();
  renderContractPreview(contract);
  updateStatuses();
}

async function renderContractPreview(contract) {
  const preview = $(".document-preview");
  if (!preview) return;
  const requestId = ++contractPreviewRequest;
  preview.classList.toggle("has-contract-preview", Boolean(contract));
  preview.innerHTML = contractPreviewMarkup(contract, contract?.previewUrl || "");

  if (contract?.storagePath && !contract.previewUrl && supabaseClient && currentUser) {
    const { data, error } = await supabaseClient.storage.from(EVIDENCE_BUCKET).createSignedUrl(contract.storagePath, 180);
    if (!error && data?.signedUrl && requestId === contractPreviewRequest) {
      preview.innerHTML = contractPreviewMarkup(contract, data.signedUrl);
    }
  }
}

async function addEvidence() {
  const file = $("#evidenceFile").files[0];
  if (!file) {
    $("#evidenceAnalysis").innerHTML = `<article class="analysis-card warn"><strong>${tr("unavailable")}</strong><p>${tr("fileRequired")}</p></article>`;
    return;
  }

  $("#evidenceAnalysis").innerHTML = `<article class="analysis-card warn"><strong>${tr("processing")}</strong><p>${tr("fileWaiting")}</p></article>`;
  const analysis = selectedEvidenceAnalysis || await analyzeEvidenceFile(file);
  await persistEvidenceFile(file, $("#evidenceType").value, $("#evidenceNote").value.trim(), analysis);
  $("#evidenceNote").value = "";
  $("#evidenceFile").value = "";
  $("#scannerFileName").textContent = tr("scannerCta");
  selectedEvidenceAnalysis = null;
  renderPendingEvidenceAnalysis(null);
  renderEvidence();
}

async function persistEvidenceFile(file, type, note = "", analysis = null) {
  const finalAnalysis = analysis || await analyzeEvidenceFile(file);
  const upload = await uploadEvidenceFile(file, finalAnalysis);
  const item = {
    type,
    note,
    status: finalAnalysis.status,
    confidence: finalAnalysis.confidence,
    summary: `${finalAnalysis.summary} ${upload.message}`,
    fileName: finalAnalysis.fileName,
    fileType: finalAnalysis.fileType,
    fileSize: finalAnalysis.fileSize,
    fileSizeLabel: finalAnalysis.fileSizeLabel,
    width: finalAnalysis.width,
    height: finalAnalysis.height,
    previewUrl: finalAnalysis.previewUrl || (file.type === "application/pdf" ? URL.createObjectURL(file) : ""),
    storageStatus: upload.storageStatus,
    storagePath: upload.storagePath,
    extractedJson: {
      width: finalAnalysis.width || null,
      height: finalAnalysis.height || null,
      note: note || null,
      storage_status: upload.storageStatus
    },
    createdAt: new Date().toISOString()
  };
  await saveRemoteEvidence(item);
  if (item.remoteId) {
    await loadRemoteEvidence();
  } else {
    const items = readEvidence();
    items.unshift(item);
    writeJson(EVIDENCE_KEY, items);
  }
  return item;
}

function renderChecklist() {
  const hasContract = hasContractEvidence();
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

function renderPromptChips() {
  const prompts = [
    ["chipRentIncrease", tr("questionDefault")],
    ["chipDeposit", lang === "tr" ? "Depozitomu korumak için hangi kanıtları hazırlamalıyım?" : "Which evidence should I prepare to protect my deposit?"],
    ["chipMarketProof", lang === "tr" ? "Yakın kira kayıtlarını kullanarak nasıl daha güçlü cevap verebilirim?" : "How can I use nearby rent records to make a stronger reply?"],
    ["chipContractRisk", lang === "tr" ? "Kontratımdaki riskli maddeleri nasıl sormalıyım?" : "How should I ask about risky clauses in my contract?"]
  ];
  $("#promptChips").innerHTML = prompts
    .map(([label, prompt]) => `<button type="button" data-prompt="${escapeHtml(prompt)}">${tr(label)}</button>`)
    .join("");
}

function updateStatuses() {
  const hasContract = hasContractEvidence();
  const hasEvidence = readEvidence().some((item) => item.status === "available");
  const hasMarket = readRentData().length > 0;
  $("#contractStatus").textContent = tr(hasContract ? "available" : "unavailable");
  $("#evidenceStatus").textContent = tr(hasEvidence ? "available" : "unavailable");
  $("#marketDataStatus").textContent = tr(hasMarket ? "available" : "unavailable");
  $("#adminStatus").textContent = tr(canEditListings() ? "adminUnlocked" : "adminLocked");
  $("#accountStatusMini").textContent = tr(currentUser ? "accountLoggedIn" : "accountLoggedOut");
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
    if (canEditListings()) setAdminCoordinates(event.latlng.lat, event.latlng.lng, true);
  });
}

function renderMarket() {
  const data = readRentData();
  const requested = Number($("#requestedRent").value || 0);
  $("#marketDataStatus").textContent = tr(data.length ? "available" : "unavailable");
  if (selectedListingIndex !== null && selectedListingIndex >= data.length) selectedListingIndex = null;
  if (rentMarkers) rentMarkers.clearLayers();

  if (!data.length) {
    $("#medianRent").textContent = money(0);
    $("#rentVerdict").textContent = tr("noRentDataBody");
    $("#listingList").innerHTML = `<article class="listing empty"><strong>${tr("noRentDataTitle")}</strong><p>${tr("noRentDataBody")}</p></article>`;
    return;
  }

  const sorted = data.map((item) => Number(item.rent || 0)).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  $("#medianRent").textContent = money(median);
  $("#rentVerdict").textContent = tr(requested >= median ? "aboveMedian" : "belowMedian", money(Math.abs(requested - median)));
  $("#listingList").innerHTML = data.map((item, index) => {
    const comparison = marketComparison(item, median);
    const source = item.source || (lang === "tr" ? "Manuel giriş" : "Manual entry");
    const proof = item.proof || tr("proofMissing");
    return `<article class="listing proof-card ${selectedListingIndex === index ? "active" : ""}" data-focus-listing="${index}">
      <div class="listing-main">
        <div>
          <strong>${escapeHtml(item.title || item.neighborhood || "Narlıdere")}</strong>
          <small><i class="ph ph-map-pin"></i>${escapeHtml(item.neighborhood || "Narlıdere")}</small>
        </div>
        <span class="market-badge ${comparison.className}">${tr(comparison.key)}</span>
      </div>
      <div class="listing-price-row">
        <span class="listing-rent">${money(item.rent)}</span>
        <span>${escapeHtml(item.size || "-")} m2</span>
        <span>${money(rentPerSquareMeter(item))} ${tr("rentPerM2")}</span>
      </div>
      <p>${escapeHtml(item.address || "")}</p>
      <div class="listing-meta">
        <span><i class="ph ph-database"></i>${tr("listingSourceLabel")}: ${escapeHtml(source)}</span>
        <span><i class="ph ph-shield-check"></i>${tr("listingProofLabel")}: ${escapeHtml(proof)}</span>
      </div>
      ${canEditListings() ? `<div class="listing-actions"><button type="button" data-edit="${index}">${tr("editListing")}</button><button type="button" data-delete="${index}">${tr("deleteListing")}</button></div>` : ""}
    </article>`;
  }).join("");

  if (rentMarkers) {
    data.forEach((item, index) => {
      if (!Number.isFinite(Number(item.lat)) || !Number.isFinite(Number(item.lng))) return;
      const comparison = marketComparison(item, median);
      L.marker([Number(item.lat), Number(item.lng)], {
        icon: L.divIcon({
          className: `proof-marker ${comparison.className}`,
          html: `<span>${money(item.rent)}</span>`,
          iconSize: [86, 34],
          iconAnchor: [43, 34],
          popupAnchor: [0, -30]
        })
      }).addTo(rentMarkers).bindPopup(`<strong>${escapeHtml(item.title)}</strong><br>${money(item.rent)}<br>${tr(comparison.key)}`);
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
  $("#adminLogin").classList.toggle("hidden", canEditListings());
  $("#adminForm").classList.toggle("hidden", !canEditListings());
  updateStatuses();
  renderMarket();
}

async function saveListing(event) {
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
  if (editingIndex !== null) {
    item.remoteId = readRentData()[editingIndex]?.remoteId;
  }
  const savedItem = await saveRemoteRentListing(item);
  const data = readRentData();
  if (editingIndex === null) data.unshift(savedItem);
  else data[editingIndex] = savedItem;
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

function assistantCaseContext() {
  const current = Number($("#currentRent").value || 0);
  const requested = Number($("#requestedRent").value || 0);
  const cpi = Number($("#cpiRate").value || 0);
  const max = Math.round(current * (1 + cpi / 100));
  const rents = readRentData();
  const rentValues = rents.map((item) => Number(item.rent || 0)).filter(Boolean).sort((a, b) => a - b);
  const medianRent = rentValues.length ? rentValues[Math.floor(rentValues.length / 2)] : 0;
  return {
    rent: {
      current,
      requested,
      cpi_rate: cpi,
      calculated_ceiling: max,
      requested_above_ceiling: requested > max,
      renewal_date: $("#renewalDate")?.value || null
    },
    location: {
      district: $("#districtSelect")?.value || "Izmir / Narlidere",
      home_type: $("#homeType")?.value || null
    },
    evidence: readEvidence().slice(0, 12).map((item) => ({
      type: item.type,
      status: item.status,
      confidence: item.confidence,
      summary: item.summary || item.note || "",
      file_name: item.fileName || "",
      created_at: item.createdAt || null
    })),
    market: {
      listing_count: rents.length,
      median_rent: medianRent,
      listings: rents.slice(0, 12).map((item) => ({
        title: item.title,
        rent: item.rent,
        size: item.size,
        neighborhood: item.neighborhood,
        address: item.address,
        source: item.source,
        proof: item.proof
      }))
    },
    contract: {
      available: hasContractEvidence()
    }
  };
}

function paragraphHtml(value) {
  return escapeHtml(value || "").split(/\n{2,}/).map((part) => `<p>${part.replace(/\n/g, "<br>")}</p>`).join("");
}

function renderAssistantAnswer(answer, statusMessage = "") {
  const summary = answer?.summary || "";
  const guidance = answer?.guidance || "";
  const draft = answer?.draft || "";
  const note = answer?.note || "";
  $("#assistantAnswer").innerHTML = `<article class="assistant-response">
    <div class="assistant-response-head"><i class="ph ph-sparkle"></i><strong>${escapeHtml(answer?.title || tr("assistantAnswerTitle"))}</strong></div>
    ${statusMessage ? `<section class="assistant-note"><span>${tr("assistantRiskNote")}</span>${paragraphHtml(statusMessage)}</section>` : ""}
    ${summary ? `<section><span>${tr("assistantSummary")}</span>${paragraphHtml(summary)}</section>` : ""}
    ${guidance ? `<section><span>${tr("assistantGuidance")}</span>${paragraphHtml(guidance)}</section>` : ""}
    ${draft ? `<section><span>${tr("assistantReplySection")}</span>${paragraphHtml(draft)}</section>` : ""}
    ${note ? `<section class="assistant-note"><span>${tr("assistantRiskNote")}</span>${paragraphHtml(note)}</section>` : ""}
  </article>`;
  renderChecklist();
}

function renderAssistantNotice(title, message) {
  $("#assistantAnswer").innerHTML = `<article class="assistant-response">
    <div class="assistant-response-head"><i class="ph ph-warning-circle"></i><strong>${escapeHtml(title)}</strong></div>
    <section class="assistant-note"><span>${tr("assistantRiskNote")}</span>${paragraphHtml(message)}</section>
  </article>`;
  renderChecklist();
}

async function callAssistantFunction(question) {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Signed-in session token is missing. Sign out and sign in again.");

  const response = await fetch(`${SUPABASE_URL}/functions/v1/ask-assistant`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      question,
      language: lang,
      case_context: assistantCaseContext()
    })
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { error: text };
  }
  if (!response.ok) {
    const detailParts = [
      payload?.error || payload?.message || payload?.code || text || `HTTP ${response.status}`,
      payload?.error_code ? `Code: ${payload.error_code}` : "",
      payload?.recovery ? `Fix: ${payload.recovery}` : "",
      payload?.reset ? `Reset: ${payload.reset}` : "",
      payload?.billing_url ? `Billing: ${payload.billing_url}` : ""
    ].filter(Boolean);
    const message = detailParts.join("\n");
    throw new Error(`HTTP ${response.status}: ${message}`);
  }
  if (!payload?.answer) throw new Error("Assistant response did not include an answer.");
  return payload.answer;
}

async function assistantReply() {
  const question = $("#questionBox").value.trim();
  if (!question) return;

  if (!supabaseClient || !currentUser) {
    renderAssistantNotice(tr("assistantEyebrow"), tr("assistantNeedsLogin"));
    return;
  }

  const button = $("#askAssistant");
  button.disabled = true;
  $("#assistantAnswer").innerHTML = `<article class="assistant-response"><div class="assistant-response-head"><i class="ph ph-sparkle"></i><strong>${tr("assistantWorking")}</strong></div></article>`;
  try {
    const answer = await callAssistantFunction(question);
    renderAssistantAnswer(answer);
  } catch (error) {
    renderAssistantNotice(tr("assistantEyebrow"), `${tr("assistantUnavailable")}\n\n${error.message || "Network error"}`);
  } finally {
    button.disabled = false;
  }
}

async function copyAssistantDraft() {
  const text = $("#assistantAnswer").innerText.trim();
  if (!text) return;
  await navigator.clipboard?.writeText(text);
  $("#copyAssistant").textContent = tr("copiedDraft");
  window.setTimeout(() => {
    $("#copyAssistant").textContent = tr("copyDraft");
  }, 1400);
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
  $("#copyAssistant").textContent = tr("copyDraft");
  renderPromptChips();
  $$(".lang-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === lang);
    button.classList.remove("selected");
  });
  calculateRent();
  renderRisks();
  renderContract();
  renderEvidence();
  renderAdminState();
  renderWelcomeGate();
}

function bindEvents() {
  $("#signInButton").addEventListener("click", () => signIn("account"));
  $("#signUpButton").addEventListener("click", () => signUp("account"));
  $("#signOutButton").addEventListener("click", signOut);
  $("#resetPasswordButton").addEventListener("click", () => resetPassword("account"));
  $("#welcomeSubmit").addEventListener("click", () => {
    if (welcomeAuthMode === "login") signIn("welcome");
    else signUp("welcome");
  });
  $("#welcomeForgot").addEventListener("click", () => resetPassword("welcome"));
  $("#continueGuest").addEventListener("click", continueAsGuest);
  $$(".auth-tabs button").forEach((button) => {
    button.addEventListener("click", () => {
      welcomeAuthMode = button.dataset.authMode;
      setAuthMessage(tr("welcomeHint"), "welcome", "info");
      renderWelcomeGate();
    });
  });
  $("#calculateRent").addEventListener("click", calculateRent);
  ["#currentRent", "#requestedRent", "#cpiRate"].forEach((selector) => $(selector).addEventListener("input", calculateRent));
  $("#contractUpload").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    $("#ocrStamp").textContent = tr("processing");
    const analysis = await analyzeEvidenceFile(file);
    renderContractPreview({
      name: file.name,
      fileName: file.name,
      fileType: file.type || analysis?.fileType || "",
      previewUrl: analysis?.previewUrl || "",
      status: analysis?.status || "uploaded"
    });
    const item = await persistEvidenceFile(file, "contract", tr("contractTitle"), analysis);
    writeJson(CONTRACT_KEY, {
      name: file.name,
      fileName: item.fileName || file.name,
      fileType: item.fileType || file.type || "",
      previewUrl: item.previewUrl || "",
      storagePath: item.storagePath || "",
      remoteId: item.remoteId || null,
      status: item.status,
      uploadedAt: new Date().toISOString()
    });
    $("#contractUpload").value = "";
    $("#evidenceAnalysis").innerHTML = `<article class="analysis-card ok"><strong>${tr("uploaded")}</strong><p>${tr("contractSaved")}</p></article>`;
    renderContract();
    renderEvidence();
  });
  $("#addEvidence").addEventListener("click", addEvidence);
  $("#evidenceFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    selectedEvidenceAnalysis = null;
    if (!file) {
      $("#scannerFileName").textContent = tr("scannerCta");
      renderPendingEvidenceAnalysis(null);
      return;
    }
    $("#scannerFileName").textContent = file.name;
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
  $("#copyAssistant").addEventListener("click", copyAssistantDraft);
  $("#promptChips").addEventListener("click", (event) => {
    const button = event.target.closest("[data-prompt]");
    if (!button) return;
    $("#questionBox").value = button.dataset.prompt;
    $("#questionBox").focus();
  });
  $("#evidenceTimeline").addEventListener("click", (event) => {
    const openButton = event.target.closest("[data-open-evidence]");
    const renameButton = event.target.closest("[data-rename-evidence]");
    const deleteButton = event.target.closest("[data-delete-evidence]");
    if (openButton) openEvidence(Number(openButton.dataset.openEvidence));
    if (renameButton) updateEvidenceNote(Number(renameButton.dataset.renameEvidence));
    if (deleteButton) deleteEvidence(Number(deleteButton.dataset.deleteEvidence));
  });
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
  $("#listingList").addEventListener("click", async (event) => {
    const edit = event.target.closest("[data-edit]");
    const del = event.target.closest("[data-delete]");
    if (edit) editListing(Number(edit.dataset.edit));
    if (del) {
      const data = readRentData();
      const [removed] = data.splice(Number(del.dataset.delete), 1);
      await deleteRemoteRentListing(removed);
      writeJson(RENT_KEY, data);
      renderMarket();
      return;
    }
    if (edit) return;
    const card = event.target.closest("[data-focus-listing]");
    if (card) {
      const index = Number(card.dataset.focusListing);
      const item = readRentData()[index];
      selectedListingIndex = index;
      if (item && rentMap && Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng))) {
        rentMap.setView([Number(item.lat), Number(item.lng)], Math.max(rentMap.getZoom(), 16));
      }
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
  if (supabaseClient) {
    supabaseClient.auth.getSession().then(({ data }) => {
      currentUser = data?.session?.user || null;
      return loadProfile();
    }).then(() => {
      renderAuthState();
      loadRemoteEvidence();
      loadRemoteRentListings();
    });
  } else {
    renderAuthState();
  }
});
