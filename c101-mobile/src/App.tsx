import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Component, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuthSession } from "./hooks/useAuthSession";
import { supabaseAnonKey, supabaseUrl } from "./lib/supabase";
import {
  createEvidenceSignedUrl,
  deleteEvidenceItem,
  evidenceSummaryText,
  loadEvidenceItems,
  retryEvidenceAnalysis,
  summarizeEvidence,
  updateEvidenceItem,
  uploadEvidence,
  type EvidenceItem,
  type EvidenceSummary,
  type EvidenceType,
} from "./services/evidence";
import {
  calculateRentIncrease,
  formatLira,
  formatPercent,
  safeNumber,
} from "./services/rentCalculator";
import {
  loadRentListings,
  marketComparison,
  medianRent,
  rentPerSquareMeter,
  type RentListing,
} from "./services/rentListings";
import {
  approveRentalImport,
  createRentalImports,
  loadRentalImports,
  parseRentalImportText,
  parseSahibindenBrowserText,
  rejectRentalImport,
  stageRentalImportFromUrl,
  type RentalImportItem,
} from "./services/rentalImports";
import {
  billingPlans,
  createBillingUpgradeRequest,
  loadLatestUpgradeRequest,
  loadBillingEntitlement,
  loadUsageCounters,
  metricLabel,
  planName,
  processorName,
  type BillingEntitlement,
  type BillingPlan,
  type BillingUpgradeRequest,
  type UsageCounter,
  type UsageMetric,
} from "./services/billing";
import {
  loadStoreBillingStatus,
  purchaseTenantPlus,
  restoreTenantPlus,
  type StoreBillingStatus,
} from "./services/storeBilling";

type TabKey = "home" | "calc" | "rights" | "inspection" | "chat" | "account";

type TabConfig = {
  key: TabKey;
};

const SAHIBINDEN_BOOKMARKLET = `javascript:(()=>{const K="c101_sahibinden_batch",c=v=>String(v||"").replace(/\\s+/g," ").trim(),n=v=>{const x=String(v||"").replace(/[^\\d.,]/g,"").replace(/\\.(?=\\d{3}(?:\\D|$))/g,"").replace(",",".");const y=Number(x);return Number.isFinite(y)&&y>0?Math.round(y):null},s=v=>c(v).toLowerCase().replace(/[ıİ]/g,"i").replace(/[şŞ]/g,"s").replace(/[ğĞ]/g,"g").replace(/[üÜ]/g,"u").replace(/[öÖ]/g,"o").replace(/[çÇ]/g,"c").replace(/²/g,"2").replace(/[^\\w\\s]/g," ").replace(/\\s+/g," ").trim(),t=q=>c(document.querySelector(q)?.textContent),d=()=>{const o={};document.querySelectorAll(".classifiedInfoList li").forEach(i=>{const k=s(i.querySelector("strong")?.textContent),v=c(i.querySelector("span")?.textContent||i.textContent);if(k&&v)o[k]=v});return o},cr=()=>Array.from(document.querySelectorAll(".classifiedInfo a,.classifiedInfo h2 a,.classifiedBreadCrumb a")).map(i=>c(i.textContent)).filter(Boolean),loc=a=>{const cs=["istanbul","izmir","ankara","antalya","bursa","mugla"],ix=a.findIndex(x=>cs.includes(s(x))),city=ix>=0?a[ix]:"",district=ix>=0?a[ix+1]||"":"",neighborhood=ix>=0?a[ix+2]||"":"";return{address:[neighborhood,district,city].filter(Boolean).join(", "),city,district,neighborhood}},first=a=>{for(const v of a){const p=n(v);if(p)return p}return null},info=d(),txt=document.body.innerText||"",l=loc(cr()),title=t(".classifiedTitle")||t("h1")||document.title||"Sahibinden kira ilani",rent=first([t(".classifiedInfo h3"),t(".classified-price-container"),/([\\d.,]{4,12})\\s*(?:TL|TRY|₺)/i.exec(txt)?.[1]]);if(!rent){alert("C101: Bu sayfada kira/fiyat algilanamadi.");return}const item={address:l.address||null,building_age:n(info["bina yasi"]),city:l.city||"İzmir",deposit:n(info.depozito),description:c(document.querySelector("#classifiedDescription")?.textContent).slice(0,1200)||null,district:l.district||"Narlıdere",floor:info["bulundugu kat"]||info.kat||null,heating:info.isitma||null,image_urls:Array.from(document.querySelectorAll("img")).map(i=>i.currentSrc||i.src).filter(src=>/sahibinden\\.com/.test(src)).slice(0,8),neighborhood:l.neighborhood||null,proof:location.href,raw_json:{parser:"sahibinden_bookmarklet_v1",captured_at:new Date().toISOString()},rent,rooms:info["oda sayisi"]||/\\b(\\d+\\s*\\+\\s*\\d+)\\b/.exec(txt)?.[1]||null,size:first([info["m2 brut"],info["m2 net"],/([\\d.,]{2,5})\\s*m\\s*[²2]/i.exec(txt)?.[1]]),source:"sahibinden.com",source_url:location.href,title},ex=JSON.parse(localStorage.getItem(K)||"[]").filter(r=>r.source_url!==item.source_url);ex.push(item);localStorage.setItem(K,JSON.stringify(ex));if(confirm("C101: "+ex.length+" ilan toplandi.\\n\\nTamam = batch JSON kopyala\\nIptal = sadece kaydet, sonra devam et")){navigator.clipboard.writeText(JSON.stringify(ex,null,2)).then(()=>{if(confirm("C101: Batch JSON kopyalandi. Kopyalanan batch temizlensin mi?"))localStorage.removeItem(K)}).catch(()=>alert("C101: Kopyalama basarisiz. Tarayici pano iznini kontrol et."))}else alert("C101: Ilan kaydedildi. Diger ilanlarda bookmarklet'i tekrar calistir.")})();`;

type AssistantAnswer = {
  title: string;
  summary: string;
  guidance: string;
  draft: string;
  note: string;
  answer_text: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  answer?: AssistantAnswer;
};

type RentCaseState = {
  cpiRate: string;
  currentRent: string;
  renewalDate: string;
  requestedRent: string;
};

type PaymentHistoryItem = {
  amount: number;
  month: string;
  status: "Bekliyor" | "Ödendi";
};

type RentProfileState = {
  amount: number;
  city: string;
  contractDate: string;
  depositTL: number;
  dueDay: number;
  iban: string;
  isPaid: boolean;
  landlordName: string;
  paymentHistory: PaymentHistoryItem[];
  tufeRate: number;
};

type MarketSummary = {
  listingCount: number;
  medianRent: number;
};

type AppLanguage = "en" | "tr";

type EvictionWizardState = {
  sameDate: "no" | "unknown" | "yes";
  blankDate: "no" | "unknown" | "yes";
};

type InspectionItem = {
  attachments?: InspectionAttachment[];
  id: string;
  room: string;
  desc: string;
  status: "documented" | "review";
};

type InspectionAttachment = {
  id: string;
  mimeType: string | null;
  name: string;
  size: number | null;
  uri: string;
};

const kiraLogo = require("../assets/kira-logo-transparent.png");
const fontRegular = Platform.select({
  android: "sans-serif",
  ios: "Avenir Next",
  default: "system-ui",
});
const fontMedium = Platform.select({
  android: "sans-serif-medium",
  ios: "Avenir Next",
  default: "system-ui",
});
const glassShadow = Platform.select({
  android: {
    elevation: 3,
  },
  default: {
    shadowColor: "#06B6D4",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.13,
    shadowRadius: 24,
  },
});
const softShadow = Platform.select({
  android: {
    elevation: 2,
  },
  default: {
    shadowColor: "#0F7294",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
});

const initialRentCase: RentCaseState = {
  cpiRate: "65",
  currentRent: "18000",
  renewalDate: "",
  requestedRent: "29000",
};

const initialRentProfile: RentProfileState = {
  amount: 22500,
  city: "İstanbul / Kadıköy",
  contractDate: "2023-09-01",
  depositTL: 45000,
  dueDay: 5,
  iban: "",
  isPaid: false,
  landlordName: "",
  paymentHistory: [],
  tufeRate: 64.91,
};

function isOldSamplePaymentHistory(items: PaymentHistoryItem[] | undefined) {
  if (!items || items.length !== 6) return false;
  const sampleMonths = ["Eylül 2025", "Ekim 2025", "Kasım 2025", "Aralık 2025", "Ocak 2026", "Şubat 2026"];
  return sampleMonths.every((month, index) => items[index]?.month === month && items[index]?.amount === 22500);
}

const tabs: TabConfig[] = [
  { key: "home" },
  { key: "calc" },
  { key: "rights" },
  { key: "inspection" },
  { key: "chat" },
];

const tabSymbols: Record<TabKey, string> = {
  account: "A",
  calc: "%",
  chat: "AI",
  home: "H",
  inspection: "+",
  rights: "K",
};

function text(language: AppLanguage, en: string, tr: string) {
  return language === "tr" ? tr : en;
}

function tabCopy(key: TabKey, language: AppLanguage) {
  const copy: Record<TabKey, { eyebrow: string; label: string; title: string }> = {
    home: {
      eyebrow: text(language, "Next best action", "Siradaki en dogru adim"),
      label: text(language, "Home", "Ana sayfa"),
      title: text(language, "Case dashboard", "Dosya panosu"),
    },
    calc: {
      eyebrow: text(language, "Legal rent increase", "Yasal kira artışı"),
      label: text(language, "Calculate", "Hesapla"),
      title: text(language, "Legal rent ceiling", "Yasal kira tavanı"),
    },
    rights: {
      eyebrow: text(language, "AI evidence analysis", "AI kanıt analizi"),
      label: text(language, "Vault", "Kanıt"),
      title: text(language, "Evidence vault", "Kanıt kasası"),
    },
    inspection: {
      eyebrow: text(language, "Move-in proof", "Ev tespiti"),
      label: text(language, "Inspect", "Tespit"),
      title: text(language, "Home condition log", "Ev durum tespiti"),
    },
    chat: {
      eyebrow: text(language, "AI tenant assistant", "AI kiracı asistanı"),
      label: text(language, "AI", "AI"),
      title: text(language, "Kira assistant", "Kira asistanı"),
    },
    account: {
      eyebrow: text(language, "Login and settings", "Giris ve ayarlar"),
      label: text(language, "Account", "Hesap"),
      title: text(language, "Account", "Hesap"),
    },
  };
  return copy[key];
}

function displayEvidenceType(type: EvidenceType, language: AppLanguage) {
  const labels: Record<EvidenceType, { en: string; tr: string }> = {
    bank: { en: "Bank proof", tr: "Banka kaniti" },
    contract: { en: "Contract", tr: "Sözlesme" },
    listing: { en: "Listing proof", tr: "Ilan kaniti" },
    message: { en: "Message", tr: "Mesaj" },
    photo: { en: "Photo", tr: "Fotograf" },
  };
  const label = labels[type] || { en: "Evidence", tr: "Kanit" };
  return text(language, label.en, label.tr);
}

function displayEvidenceStatus(status: EvidenceItem["status"] | "missing", language: AppLanguage) {
  const labels: Record<EvidenceItem["status"] | "missing", { en: string; tr: string }> = {
    available: { en: "Available", tr: "Hazir" },
    failed: { en: "Failed", tr: "Basarisiz" },
    missing: { en: "Missing", tr: "Eksik" },
    processing: { en: "Processing", tr: "Isleniyor" },
    review_required: { en: "Review", tr: "Kontrol" },
    uploaded: { en: "Uploaded", tr: "Yüklendi" },
  };
  const label = labels[status] || { en: status, tr: status };
  return text(language, label.en, label.tr);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [showWelcome, setShowWelcome] = useState(true);
  const [language, setLanguage] = useState<AppLanguage>("tr");
  const [isPaid, setIsPaid] = useState(false);
  const [rentCase, setRentCase] = useState<RentCaseState>(initialRentCase);
  const [rentProfile, setRentProfile] = useState<RentProfileState>(initialRentProfile);
  const [marketSummary, setMarketSummary] = useState<MarketSummary>({
    listingCount: 0,
    medianRent: 0,
  });
  const [evidenceSummary, setEvidenceSummary] = useState<EvidenceSummary>({
    availableCount: 0,
    contractStatus: "missing",
    latestSummary: "",
    reviewCount: 0,
    totalCount: 0,
  });
  const auth = useAuthSession();
  const currentTab = useMemo(() => tabCopy(activeTab, language), [activeTab, language]);

  useEffect(() => {
    AsyncStorage.getItem("c101.language").then((stored) => {
      if (stored === "en" || stored === "tr") {
        setLanguage(stored);
      }
    });
    AsyncStorage.getItem("c101.rentPaid").then((stored) => {
      if (stored === "true" || stored === "false") {
        setIsPaid(stored === "true");
        setRentProfile((current) => ({ ...current, isPaid: stored === "true" }));
      }
    });
    AsyncStorage.getItem("c101.rentProfile").then((stored) => {
      if (!stored) return;
      try {
        const parsed = JSON.parse(stored) as Partial<RentProfileState>;
        setRentProfile((current) => ({
          ...current,
          ...parsed,
          paymentHistory: isOldSamplePaymentHistory(parsed.paymentHistory)
            ? []
            : parsed.paymentHistory || current.paymentHistory,
        }));
      } catch {}
    });
  }, []);

  function updateLanguage(nextLanguage: AppLanguage) {
    setLanguage(nextLanguage);
    void AsyncStorage.setItem("c101.language", nextLanguage);
  }

  function updatePaidStatus(nextValue: boolean) {
    setIsPaid(nextValue);
    setRentProfile((current) => {
      const next = { ...current, isPaid: nextValue };
      void AsyncStorage.setItem("c101.rentProfile", JSON.stringify(next));
      return next;
    });
    void AsyncStorage.setItem("c101.rentPaid", String(nextValue));
  }

  function updateRentProfile(nextProfile: RentProfileState) {
    setRentProfile(nextProfile);
    setRentCase((current) => ({
      ...current,
      cpiRate: String(nextProfile.tufeRate),
      currentRent: String(nextProfile.amount),
    }));
    void AsyncStorage.setItem("c101.rentProfile", JSON.stringify(nextProfile));
  }

  useEffect(() => {
    if (auth.user) {
      setShowWelcome(false);
    }
  }, [auth.user]);

  async function signInFromWelcome() {
    await auth.signInWithGoogle();
  }

  return (
    <AppErrorBoundary>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        {showWelcome ? (
          <WelcomeScreen
            authStatus={auth.status}
            language={language}
            onLanguageChange={updateLanguage}
            onSignIn={signInFromWelcome}
          />
        ) : (
          <View style={styles.app}>
          <View pointerEvents="none" style={styles.backgroundTopWash} />
          <View style={styles.header}>
            <AppLogo size="small" />
            <View style={styles.headerCopy}>
              <Text style={styles.brand}>
                {text(language, "Kira Assistant", "Kira Asistanı")}
              </Text>
              <Text style={styles.subtitle}>
                {rentProfile.city}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveTab("account")}
              style={styles.statusPill}
            >
              <Text style={styles.statusText}>
                {auth.status === "signed-in"
                  ? text(language, "Account", "Hesap")
                  : "TBK"}
              </Text>
            </Pressable>
            <LanguageIconButton language={language} onLanguageChange={updateLanguage} />
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.pageIntro}>
              <Text style={styles.eyebrow}>{currentTab.eyebrow}</Text>
              <Text style={styles.title}>{currentTab.title}</Text>
              <PageLogo />
            </View>
            <ScreenContent
              activeTab={activeTab}
              auth={auth}
              evidenceSummary={evidenceSummary}
              isPaid={isPaid}
              language={language}
              marketSummary={marketSummary}
              onEvidenceSummaryChange={setEvidenceSummary}
              onLanguageChange={updateLanguage}
              onMarketSummaryChange={setMarketSummary}
              onRentCaseChange={setRentCase}
              onRentProfileChange={updateRentProfile}
              onTabChange={setActiveTab}
              rentCase={rentCase}
              rentProfile={rentProfile}
              onPaidChange={updatePaidStatus}
            />
          </ScrollView>

          <View style={styles.tabBar}>
            {tabs.map((tab) => {
              const selected = tab.key === activeTab;
              const copy = tabCopy(tab.key, language);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[styles.tabButton, selected && styles.tabButtonActive]}
                >
                  <Text style={[styles.tabSymbol, selected && styles.tabSymbolActive]}>
                    {tabSymbols[tab.key]}
                  </Text>
                  <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>
                    {copy.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        )}
      </SafeAreaView>
    </AppErrorBoundary>
  );
}

type AuthController = ReturnType<typeof useAuthSession>;

function AppLogo({ size }: { size: "small" | "large" }) {
  return (
    <View style={size === "small" ? styles.logoSmallFrame : styles.logoLargeFrame}>
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={kiraLogo}
        style={size === "small" ? (styles.logoSmallImage as any) : (styles.logoLargeImage as any)}
      />
    </View>
  );
}

function PageLogo() {
  return (
    <View style={styles.pageLogoWrap}>
      <AppLogo size="large" />
    </View>
  );
}

function LanguageIconButton({
  language,
  onLanguageChange,
}: {
  language: AppLanguage;
  onLanguageChange: (language: AppLanguage) => void;
}) {
  const nextLanguage = language === "tr" ? "en" : "tr";
  return (
    <Pressable
      accessibilityLabel={text(language, "Switch language", "Dili degistir")}
      accessibilityRole="button"
      onPress={() => onLanguageChange(nextLanguage)}
      style={styles.languageIconButton}
    >
      <Text style={styles.languageIcon}>TR</Text>
      <Text style={styles.languageIconText}>{language === "tr" ? "EN" : "TR"}</Text>
    </Pressable>
  );
}

function WelcomeScreen({
  authStatus,
  language,
  onLanguageChange,
  onSignIn,
}: {
  authStatus: AuthController["status"];
  language: AppLanguage;
  onLanguageChange: (language: AppLanguage) => void;
  onSignIn: () => void;
}) {
  return (
    <View style={styles.welcomeScreen}>
      <View pointerEvents="none" style={styles.welcomeTopWash} />
      <View style={styles.welcomeHeader}>
        <LanguageIconButton language={language} onLanguageChange={onLanguageChange} />
      </View>

      <ScrollView contentContainerStyle={styles.welcomeContent}>
        <View style={styles.welcomeLogoBlock}>
          <AppLogo size="large" />
          <Text style={styles.welcomeBrand}>
            {text(language, "Kira Assistant", "Kira Asistanı")}
          </Text>
          <Text style={styles.welcomeTagline}>
            {text(
              language,
              "Your calm, organized tenant-rights companion.",
              "Kira, kanıt ve kiracı hakları için sakin ve düzenli yardımcın."
            )}
          </Text>
        </View>

        <View style={styles.welcomeHeroCard}>
          <Text style={styles.welcomeEyebrow}>
            {text(language, "Start protected", "Güvende başla")}
          </Text>
          <Text style={styles.welcomeTitle}>
            {text(
              language,
              "Track rent, evidence, documents and AI guidance in one place.",
              "Kiranı, kanıtlarını, belgelerini ve AI desteğini tek yerde yönet."
            )}
          </Text>
          <Text style={styles.welcomeBody}>
            {text(
              language,
              "Sign in once with Google to keep your evidence, documents, AI limits and case history tied to one trusted account.",
              "Kanıtlarını, belgelerini, AI limitlerini ve dosya geçmişini güvenilir tek hesaba bağlamak için Google ile giriş yap."
            )}
          </Text>
        </View>

        <View style={styles.welcomeFeatureGrid}>
          <WelcomeFeature
            label={text(language, "Legal rent ceiling", "Yasal kira tavanı")}
            value={text(language, "TÜFE / TBK 344", "TÜFE / TBK 344")}
          />
          <WelcomeFeature
            label={text(language, "Evidence vault", "Kanıt kasası")}
            value={text(language, "AI document review", "AI belge kontrolü")}
          />
          <WelcomeFeature
            label={text(language, "Home inspection", "Ev tespiti")}
            value={text(language, "Photo and file log", "Fotoğraf ve dosya kaydı")}
          />
          <WelcomeFeature
            label={text(language, "Ask Kira", "Kira'ya sor")}
            value={text(language, "Tenant-focused answers", "Kiracı odaklı yanıtlar")}
          />
        </View>

        <View style={styles.welcomeActionCard}>
          <Pressable
            accessibilityRole="button"
            disabled={authStatus === "loading"}
            onPress={onSignIn}
            style={[styles.googleButton, authStatus === "loading" && styles.disabledButton]}
          >
            {authStatus === "loading" ? (
              <ActivityIndicator color="#4285F4" />
            ) : (
              <GoogleButtonContent
                language={language}
                subtitle={text(language, "Secure app sign-in", "Güvenli uygulama girişi")}
              />
            )}
          </Pressable>
          <Text style={styles.welcomePrivacyNote}>
            {text(
              language,
              "Google sign-in is required so usage limits and private evidence stay tied to one trusted account.",
              "Kullanım limitleri ve özel kanıtlar güvenilir tek hesaba bağlı kalsın diye Google girişi zorunludur."
            )}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function WelcomeFeature({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.welcomeFeatureCard}>
      <Text style={styles.welcomeFeatureLabel}>{label}</Text>
      <Text style={styles.welcomeFeatureValue}>{value}</Text>
    </View>
  );
}

function GoogleButtonContent({
  language,
  subtitle,
}: {
  language: AppLanguage;
  subtitle?: string;
}) {
  return (
    <View style={styles.googleButtonInner}>
      <View style={styles.googleMark}>
        <Text style={styles.googleMarkBlue}>G</Text>
        <View style={[styles.googleDot, styles.googleDotRed]} />
        <View style={[styles.googleDot, styles.googleDotYellow]} />
        <View style={[styles.googleDot, styles.googleDotGreen]} />
      </View>
      <View style={styles.googleButtonCopy}>
        <Text style={styles.googleButtonText}>
          {text(language, "Continue with Google", "Google ile devam et")}
        </Text>
        {subtitle ? <Text style={styles.googleButtonSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { errorMessage: string }
> {
  state = { errorMessage: "" };

  static getDerivedStateFromError(error: unknown) {
    return {
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.fatalErrorCard}>
            <Text style={styles.errorTitle}>App could not load</Text>
            <Text style={styles.errorText}>{this.state.errorMessage}</Text>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

function ScreenContent({
  activeTab,
  auth,
  evidenceSummary,
  isPaid,
  language,
  marketSummary,
  onPaidChange,
  onEvidenceSummaryChange,
  onLanguageChange,
  onMarketSummaryChange,
  onRentCaseChange,
  onRentProfileChange,
  onTabChange,
  rentCase,
  rentProfile,
}: {
  activeTab: TabKey;
  auth: AuthController;
  evidenceSummary: EvidenceSummary;
  isPaid: boolean;
  language: AppLanguage;
  marketSummary: MarketSummary;
  onPaidChange: (value: boolean) => void;
  onEvidenceSummaryChange: (summary: EvidenceSummary) => void;
  onLanguageChange: (language: AppLanguage) => void;
  onMarketSummaryChange: (summary: MarketSummary) => void;
  onRentCaseChange: (next: RentCaseState) => void;
  onRentProfileChange: (next: RentProfileState) => void;
  onTabChange: (tab: TabKey) => void;
  rentCase: RentCaseState;
  rentProfile: RentProfileState;
}) {
  const rentCalculation = calculateRentIncrease({
    cpiRate: safeNumber(rentCase.cpiRate),
    currentRent: safeNumber(rentCase.currentRent),
    renewalDate: rentCase.renewalDate,
    requestedRent: safeNumber(rentCase.requestedRent),
  });

  if (activeTab === "home") {
    return (
      <GeminiHomeTab
        language={language}
        onPaidChange={onPaidChange}
        onProfileChange={onRentProfileChange}
        onTabChange={onTabChange}
        profile={rentProfile}
      />
    );
  }

  if (activeTab === "calc") {
    return (
      <LegalCalculatorTab
        language={language}
        onMarketSummaryChange={onMarketSummaryChange}
        onProfileChange={onRentProfileChange}
        profile={rentProfile}
      />
    );
  }

  if (activeTab === "rights") {
    return (
      <EvidencePanel
        auth={auth}
        language={language}
        onEvidenceSummaryChange={onEvidenceSummaryChange}
      />
    );
  }

  if (activeTab === "inspection") {
    return <InspectionTrackerTab language={language} />;
  }

  if (activeTab === "chat") {
    return (
      <KiraPanel
        auth={auth}
        evidenceSummary={evidenceSummary}
        language={language}
        marketSummary={marketSummary}
        rentCase={{
          ...rentCase,
          cpiRate: String(rentProfile.tufeRate),
          currentRent: String(rentProfile.amount),
        }}
      />
    );
  }

  return (
    <AccountPanel auth={auth} language={language} onLanguageChange={onLanguageChange} />
  );
}

function LegacyHomePanel({
  auth,
  evidenceSummary,
  isPaid,
  language,
  marketSummary,
  onPaidChange,
  onTabChange,
  rentCalculation,
  rentCase,
}: {
  auth: AuthController;
  evidenceSummary: EvidenceSummary;
  isPaid: boolean;
  language: AppLanguage;
  marketSummary: MarketSummary;
  onPaidChange: (value: boolean) => void;
  onTabChange: (tab: TabKey) => void;
  rentCalculation: ReturnType<typeof calculateRentIncrease>;
  rentCase: RentCaseState;
}) {
  const checklist = buildHomeChecklist({
    auth,
    evidenceSummary,
    language,
    marketSummary,
    rentCalculation,
    rentCase,
  });

  return (
    <View style={styles.stack}>
      <RentStatusHero
        isPaid={isPaid}
        language={language}
        onPaidChange={onPaidChange}
        rentCase={rentCase}
      />
      <SummaryCard
        label={text(language, "Recommended next step", "Önerilen sonraki adım")}
        value={
          rentCalculation.aboveCeiling
            ? text(language, "Ask Kira to draft a reply using your rent calculation.", "Kira'dan kira hesabına göre cevap taslağı hazırlamasını iste.")
            : text(language, "Upload your lease or first evidence file.", "Kira sözleşmeni veya ilk kanıt dosyanı yükle.")
        }
      />
      <View style={styles.grid}>
        <Metric label={text(language, "Current rent", "Mevcut kira")} value={formatLira(safeNumber(rentCase.currentRent))} />
        <Metric label={text(language, "Requested rent", "İstenen kira")} value={formatLira(safeNumber(rentCase.requestedRent))} />
        <Metric label={text(language, "Ceiling", "Tahmini sınır")} value={formatLira(rentCalculation.ceiling)} />
        <Metric
          label={text(language, "Market", "Emsal")}
          value={
            marketSummary.medianRent
              ? formatLira(marketSummary.medianRent)
              : text(language, `${marketSummary.listingCount} listings`, `${marketSummary.listingCount} ilan`)
          }
        />
        <Metric label={text(language, "Evidence", "Kanıt")} value={text(language, `${evidenceSummary.totalCount} items`, `${evidenceSummary.totalCount} öge`)} />
        <Metric
          label={text(language, "Contract", "Sözleşme")}
          value={displayEvidenceStatus(evidenceSummary.contractStatus, language)}
        />
        <Metric
          label={text(language, "Account", "Hesap")}
          value={auth.status === "signed-in" ? text(language, "Connected", "Bağlı") : text(language, "Guest", "Misafir")}
        />
      </View>
      <View style={styles.checklistCard}>
        <Text style={styles.sectionTitle}>{text(language, "Case readiness", "Dosya hazırlığı")}</Text>
        <Text style={styles.sectionSubtitle}>
          {text(language, "Finish the base steps before relying on Kira for a complete case answer.", "Kira'dan güçlü cevap almak için temel dosya adımlarını tamamla.")}
        </Text>
        <View style={styles.checklistList}>
          {checklist.map((item) => (
            <ChecklistRow
              item={item}
              language={language}
              key={item.label}
              onPress={() => onTabChange(item.targetTab)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

type HomeChecklistItem = {
  complete: boolean;
  helper: string;
  label: string;
  targetTab: TabKey;
};

function buildHomeChecklist({
  auth,
  evidenceSummary,
  language,
  marketSummary,
  rentCalculation,
  rentCase,
}: {
  auth: AuthController;
  evidenceSummary: EvidenceSummary;
  language: AppLanguage;
  marketSummary: MarketSummary;
  rentCalculation: ReturnType<typeof calculateRentIncrease>;
  rentCase: RentCaseState;
}): HomeChecklistItem[] {
  const hasRentValues =
    safeNumber(rentCase.currentRent) > 0 &&
    safeNumber(rentCase.requestedRent) > 0 &&
    safeNumber(rentCase.cpiRate) > 0;

  return [
    {
      complete: auth.status === "signed-in",
      helper: auth.status === "signed-in" ? text(language, "Account is connected.", "Hesap bagli.") : text(language, "Sign in to save evidence and ask Kira.", "Kanit kaydetmek ve Kira'ya sormak için giris yap."),
      label: text(language, "Account", "Hesap"),
      targetTab: "account",
    },
    {
      complete: hasRentValues,
      helper: hasRentValues
        ? rentCalculation.aboveCeiling
          ? text(language, "Requested rent is above the estimated ceiling.", "Istenen kira tahmini sinirin üstünde.")
          : text(language, "Rent numbers are ready for Kira.", "Kira rakamlari Kira için hazir.")
        : text(language, "Enter current rent, requested rent, and CPI/TUFE.", "Mevcut kira, istenen kira ve TÜFE bilgisini gir."),
      label: text(language, "Rent calculation", "Kira hesabi"),
      targetTab: "calc",
    },
    {
      complete: evidenceSummary.totalCount > 0,
      helper: evidenceSummary.totalCount
        ? text(language, `${evidenceSummary.totalCount} evidence item${evidenceSummary.totalCount === 1 ? "" : "s"} loaded.`, `${evidenceSummary.totalCount} kanit yüklendi.`)
        : text(language, "Upload photos, messages, receipts, or bank proof.", "Fotograf, mesaj, dekont veya banka kaniti yükle."),
      label: text(language, "Evidence", "Kanit"),
      targetTab: "inspection",
    },
    {
      complete: evidenceSummary.contractStatus !== "missing",
      helper:
        evidenceSummary.contractStatus !== "missing"
          ? text(language, `Contract is ${displayEvidenceStatus(evidenceSummary.contractStatus, language).toLowerCase()}.`, `Sözlesme durumu: ${displayEvidenceStatus(evidenceSummary.contractStatus, language).toLowerCase()}.`)
          : text(language, "Upload the lease as contract evidence.", "Kira sözlesmesini sözlesme kaniti olarak yükle."),
      label: text(language, "Contract", "Sözlesme"),
      targetTab: "inspection",
    },
    {
      complete: marketSummary.listingCount > 0,
      helper: marketSummary.listingCount
        ? text(language, `${marketSummary.listingCount} nearby listing${marketSummary.listingCount === 1 ? "" : "s"} loaded.`, `${marketSummary.listingCount} yakin emsal ilan yüklendi.`)
        : text(language, "Refresh rent listings for market proof.", "Emsal kira kaniti için ilanlari yenile."),
      label: text(language, "Market proof", "Emsal kanit"),
      targetTab: "calc",
    },
  ];
}

function ChecklistRow({
  item,
  language,
  onPress,
}: {
  item: HomeChecklistItem;
  language: AppLanguage;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.checklistRow}
    >
      <View
        style={[
          styles.checklistDot,
          item.complete ? styles.checklistDotComplete : styles.checklistDotPending,
        ]}
      >
        <Text style={styles.checklistDotText}>{item.complete ? "OK" : ""}</Text>
      </View>
      <View style={styles.checklistTextWrap}>
        <Text style={styles.checklistLabel}>{item.label}</Text>
        <Text style={styles.checklistHelper}>{item.helper}</Text>
      </View>
      <Text style={styles.checklistActionText}>{text(language, "Open", "Aç")}</Text>
    </Pressable>
  );
}

function daysUntilDue(dueDay: number) {
  const today = new Date();
  const currentDay = today.getDate();
  const normalizedDueDay = Math.max(1, Math.min(31, dueDay || 1));
  const diff = normalizedDueDay - currentDay;
  return diff >= 0 ? diff : diff + 30;
}

function legalCeiling(profile: RentProfileState) {
  return Math.round(profile.amount * (1 + profile.tufeRate / 100));
}

function buildIhtarDraft(profile: RentProfileState) {
  const ceiling = legalCeiling(profile);
  return `SAYIN ${profile.landlordName.toUpperCase()},\n\nTürk Borçlar Kanunu (TBK Madde 344) uyarınca konut kiralarında yenileme döneminde uygulanabilecek azami zam oranı son 12 aylık TÜFE ortalaması olan %${profile.tufeRate}'dir.\n\nMevcut Aylık Kira: ${formatLira(profile.amount)}\nYasal Artış Oranı: %${profile.tufeRate}\nYasal Yeni Kira Tavanı: ${formatLira(ceiling)}\n\nYasal sınırın üzerindeki zam taleplerinin hukuki geçerliliği bulunmamaktadır. Yeni dönem ödemelerim yasal tavan olan ${formatLira(ceiling)} üzerinden banka hesabınıza yatırılacaktır.\n\nBilgilerinize sunarım.`;
}

function GeminiHomeTab({
  language,
  onPaidChange,
  onProfileChange,
  onTabChange,
  profile,
}: {
  language: AppLanguage;
  onPaidChange: (value: boolean) => void;
  onProfileChange: (next: RentProfileState) => void;
  onTabChange: (tab: TabKey) => void;
  profile: RentProfileState;
}) {
  const [noticeCopied, setNoticeCopied] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(String(profile.amount || ""));
  const [paymentMonth, setPaymentMonth] = useState("");
  const [paymentPaid, setPaymentPaid] = useState(true);
  const daysLeft = daysUntilDue(profile.dueDay);

  function updateProfileField(field: keyof RentProfileState, value: string | number | PaymentHistoryItem[]) {
    onProfileChange({ ...profile, [field]: value });
  }

  function addPaymentHistoryItem() {
    const month = paymentMonth.trim();
    const amount = safeNumber(paymentAmount);
    if (!month || amount <= 0) return;

    onProfileChange({
      ...profile,
      paymentHistory: [
        {
          amount,
          month,
          status: paymentPaid ? "Ödendi" : "Bekliyor",
        },
        ...profile.paymentHistory,
      ],
    });
    setPaymentMonth("");
    setPaymentAmount(String(profile.amount || ""));
    setPaymentPaid(true);
  }

  async function copyIban() {
    await copyTextToClipboard(profile.iban);
    setNoticeCopied(true);
  }

  async function copyReceiptMessage() {
    const month = new Date().toLocaleDateString("tr-TR", { month: "long" });
    await copyTextToClipboard(
      `Merhaba ${profile.landlordName}, ${month} ayı kira tutarı olan ${formatLira(profile.amount)} tarafınıza gönderilmiştir. Dekont ekte bilgilerinize sunulur.`,
    );
    setNoticeCopied(true);
  }

  return (
    <View style={styles.stack}>
      <View style={styles.homeHero}>
        <View style={styles.homeHeroHeader}>
          <View>
            <Text style={styles.homeEyebrow}>{text(language, "Current rent", "Güncel kira tutarı")}</Text>
            <Text style={styles.homeHeroAmount}>{formatLira(profile.amount)}</Text>
          </View>
          <View style={[styles.homeStatusBadge, profile.isPaid && styles.homeStatusBadgePaid]}>
            <Text style={styles.homeStatusText}>
              {profile.isPaid ? text(language, "Paid", "Ödendi") : text(language, `${daysLeft} days`, `Son ${daysLeft} gün`)}
            </Text>
          </View>
        </View>

        <View style={styles.homeDetails}>
          <View style={styles.homeDetailRow}>
            <Text style={styles.homeDetailLabel}>{text(language, "Landlord", "Ev sahibi")}</Text>
            <Text style={styles.homeDetailValue}>{profile.landlordName || "Eklenmedi"}</Text>
          </View>
          <View style={styles.homeDetailRow}>
            <Text style={styles.homeDetailLabel}>IBAN</Text>
            <Pressable onPress={copyIban} style={styles.homeIbanButton}>
              <Text numberOfLines={1} style={styles.homeIbanText}>{profile.iban || "IBAN eklenmedi"}</Text>
              <Text style={styles.homeIbanCopy}>COPY</Text>
            </Pressable>
          </View>
          <TextInput
            autoCapitalize="characters"
            onChangeText={(value) => updateProfileField("iban", value)}
            placeholder="TR..."
            placeholderTextColor="rgba(207,250,254,0.62)"
            style={styles.homeIbanInput}
            value={profile.iban}
          />
        </View>

        <View style={styles.homeActionRow}>
          <Pressable
            onPress={() => onPaidChange(!profile.isPaid)}
            style={[styles.homePrimaryAction, profile.isPaid && styles.homeSecondaryAction]}
          >
            <Text style={styles.homePrimaryActionText}>
              {profile.isPaid ? text(language, "Remove paid mark", "Ödendi işaretini kaldır") : text(language, "Mark as paid", "Ödendi olarak işaretle")}
            </Text>
          </Pressable>
          <Pressable onPress={copyReceiptMessage} style={styles.homeGhostAction}>
            <Text style={styles.homeGhostActionText}>{text(language, "Message", "Mesaj")}</Text>
          </Pressable>
        </View>
      </View>

      {noticeCopied ? (
        <View style={styles.toastInline}>
          <Text style={styles.toastInlineText}>{text(language, "Copied to clipboard.", "Panoya kopyalandı.")}</Text>
        </View>
      ) : null}

      <View style={styles.homeSection}>
        <Text style={styles.homeSectionTitle}>{text(language, "Rent profile", "Kira bilgileri")}</Text>
        <Text style={styles.homeSectionText}>Ev sahibi adı ve IBAN burada değiştirildiğinde üstteki ödeme kartı da güncellenir.</Text>
        <LabeledInput
          label="Ev sahibi adı / unvanı"
          onChangeText={(value) => updateProfileField("landlordName", value)}
          placeholder="Örn: Ahmet Yılmaz"
          value={profile.landlordName}
        />
        <LabeledInput
          label="Ev sahibi IBAN"
          onChangeText={(value) => updateProfileField("iban", value)}
          placeholder="TR..."
          value={profile.iban}
        />
      </View>

      <View style={styles.quickGrid}>
        <Pressable onPress={() => onTabChange("calc")} style={styles.homeQuickAction}>
          <Text style={styles.quickIcon}>%</Text>
          <Text style={styles.quickTitle}>{text(language, "Legal rent increase", "Yasal kira zammı")}</Text>
          <Text style={styles.quickText}>TÜFE 12 aylık tavan: %{profile.tufeRate}</Text>
        </Pressable>
        <Pressable onPress={() => onTabChange("rights")} style={styles.homeQuickAction}>
          <Text style={styles.quickIcon}>K</Text>
          <Text style={styles.quickTitle}>{text(language, "Evidence vault", "Kanıt kasası")}</Text>
          <Text style={styles.quickText}>{text(language, "Contract and document AI analysis", "Kontrat ve belge AI analizi")}</Text>
        </Pressable>
      </View>

      <View style={styles.homeSection}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.homeSectionTitle}>{text(language, "Payment history", "Ödeme geçmişi takibi")}</Text>
          <Text style={styles.cardMeta}>{text(language, "Manual log", "Manuel kayıt")}</Text>
        </View>
        <Text style={styles.homeSectionText}>Ay, tutar ve ödeme durumunu ekleyin. Geçmiş yalnızca sizin eklediğiniz kayıtlarla oluşur.</Text>
        <LabeledInput
          label="Ay"
          onChangeText={setPaymentMonth}
          placeholder="Örn: Şubat 2026"
          value={paymentMonth}
        />
        <LabeledInput
          keyboardType="numeric"
          label="Tutar (TL)"
          onChangeText={setPaymentAmount}
          placeholder="22500"
          value={paymentAmount}
        />
        <View style={styles.paymentToggleRow}>
          <Pressable
            onPress={() => setPaymentPaid(true)}
            style={[styles.paymentToggleButton, paymentPaid && styles.paymentToggleButtonActive]}
          >
            <Text style={styles.paymentToggleText}>Ödendi</Text>
          </Pressable>
          <Pressable
            onPress={() => setPaymentPaid(false)}
            style={[styles.paymentToggleButton, !paymentPaid && styles.paymentToggleButtonActive]}
          >
            <Text style={styles.paymentToggleText}>Bekliyor</Text>
          </Pressable>
        </View>
        <Pressable onPress={addPaymentHistoryItem} style={styles.resultButton}>
          <Text style={styles.resultButtonText}>Ödemeyi kaydet</Text>
        </Pressable>
      </View>

      {profile.paymentHistory.length ? (
        <View style={styles.homeSection}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.homeSectionTitle}>Kaydedilen ödemeler ({profile.paymentHistory.length})</Text>
            <Pressable
              onPress={() => updateProfileField("paymentHistory", [])}
              style={styles.clearSmallButton}
            >
              <Text style={styles.clearSmallButtonText}>Temizle</Text>
            </Pressable>
          </View>
          {profile.paymentHistory.map((item) => (
            <View key={`${item.month}-${item.amount}-${item.status}`} style={styles.paymentHistoryRow}>
              <Text style={styles.paymentMonth}>{item.month}</Text>
              <View style={styles.paymentHistoryRight}>
                <Text style={styles.paymentAmount}>{formatLira(item.amount)}</Text>
                <View style={[styles.paymentStatus, item.status === "Ödendi" ? styles.paymentStatusPaid : styles.paymentStatusPending]}>
                  <Text style={styles.paymentStatusText}>{item.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.homeSection}>
        <Text style={styles.homeSectionTitle}>{text(language, "Tenant rights guide", "Kiracı hakları rehberi")}</Text>
        <LegalBullet number="1" title="Zam sınırı (TBK 344)" body="Ev sahibi 12 aylık TÜFE ortalamasının üstünde zam yapamaz." />
        <LegalBullet number="2" title="Depozito üst sınırı (TBK 342)" body="Depozito en fazla 3 aylık kira olabilir ve güvenli hesapta tutulmalıdır." />
        <LegalBullet number="3" title="Büyük onarım (TBK 301)" body="Kombi, tesisat, çatı gibi esaslı tamir masrafları ev sahibine aittir." />
      </View>

      <Pressable onPress={() => onTabChange("chat")} style={styles.aiBanner}>
        <View>
          <Text style={styles.aiBannerTitle}>{text(language, "Have a legal question?", "Yasal sorunuz mu var?")}</Text>
          <Text style={styles.aiBannerText}>{text(language, "AI tenant assistant is ready.", "Yapay zeka kiracı asistanı hazır.")}</Text>
        </View>
        <Text style={styles.aiBannerArrow}>›</Text>
      </Pressable>
    </View>
  );
}

function LegalBullet({ body, number, title }: { body: string; number: string; title: string }) {
  return (
    <View style={styles.legalBullet}>
      <View style={styles.legalBulletNumber}>
        <Text style={styles.legalBulletNumberText}>{number}</Text>
      </View>
      <View style={styles.legalBulletCopy}>
        <Text style={styles.legalBulletTitle}>{title}</Text>
        <Text style={styles.legalBulletBody}>{body}</Text>
      </View>
    </View>
  );
}

function LegalCalculatorTab({
  language,
  onMarketSummaryChange,
  onProfileChange,
  profile,
}: {
  language: AppLanguage;
  onMarketSummaryChange?: (summary: MarketSummary) => void;
  onProfileChange: (next: RentProfileState) => void;
  profile: RentProfileState;
}) {
  const [currentRent, setCurrentRent] = useState(String(profile.amount));
  const [tufe, setTufe] = useState(String(profile.tufeRate));
  const [discount, setDiscount] = useState("0");
  const [copied, setCopied] = useState(false);
  const current = safeNumber(currentRent);
  const tufeRate = safeNumber(tufe);
  const discountAmount = safeNumber(discount);
  const increase = (current * tufeRate) / 100;
  const ceiling = current + increase;
  const proposed = Math.max(0, ceiling - discountAmount);

  async function copyDraft() {
    await copyTextToClipboard(buildIhtarDraft({ ...profile, amount: current, tufeRate }));
    setCopied(true);
  }

  function saveProfileRate() {
    onProfileChange({ ...profile, amount: current, tufeRate });
  }

  return (
    <View style={styles.stack}>
      <View style={styles.geminiCard}>
        <Text style={styles.geminiSectionTitle}>{text(language, "Legal rent increase ceiling calculator", "Yasal kira artış tavanı hesaplayıcı")}</Text>
        <Text style={styles.geminiMuted}>TBK 344 uyarınca konut kiralarında artış oranı son 12 aylık TÜFE ortalamasını geçemez.</Text>
        <LabeledInput label="Mevcut kira bedeli (TL)" value={currentRent} onChangeText={setCurrentRent} keyboardType="numeric" />
        <LabeledInput label="12 aylık TÜFE ortalaması (%)" value={tufe} onChangeText={setTufe} keyboardType="numeric" />
        <LabeledInput label="Anlaşmalı indirim / ikramiye (TL)" value={discount} onChangeText={setDiscount} keyboardType="numeric" />
        <Pressable onPress={saveProfileRate} style={styles.saveSmallButton}>
          <Text style={styles.saveSmallButtonText}>{text(language, "Save amount and TÜFE", "Tutarı ve TÜFE'yi kaydet")}</Text>
        </Pressable>
      </View>

      <View style={styles.resultCard}>
        <ResultLine label="Azami yasal zam oranı" value={`%${tufeRate}`} />
        <ResultLine label="Yasal zam tutarı" value={`+${formatLira(increase)}`} />
        <Text style={styles.resultKicker}>Yasal tavan yeni kira</Text>
        <Text style={styles.resultAmount}>{formatLira(proposed)}</Text>
        <Text style={styles.resultNote}>Ev sahibi bu tutarın üstünde zam dayatırsa yasal ödeme hakkınızı kullanabilirsiniz.</Text>
        <Pressable onPress={copyDraft} style={styles.resultButton}>
          <Text style={styles.resultButtonText}>Ev sahibine gönderilecek yasal mesajı kopyala</Text>
        </Pressable>
      </View>

      <MarketProofSection language={language} onMarketSummaryChange={onMarketSummaryChange} />

      {copied ? <Text style={styles.geminiMuted}>İhtarname metni panoya kopyalandı.</Text> : null}
    </View>
  );
}

function ResultLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultLine}>
      <Text style={styles.resultLineLabel}>{label}</Text>
      <Text style={styles.resultLineValue}>{value}</Text>
    </View>
  );
}

function LabeledInput({
  keyboardType,
  label,
  onChangeText,
  placeholder,
  value,
}: {
  keyboardType?: "default" | "numeric";
  label: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <View style={styles.labeledInputWrap}>
      <Text style={styles.geminiInputLabel}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={styles.geminiInput}
        value={value}
      />
    </View>
  );
}

function RightsGuideTab({ language, profile }: { language: AppLanguage; profile: RentProfileState }) {
  const [sameDay, setSameDay] = useState<null | boolean>(null);
  const [blankDate, setBlankDate] = useState<null | boolean>(null);
  const [copied, setCopied] = useState(false);
  const resultReady = sameDay !== null && blankDate !== null;
  const resultTitle = sameDay
    ? "Büyük ihtimalle geçersiz"
    : blankDate
      ? "Dikkat: yüksek risk var"
      : "Şeklen geçerli görünüyor";
  const resultBody = sameDay
    ? "Kira sözleşmesiyle aynı gün alınan tahliye taahhütleri baskı altında imzalandığı gerekçesiyle güçlü şekilde tartışılabilir."
    : blankDate
      ? "Boş tarihli taahhütname Yargıtay uygulamasında risklidir. İcra veya dava ihtimaline karşı uzman görüşü alın."
      : "Sözleşmeden sonra ve tarihi dolu imzalandıysa ev sahibi belirtilen tarihten itibaren 1 ay içinde takip başlatabilir.";

  async function copyNotice() {
    await copyTextToClipboard(buildIhtarDraft(profile));
    setCopied(true);
  }

  return (
    <View style={styles.stack}>
      <View style={styles.geminiCard}>
        <Text style={styles.geminiSectionTitle}>{text(language, "Eviction promise risk analysis", "Tahliye taahhütnamesi risk analizi")}</Text>
        <Text style={styles.geminiMuted}>İmzaladığınız taahhütname hukuken geçerli mi? Yargıtay içtihatlarına göre hızlı kontrol edin.</Text>
        <WizardQuestion
          label="1. Taahhütnameyi kira sözleşmesiyle aynı gün mü imzaladınız?"
          onNo={() => setSameDay(false)}
          onYes={() => setSameDay(true)}
          value={sameDay}
        />
        <WizardQuestion
          label="2. İmzaladığınızda tahliye tarihi boş muydu?"
          onNo={() => setBlankDate(false)}
          onYes={() => setBlankDate(true)}
          value={blankDate}
        />
        {resultReady ? (
          <View style={styles.wizardResult}>
            <Text style={styles.wizardResultTitle}>{resultTitle}</Text>
            <Text style={styles.wizardResultBody}>{resultBody}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.geminiCard}>
        <Text style={styles.geminiSectionTitle}>Kritik kiracı hakları kütüphanesi</Text>
        <LegalBullet number="1" title="Ev sahibi ihtiyaç sebebiyle çıkarabilir mi?" body="İhtiyaç samimi, zorunlu ve gerçek olmalıdır. Tahliyeden sonra 3 yıl başkasına kiralama yasağı doğabilir." />
        <LegalBullet number="2" title="Ev satılırsa yeni malik hemen çıkarabilir mi?" body="Yeni malik 1 ay içinde ihtar çekmeli ve en az 6 ay süre tanımalıdır." />
        <LegalBullet number="3" title="Depozito ne zaman iade edilir?" body="Olağan kullanım yıpranması dışında hasar yoksa depozito faiziyle iade edilmelidir." />
      </View>

      <Pressable onPress={copyNotice} style={styles.noticeButton}>
        <Text style={styles.noticeButtonText}>Haksız zamma karşı resmi ihtar taslağı oluştur</Text>
      </Pressable>
      {copied ? <Text style={styles.geminiMuted}>İhtarname panoya kopyalandı.</Text> : null}
    </View>
  );
}

function WizardQuestion({
  label,
  onNo,
  onYes,
  value,
}: {
  label: string;
  onNo: () => void;
  onYes: () => void;
  value: null | boolean;
}) {
  return (
    <View style={styles.wizardQuestion}>
      <Text style={styles.wizardQuestionText}>{label}</Text>
      <View style={styles.wizardButtonRow}>
        <Pressable onPress={onYes} style={[styles.wizardButton, value === true && styles.wizardButtonActive]}>
          <Text style={styles.wizardButtonText}>Evet</Text>
        </Pressable>
        <Pressable onPress={onNo} style={[styles.wizardButton, value === false && styles.wizardButtonActive]}>
          <Text style={styles.wizardButtonText}>Hayır</Text>
        </Pressable>
      </View>
    </View>
  );
}

function InspectionTrackerTab({ language }: { language: AppLanguage }) {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [room, setRoom] = useState("Salon");
  const [desc, setDesc] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<InspectionAttachment[]>([]);
  const [reportStatus, setReportStatus] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("c101.inspectionItems").then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as InspectionItem[];
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        } catch {}
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) {
      void AsyncStorage.setItem("c101.inspectionItems", JSON.stringify(items));
    }
  }, [hydrated, items]);

  function addItem() {
    if (!desc.trim() && !pendingAttachments.length) return;
    setItems((current) => [
      ...current,
      {
        attachments: pendingAttachments,
        id: String(Date.now()),
        room,
        desc: desc.trim() || "Dosya ekiyle tespit kaydı",
        status: pendingAttachments.length ? "documented" : "review",
      },
    ]);
    setDesc("");
    setPendingAttachments([]);
    setReportStatus("");
  }

  async function attachInspectionFile() {
    try {
      const DocumentPicker = await import("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true,
        type: "*/*",
      });

      if (result.canceled || !result.assets?.length) return;
      setPendingAttachments((current) => [
        ...current,
        ...result.assets.map((asset) => ({
          id: `attachment-${Date.now()}-${asset.name}`,
          mimeType: asset.mimeType || null,
          name: asset.name || `tespit-dosyasi-${Date.now()}`,
          size: asset.size || null,
          uri: asset.uri,
        })),
      ]);
    } catch (err) {
      setReportStatus(err instanceof Error ? err.message : "Dosya eklenemedi.");
    }
  }

  async function attachInspectionMedia(source: "camera" | "library") {
    try {
      const ImagePicker = await import("expo-image-picker");
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          throw new Error("Kamera izni gerekli.");
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          throw new Error("Fotoğraf/video erişim izni gerekli.");
        }
      }

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              allowsEditing: false,
              mediaTypes: ["images", "videos"],
              quality: 0.85,
            })
          : await ImagePicker.launchImageLibraryAsync({
              allowsEditing: false,
              mediaTypes: ["images", "videos"],
              quality: 0.85,
            });

      if (result.canceled || !result.assets?.length) return;
      setPendingAttachments((current) => [
        ...current,
        ...result.assets.map((asset) => ({
          id: `attachment-${Date.now()}-${asset.uri}`,
          mimeType: asset.mimeType || null,
          name: asset.fileName || `tespit-medya-${Date.now()}`,
          size: asset.fileSize || null,
          uri: asset.uri,
        })),
      ]);
    } catch (err) {
      setReportStatus(err instanceof Error ? err.message : "Medya eklenemedi.");
    }
  }

  async function exportReport() {
    if (!items.length) return;

    const report = buildInspectionReport(items);
    const downloaded = downloadTextFile(
      `kira-tespit-raporu-${new Date().toISOString().slice(0, 10)}.txt`,
      report,
    );
    const copied = await copyTextToClipboard(report);

    if (downloaded) {
      setReportStatus("Rapor indirildi.");
      return;
    }
    if (copied) {
      setReportStatus("Rapor panoya kopyalandı.");
      return;
    }
    setReportStatus("Rapor hazırlandı, ancak bu cihazda otomatik indirme desteklenmedi.");
  }

  return (
    <View style={styles.stack}>
      <View style={styles.geminiCard}>
        <Text style={styles.geminiSectionTitle}>{text(language, "Move-in/move-out home condition log", "Giriş/çıkış ev durum tespiti")}</Text>
        <Text style={styles.geminiMuted}>Eve taşınırken var olan hasarları kaydedin. Çıkışta depozitonuzun haksız kesilmesini önleyin.</Text>
        <LabeledInput label="Oda" value={room} onChangeText={setRoom} />
        <LabeledInput label="Kusur açıklaması" value={desc} onChangeText={setDesc} />
        <View style={styles.uploadButtonGrid}>
          <Pressable onPress={() => attachInspectionMedia("camera")} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Kamera</Text>
          </Pressable>
          <Pressable onPress={() => attachInspectionMedia("library")} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Foto/video</Text>
          </Pressable>
        </View>
        <Pressable onPress={attachInspectionFile} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Dosya, belge, ses veya ek yükle</Text>
        </Pressable>
        {pendingAttachments.length ? (
          <View style={styles.attachmentList}>
            {pendingAttachments.map((attachment) => (
              <View key={attachment.id} style={styles.attachmentPill}>
                <Text numberOfLines={1} style={styles.attachmentText}>{attachment.name}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <Pressable onPress={addItem} style={styles.resultButton}>
          <Text style={styles.resultButtonText}>Tespiti kaydet</Text>
        </Pressable>
      </View>

      {items.length ? (
        <>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.geminiSectionTitle}>Kaydedilen kusurlar ({items.length})</Text>
            <Pressable onPress={exportReport} style={styles.reportButton}>
              <Text style={styles.reportButtonText}>Raporu indir</Text>
            </Pressable>
          </View>
          {reportStatus ? <Text style={styles.geminiMuted}>{reportStatus}</Text> : null}
          {items.map((item) => (
            <View key={item.id} style={styles.inspectionRow}>
              <View style={styles.inspectionCopy}>
                <Text style={styles.inspectionRoom}>{item.room}</Text>
                <Text style={styles.inspectionDesc}>{item.desc}</Text>
                {item.attachments?.length ? (
                  <Text style={styles.inspectionAttachmentText}>
                    {item.attachments.length} ek dosya: {item.attachments.map((attachment) => attachment.name).join(", ")}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.paymentStatus, item.status === "documented" ? styles.paymentStatusPaid : styles.paymentStatusPending]}>
                <Text style={styles.paymentStatusText}>{item.status === "documented" ? "Fotoğraflı" : "Mevcut"}</Text>
              </View>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

function buildInspectionReport(items: InspectionItem[]) {
  const lines = [
    "Kira Asistanı - Ev Durum Tespit Raporu",
    `Hazırlanma tarihi: ${new Date().toLocaleDateString("tr-TR")}`,
    "",
    ...items.map((item, index) => {
      const status = item.status === "documented" ? "Fotoğraflı" : "Mevcut";
      const attachments = item.attachments?.length
        ? `\n   Ekler: ${item.attachments.map((attachment) => attachment.name).join(", ")}`
        : "";
      return `${index + 1}. ${item.room}\n   Durum: ${status}\n   Açıklama: ${item.desc}${attachments}`;
    }),
  ];
  return lines.join("\n");
}

function downloadTextFile(fileName: string, contents: string) {
  if (Platform.OS !== "web") return false;

  const webDocument = (globalThis as any).document;
  const webUrl = (globalThis as any).URL;
  const webBlob = (globalThis as any).Blob;
  if (!webDocument || !webUrl || !webBlob) return false;

  const blob = new webBlob([contents], { type: "text/plain;charset=utf-8" });
  const url = webUrl.createObjectURL(blob);
  const link = webDocument.createElement("a");
  link.href = url;
  link.download = fileName;
  webDocument.body.appendChild(link);
  link.click();
  link.remove();
  webUrl.revokeObjectURL(url);
  return true;
}

const evidenceUploadTypes: EvidenceType[] = [
  "photo",
  "message",
  "bank",
  "listing",
  "contract",
];

function KiraPanel({
  auth,
  evidenceSummary,
  language,
  marketSummary,
  rentCase,
}: {
  auth: AuthController;
  evidenceSummary: EvidenceSummary;
  language: AppLanguage;
  marketSummary: MarketSummary;
  rentCase: RentCaseState;
}) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const suggestedPrompts = [
    text(language, "Can my landlord raise my rent this much?", "Ev sahibim kirayi bu kadar artirabilir mi?"),
    text(language, "What evidence should I upload first?", "Önce hangi kaniti yüklemeliyim?"),
    text(language, "Draft a calm message to my landlord.", "Ev sahibime sakin bir mesaj taslagi yaz."),
  ];

  const canAsk = auth.status !== "loading" && !busy;

  async function askKira(prompt?: string) {
    const nextQuestion = (prompt || question).trim();
    if (!nextQuestion || !canAsk) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: nextQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setError("");
    setBusy(true);

    try {
      const answer =
        auth.status === "signed-in" && auth.session?.access_token
          ? await callAssistantFunction(
              nextQuestion,
              auth.session.access_token,
              language,
              rentCase,
              marketSummary,
              evidenceSummary,
            )
          : buildKeywordAssistantAnswer(
              nextQuestion,
              language,
              rentCase,
              marketSummary,
              evidenceSummary,
            );
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: answer.answer_text || answer.summary || answer.guidance || answer.title,
        answer,
      };
      setMessages((current) => [...current, assistantMessage]);
    } catch (err) {
      const fallback = buildKeywordAssistantAnswer(
        nextQuestion,
        language,
        rentCase,
        marketSummary,
        evidenceSummary,
      );
      const assistantMessage: ChatMessage = {
        id: `assistant-fallback-${Date.now()}`,
        role: "assistant",
        text: fallback.answer_text,
        answer: fallback,
      };
      setMessages((current) => [...current, assistantMessage]);
      const message = err instanceof Error ? err.message : text(language, "Kira could not respond.", "Kira cevap veremedi.");
      setError(text(language, `Live assistant failed, local guidance shown. ${message}`, `Canli asistan cevap veremedi, yerel rehber gösterildi. ${message}`));
    } finally {
      setBusy(false);
    }
  }

  if (auth.status === "loading") {
    return (
      <View style={styles.summaryCard}>
        <ActivityIndicator color="#0891B2" />
        <Text style={styles.centerNote}>{text(language, "Checking account before opening Kira...", "Kira açilmadan önce hesap kontrol ediliyor...")}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.stack}
    >
      <SummaryCard
        label={
          auth.user
            ? text(language, "Kira is connected", "Kira hazir")
            : text(language, "Instant guidance mode", "Hizli rehber modu")
        }
        value={
          auth.user
            ? text(language, "Ask about rent increases, deposits, evidence, contract risk, or landlord messages.", "Kira artisi, depozito, kanit, sözlesme riski veya ev sahibi mesajlari hakkinda sor.")
            : text(language, "Sign in for saved Gemini answers. Until then, Kira gives fast local guidance for rent, repair, and eviction keywords.", "Kaydedilen Gemini yanitlari için giris yap. O zamana kadar Kira kira, tamir ve tahliye konularinda hizli yerel rehber verir.")
        }
      />
      <Text style={styles.helperText}>
        {text(language, "Kira is not a lawyer. Use answers as practical guidance and confirm high-risk issues with a qualified professional.", "Kira avukat degildir. Yanitlari pratik rehber olarak kullan; yüksek riskli konulari uzmanla dogrula.")}
      </Text>

      <View style={styles.promptRow}>
        {suggestedPrompts.map((prompt) => (
          <Pressable
            disabled={!canAsk}
            key={prompt}
            onPress={() => askKira(prompt)}
            style={[styles.promptChip, !canAsk && styles.disabledButton]}
          >
            <Text style={styles.promptChipText}>{prompt}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.chatList}>
        {messages.length === 0 ? (
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatTitle}>{text(language, "No messages yet", "Henüz mesaj yok")}</Text>
            <Text style={styles.emptyChatText}>
              {text(language, "Start with a short question. Kira will use your saved evidence and rent listings when they exist.", "Kisa bir soruyla basla. Kira kayitli kanitlarini ve emsal kira ilanlarini kullanir.")}
            </Text>
          </View>
        ) : (
          messages.map((message) => <ChatBubble key={message.id} language={language} message={message} />)
        )}
        {busy ? (
          <View style={[styles.chatBubble, styles.assistantBubble]}>
            <ActivityIndicator color="#0891B2" />
            <Text style={styles.assistantBubbleText}>{text(language, "Kira is preparing an answer...", "Kira yanit hazirliyor...")}</Text>
          </View>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>{text(language, "Kira could not respond", "Kira cevap veremedi")}</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.composerCard}>
        <TextInput
          multiline
          onChangeText={setQuestion}
          placeholder={text(language, "Ask Kira about your rent, deposit, evidence, or next step...", "Kira'ya kira, depozito, kanit veya sonraki adimi sor...")}
          style={styles.messageInput}
          value={question}
        />
        <Pressable
          disabled={!canAsk || !question.trim()}
          onPress={() => askKira()}
          style={[
            styles.primaryButton,
            (!canAsk || !question.trim()) && styles.disabledButton,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {busy ? text(language, "Sending...", "Gönderiliyor...") : text(language, "Ask Kira", "Kira'ya sor")}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function ChatBubble({ language, message }: { language: AppLanguage; message: ChatMessage }) {
  const isUser = message.role === "user";
  const answer = message.answer;

  if (isUser) {
    return (
      <View style={[styles.chatBubble, styles.userBubble]}>
        <Text style={styles.userBubbleText}>{message.text}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.chatBubble, styles.assistantBubble]}>
      <Text style={styles.answerTitle}>{answer?.title || text(language, "Kira answer", "Kira yaniti")}</Text>
      <AnswerSection label={text(language, "Summary", "Özet")} value={answer?.summary} />
      <AnswerSection label={text(language, "Guidance", "Yol haritasi")} value={answer?.guidance} />
      <AnswerSection label={text(language, "Draft", "Taslak")} value={answer?.draft} />
      <AnswerSection label={text(language, "Note", "Not")} value={answer?.note} muted />
      {!answer ? <Text style={styles.assistantBubbleText}>{message.text}</Text> : null}
    </View>
  );
}

function AnswerSection({
  label,
  muted,
  value,
}: {
  label: string;
  muted?: boolean;
  value?: string;
}) {
  if (!value?.trim()) return null;
  return (
    <View style={[styles.answerSection, muted && styles.answerSectionMuted]}>
      <Text style={styles.answerLabel}>{label}</Text>
      <Text style={styles.assistantBubbleText}>{value}</Text>
    </View>
  );
}

async function callAssistantFunction(
  question: string,
  accessToken: string,
  language: AppLanguage,
  rentCase: RentCaseState,
  marketSummary: MarketSummary,
  evidenceSummary: EvidenceSummary,
) {
  if (!accessToken) {
    throw new Error("Signed-in session token is missing. Sign out and sign in again.");
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/ask-assistant`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      question,
      language,
      case_context: buildMobileAssistantContext(
        language,
        rentCase,
        marketSummary,
        evidenceSummary,
      ),
    }),
  });

  const text = await response.text();
  let payload: any = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { error: text };
  }

  if (!response.ok) {
    const detailParts = [
      payload?.error || payload?.message || text || `HTTP ${response.status}`,
      payload?.error_code ? `Code: ${payload.error_code}` : "",
      payload?.recovery ? `Fix: ${payload.recovery}` : "",
      payload?.reset ? `Reset: ${payload.reset}` : "",
    ].filter(Boolean);
    throw new Error(`HTTP ${response.status}: ${detailParts.join("\n")}`);
  }

  if (!payload?.answer) {
    throw new Error("Assistant response did not include an answer.");
  }

  return normalizeAssistantAnswer(payload.answer);
}

function normalizeAssistantAnswer(raw: Partial<AssistantAnswer>): AssistantAnswer {
  const title = stringOrFallback(raw.title, "Kira answer");
  const summary = stringOrFallback(raw.summary, "");
  const guidance = stringOrFallback(raw.guidance, "");
  const draft = stringOrFallback(raw.draft, "");
  const note = stringOrFallback(raw.note, "");
  const answerText = stringOrFallback(
    raw.answer_text,
    [title, summary, guidance, draft, note].filter(Boolean).join("\n\n"),
  );

  return {
    answer_text: answerText,
    draft,
    guidance,
    note,
    summary,
    title,
  };
}

function stringOrFallback(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function buildMobileAssistantContext(
  language: AppLanguage,
  rentCase: RentCaseState,
  marketSummary: MarketSummary,
  evidenceSummary: EvidenceSummary,
) {
  const rent = {
    cpiRate: safeNumber(rentCase.cpiRate),
    currentRent: safeNumber(rentCase.currentRent),
    renewalDate: rentCase.renewalDate,
    requestedRent: safeNumber(rentCase.requestedRent),
  };
  const calculation = calculateRentIncrease({
    cpiRate: rent.cpiRate,
    currentRent: rent.currentRent,
    renewalDate: rent.renewalDate,
    requestedRent: rent.requestedRent,
  });

  return {
    app_surface: "mobile",
    app_version: "0.1.0",
    case_status: "mobile_foundation",
    language,
    rent: {
      current: rent.currentRent || null,
      requested: rent.requestedRent || null,
      cpi_rate: rent.cpiRate || null,
      calculated_ceiling: calculation.ceiling || null,
      requested_above_ceiling: calculation.aboveCeiling,
      renewal_date: rent.renewalDate || null,
      difference_from_ceiling: calculation.difference,
      increase_percent: calculation.increasePercent,
    },
    evidence: {
      total_count: evidenceSummary.totalCount,
      available_count: evidenceSummary.availableCount,
      review_count: evidenceSummary.reviewCount,
      latest_summary: evidenceSummary.latestSummary || null,
    },
    market: {
      listing_count: marketSummary.listingCount,
      median_rent: marketSummary.medianRent || null,
      listings: [],
    },
    contract: {
      available: evidenceSummary.contractStatus !== "missing",
      status: evidenceSummary.contractStatus,
    },
  };
}

function buildKeywordAssistantAnswer(
  question: string,
  language: AppLanguage,
  rentCase: RentCaseState,
  marketSummary: MarketSummary,
  evidenceSummary: EvidenceSummary,
): AssistantAnswer {
  const normalized = question.toLocaleLowerCase("tr-TR");
  const calculation = calculateRentIncrease({
    cpiRate: safeNumber(rentCase.cpiRate),
    currentRent: safeNumber(rentCase.currentRent),
    renewalDate: rentCase.renewalDate,
    requestedRent: safeNumber(rentCase.requestedRent),
  });

  if (/(zam|artis|artis|tüfe|tufe|increase|rent)/i.test(normalized)) {
    const summary = text(
      language,
      `Your estimated TBK 344 ceiling is ${formatLira(calculation.ceiling)}.`,
      `TBK 344'e göre tahmini tavan ${formatLira(calculation.ceiling)}.`,
    );
    const guidance = calculation.aboveCeiling
      ? text(
          language,
          `The requested rent is ${formatLira(calculation.difference)} above the estimate. Use the legal draft and add market proof.`,
          `Talep edilen kira tahmini sinirin ${formatLira(calculation.difference)} üstünde. Yasal taslagi ve emsal kaniti kullan.`,
        )
      : text(
          language,
          "The requested rent appears within the estimate, but still keep evidence and payment records.",
          "Talep edilen kira tahmini sinir içinde görünüyor; yine de kanit ve ödeme kayitlarini sakla.",
        );
    const draft = buildLegalRentDraft(language, rentCase);
    return normalizeAssistantAnswer({
      title: text(language, "Rent increase check", "Kira artis kontrolü"),
      summary,
      guidance,
      draft,
      note: text(language, "This is local guidance, not legal advice.", "Bu yerel rehberdir, hukuki danismanlik degildir."),
    });
  }

  if (/(kombi|tamir|masraf|repair|maintenance|boiler)/i.test(normalized)) {
    return normalizeAssistantAnswer({
      title: text(language, "Repair and maintenance", "Tamir ve bakim"),
      summary: text(language, "TBK 301 generally places the duty to keep the home usable on the landlord.", "TBK 301'e göre konutu kullanima elverisli tutma borcu genel olarak ev sahibindedir."),
      guidance: text(language, "Document the defect, notify the landlord in writing, keep invoices, and avoid aggressive wording.", "Arizayi belgele, ev sahibine yazili bildir, faturalari sakla ve sert dilden kaçin."),
      draft: text(language, "Dear landlord, I am notifying you of a repair issue affecting normal use of the home. Please arrange inspection and repair as soon as possible.", "Sayin ev sahibim, konutun olagan kullanimini etkileyen bir tamir ihtiyacini bildiriyorum. En kisa sürede inceleme ve onarim organize edilmesini rica ederim."),
      note: text(language, "Urgent safety issues should be handled immediately with qualified help.", "Acil güvenlik konulari uzman destekle hemen ele alinmalidir."),
    });
  }

  if (/(tahliye|oglum|oglum|evden çik|evden cik|eviction|need)/i.test(normalized)) {
    return normalizeAssistantAnswer({
      title: text(language, "Eviction risk", "Tahliye riski"),
      summary: text(language, "A landlord's need claim must be genuine and provable; re-rental restrictions can apply under TBK 355.", "Ev sahibinin ihtiyaç iddiasi gerçek ve ispatlanabilir olmalidir; TBK 355 kapsaminda yeniden kiralama yasagi gündeme gelebilir."),
      guidance: text(language, "Do not sign a blank or pressured undertaking. Save every message and ask for the legal basis in writing.", "Bos veya baskiyla hazirlanmis taahhüt imzalama. Her mesaji sakla ve hukuki dayanagi yazili iste."),
      draft: text(language, "Dear landlord, please send the legal basis and documents for your eviction request in writing so I can review my rights properly.", "Sayin ev sahibim, tahliye talebinizin hukuki dayanagini ve belgelerini yazili iletmenizi rica ederim; haklarimi dogru degerlendirmek istiyorum."),
      note: text(language, "Eviction disputes are high risk; confirm with a qualified lawyer.", "Tahliye uyusmazliklari yüksek risklidir; uzman avukatla dogrula."),
    });
  }

  return normalizeAssistantAnswer({
    title: text(language, "Case next step", "Dosya sonraki adimi"),
    summary: text(language, `You have ${evidenceSummary.totalCount} evidence items and ${marketSummary.listingCount} market listings loaded.`, `${evidenceSummary.totalCount} kanit ve ${marketSummary.listingCount} emsal ilan yüklü.`),
    guidance: text(language, "Start with rent numbers, upload the contract, then add payment and message evidence.", "Önce kira rakamlarini tamamla, sonra sözlesmeyi, ödeme ve mesaj kanitlarini ekle."),
    draft: "",
    note: text(language, "Ask specifically about rent increase, repair costs, eviction, deposit, or evidence for a sharper answer.", "Daha net yanit için kira artisi, tamir masrafi, tahliye, depozito veya kanit konusunu özellikle sor."),
  });
}

function EvidencePanel({
  auth,
  language,
  onEvidenceSummaryChange,
}: {
  auth: AuthController;
  language: AppLanguage;
  onEvidenceSummaryChange: (summary: EvidenceSummary) => void;
}) {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pollingAnalysis, setPollingAnalysis] = useState(false);
  const [pollingDeadline, setPollingDeadline] = useState(0);
  const [selectedUploadType, setSelectedUploadType] = useState<EvidenceType>("photo");
  const [uploadNote, setUploadNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const pendingAnalysisCount = items.filter((item) => isAnalysisPending(item)).length;

  useEffect(() => {
    if (auth.status === "signed-in") {
      refreshEvidence();
    } else {
      setItems([]);
      setPollingAnalysis(false);
      setPollingDeadline(0);
      onEvidenceSummaryChange(summarizeEvidence([]));
    }
  }, [auth.status, auth.user?.id]);

  useEffect(() => {
    if (auth.status !== "signed-in" || !pollingDeadline) return;

    const poll = async () => {
      if (Date.now() > pollingDeadline) {
        setPollingAnalysis(false);
        setPollingDeadline(0);
        return;
      }

      try {
        const nextItems = await loadEvidenceItems();
        applyEvidenceItems(nextItems);
        if (!nextItems.some((item) => isAnalysisPending(item))) {
          setPollingAnalysis(false);
          setPollingDeadline(0);
        }
      } catch (err) {
        setPollingAnalysis(false);
        setPollingDeadline(0);
        setError(err instanceof Error ? err.message : text(language, "Could not refresh analysis status.", "Analiz durumu yenilenemedi."));
      }
    };

    const interval = setInterval(poll, 5000);
    void poll();
    return () => clearInterval(interval);
  }, [auth.status, auth.user?.id, pollingDeadline]);

  function applyEvidenceItems(nextItems: EvidenceItem[]) {
    setItems(nextItems);
    onEvidenceSummaryChange(summarizeEvidence(nextItems));
  }

  function startAnalysisPolling() {
    setPollingAnalysis(true);
    setPollingDeadline(Date.now() + 60000);
  }

  async function refreshEvidence(silent = false) {
    if (!silent) setLoading(true);
    setError("");
    try {
      const nextItems = await loadEvidenceItems();
      applyEvidenceItems(nextItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : text(language, "Could not load evidence.", "Kanitlar yüklenemedi."));
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function pickMedia(source: "camera" | "library") {
    setUploading(true);
    setError("");
    setUploadMessage("");
    try {
      const ImagePicker = await import("expo-image-picker");

      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          throw new Error(text(language, "Camera permission is required to take evidence photos.", "Kanit fotografi çekmek için kamera izni gerekli."));
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          throw new Error(text(language, "Photo library permission is required to choose evidence photos.", "Kanit fotografi seçmek için fotograf izni gerekli."));
        }
      }

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              allowsEditing: false,
              mediaTypes: ["images", "videos"],
              quality: 0.85,
            })
          : await ImagePicker.launchImageLibraryAsync({
              allowsEditing: false,
              mediaTypes: ["images", "videos"],
              quality: 0.85,
            });

      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const isVideo = asset.mimeType?.startsWith("video/");
      const uploadedItem = await uploadEvidence({
        fileName: asset.fileName || `evidence-media-${Date.now()}${isVideo ? ".mp4" : ".jpg"}`,
        mimeType: asset.mimeType || (isVideo ? "video/mp4" : "image/jpeg"),
        note: uploadNote,
        size: asset.fileSize || null,
        type: selectedUploadType,
        uri: asset.uri,
      });
      setUploadMessage(text(language, `${uploadedItem.fileName} uploaded. Analysis has started.`, `${uploadedItem.fileName} yüklendi. Analiz basladi.`));
      setUploadNote("");
      startAnalysisPolling();
      await refreshEvidence(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : text(language, "Could not upload media.", "Medya yüklenemedi."));
    } finally {
      setUploading(false);
    }
  }

  async function pickDocument(type: EvidenceType) {
    setUploading(true);
    setError("");
    setUploadMessage("");
    try {
      const DocumentPicker = await import("expo-document-picker");

      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: "*/*",
      });

      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const uploadedItem = await uploadEvidence({
        fileName: asset.name || `evidence-document-${Date.now()}`,
        mimeType: asset.mimeType || "application/octet-stream",
        note: uploadNote,
        size: asset.size || null,
        type,
        uri: asset.uri,
      });
      setUploadMessage(text(language, `${uploadedItem.fileName} uploaded. Analysis has started.`, `${uploadedItem.fileName} yüklendi. Analiz basladi.`));
      setUploadNote("");
      startAnalysisPolling();
      await refreshEvidence(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : text(language, "Could not upload document.", "Belge yüklenemedi."));
    } finally {
      setUploading(false);
    }
  }

  if (auth.status === "loading") {
    return (
      <View style={styles.summaryCard}>
        <ActivityIndicator color="#0891B2" />
        <Text style={styles.centerNote}>{text(language, "Checking account before loading evidence...", "Kanitlar yüklenmeden önce hesap kontrol ediliyor...")}</Text>
      </View>
    );
  }

  if (!auth.user) {
    return (
      <View style={styles.stack}>
        <SummaryCard
          label={text(language, "Sign in required", "Giris gerekli")}
          value={text(language, "Evidence is stored in your private Supabase account. Sign in before uploading or reviewing files.", "Kanitlar özel Supabase hesabinda saklanir. Yüklemek veya incelemek için giris yap.")}
        />
        <PlaceholderLine text={text(language, "Sign in to unlock evidence upload and timeline.", "Kanit yükleme ve zaman çizelgesi için giris yap.")} />
      </View>
    );
  }

  const summary = summarizeEvidence(items);
  const latestContract = items.find((item) => item.type === "contract") || null;

  return (
    <View style={styles.stack}>
      <SummaryCard
        label={text(language, "Evidence vault", "Kanıt kasası")}
        value={text(language, `${summary.totalCount} files, ${summary.availableCount} available, contract ${displayEvidenceStatus(summary.contractStatus, language).toLowerCase()}`, `${summary.totalCount} dosya, ${summary.availableCount} hazır, kontrat ${displayEvidenceStatus(summary.contractStatus, language).toLowerCase()}`)}
      />
      <View style={styles.uploadPanel}>
        <Text style={styles.uploadTitle}>{text(language, "Add evidence", "Kanıt ekle")}</Text>
        <Text style={styles.uploadSubtitle}>
          {text(language, "Upload rental contracts, messages, receipts, photos, videos, audio, PDFs, or any file. Contract and document analysis starts through Supabase.", "Kira kontratı, mesaj, dekont, fotoğraf, video, ses, PDF veya herhangi bir dosya yükleyin. Kontrat ve belge analizi Supabase üzerinden başlar.")}
        </Text>
        <View style={styles.uploadTypeGrid}>
          {evidenceUploadTypes.map((type) => {
            const selected = selectedUploadType === type;
            return (
              <Pressable
                disabled={uploading}
                key={type}
                onPress={() => setSelectedUploadType(type)}
                style={[
                  styles.uploadTypeChip,
                  selected && styles.uploadTypeChipActive,
                  uploading && styles.disabledButton,
                ]}
              >
                <Text
                  style={[
                    styles.uploadTypeChipText,
                    selected && styles.uploadTypeChipTextActive,
                  ]}
                >
                  {displayEvidenceType(type, language)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          multiline
          onChangeText={setUploadNote}
          placeholder={text(language, "Optional note: what does this prove?", "Istege bagli not: Bu neyi kanitliyor?")}
          style={styles.evidenceNoteInput}
          value={uploadNote}
        />
        <View style={styles.uploadButtonGrid}>
          <Pressable
            disabled={uploading}
            onPress={() => pickMedia("camera")}
            style={[styles.secondaryButton, uploading && styles.disabledButton]}
          >
            <Text style={styles.secondaryButtonText}>{text(language, "Camera", "Kamera")}</Text>
          </Pressable>
          <Pressable
            disabled={uploading}
            onPress={() => pickMedia("library")}
            style={[styles.secondaryButton, uploading && styles.disabledButton]}
          >
            <Text style={styles.secondaryButtonText}>{text(language, "Photo/video", "Foto/video")}</Text>
          </Pressable>
        </View>
        <View style={styles.uploadButtonGrid}>
          <Pressable
            disabled={uploading}
            onPress={() => pickDocument("contract")}
            style={[styles.primaryButton, uploading && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>{text(language, "Upload contract", "Kira kontratı yükle")}</Text>
          </Pressable>
          <Pressable
            disabled={uploading}
            onPress={() => pickDocument(selectedUploadType)}
            style={[styles.secondaryButton, uploading && styles.disabledButton]}
          >
            <Text style={styles.secondaryButtonText}>{text(language, "Any file", "Her tür dosya")}</Text>
          </Pressable>
        </View>
        {uploading ? (
          <View style={styles.inlineLoading}>
            <ActivityIndicator color="#0891B2" />
            <Text style={styles.inlineLoadingText}>{text(language, "Uploading evidence...", "Kanit yükleniyor...")}</Text>
          </View>
        ) : null}
        {pollingAnalysis ? (
          <View style={styles.inlineLoading}>
            <ActivityIndicator color="#0891B2" />
            <Text style={styles.inlineLoadingText}>
              {text(language, `Checking analysis status${pendingAnalysisCount ? ` for ${pendingAnalysisCount} item${pendingAnalysisCount === 1 ? "" : "s"}` : ""}...`, `Analiz durumu kontrol ediliyor${pendingAnalysisCount ? `: ${pendingAnalysisCount} öge` : ""}...`)}
            </Text>
          </View>
        ) : null}
        {uploadMessage ? <Text style={styles.successText}>{uploadMessage}</Text> : null}
      </View>
      <View style={styles.grid}>
        <Metric label={text(language, "Total", "Toplam")} value={`${summary.totalCount}`} />
        <Metric label={text(language, "Available", "Hazir")} value={`${summary.availableCount}`} />
        <Metric label={text(language, "Review", "Kontrol")} value={`${summary.reviewCount}`} />
        <Metric label={text(language, "Contract", "Sözlesme")} value={displayEvidenceStatus(summary.contractStatus, language)} />
      </View>

      <ContractInsightCard item={latestContract} language={language} />

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{text(language, "Recent evidence", "Son kanitlar")}</Text>
          <Text style={styles.sectionSubtitle}>{text(language, "Private files from Supabase", "Supabase'teki özel dosyalar")}</Text>
        </View>
        <Pressable
          disabled={loading}
          onPress={() => refreshEvidence()}
          style={[styles.iconTextButton, loading && styles.disabledButton]}
        >
          <Text style={styles.iconTextButtonText}>
            {loading ? text(language, "Loading", "Yükleniyor") : text(language, "Refresh", "Yenile")}
          </Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>{text(language, "Could not load evidence", "Kanitlar yüklenemedi")}</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading && !items.length ? (
        <View style={styles.summaryCard}>
          <ActivityIndicator color="#0891B2" />
          <Text style={styles.centerNote}>{text(language, "Loading evidence...", "Kanitlar yükleniyor...")}</Text>
        </View>
      ) : null}

      {!loading && !items.length && !error ? (
        <PlaceholderLine text={text(language, "No evidence uploaded yet.", "Henüz kanit yüklenmedi.")} />
      ) : null}

      {items.map((item) => (
        <EvidenceCard
          item={item}
          language={language}
          key={item.id}
          onChanged={() => {
            startAnalysisPolling();
            void refreshEvidence(true);
          }}
        />
      ))}
    </View>
  );
}

function EvidenceCard({
  item,
  language,
  onChanged,
}: {
  item: EvidenceItem;
  language: AppLanguage;
  onChanged: () => void;
}) {
  const [actionBusy, setActionBusy] = useState<"delete" | "preview" | "retry" | "save" | "">("");
  const [actionError, setActionError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editNote, setEditNote] = useState(evidenceSummaryText(item));
  const [editType, setEditType] = useState<EvidenceType>(item.type);
  const summary = evidenceSummaryText(item);

  async function openPreview() {
    setActionBusy("preview");
    setActionError("");
    try {
      const signedUrl = await createEvidenceSignedUrl(item);
      const canOpen = await Linking.canOpenURL(signedUrl);
      if (!canOpen) {
        throw new Error(text(language, "This device cannot open the evidence preview link.", "Bu cihaz kanit önizleme baglantisini açamiyor."));
      }
      await Linking.openURL(signedUrl);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : text(language, "Could not open evidence preview.", "Kanit önizlemesi açilamadi."));
    } finally {
      setActionBusy("");
    }
  }

  async function retryAnalysis() {
    setActionBusy("retry");
    setActionError("");
    try {
      await retryEvidenceAnalysis(item);
      onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : text(language, "Could not retry analysis.", "Analiz tekrar baslatilamadi."));
    } finally {
      setActionBusy("");
    }
  }

  async function deleteItem() {
    setActionBusy("delete");
    setActionError("");
    try {
      await deleteEvidenceItem(item);
      onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : text(language, "Could not delete evidence.", "Kanit silinemedi."));
    } finally {
      setActionBusy("");
    }
  }

  async function saveEdits() {
    setActionBusy("save");
    setActionError("");
    try {
      await updateEvidenceItem(item, {
        note: editNote,
        type: editType,
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : text(language, "Could not update evidence.", "Kanit güncellenemedi."));
    } finally {
      setActionBusy("");
    }
  }

  return (
    <View style={styles.evidenceCard}>
      <View style={styles.evidenceHeader}>
        <View style={styles.evidenceTitleWrap}>
          <Text style={styles.evidenceTitle}>{item.fileName}</Text>
          <Text style={styles.evidenceMeta}>{displayEvidenceType(item.type, language)}</Text>
        </View>
        <View style={styles.evidenceBadge}>
          <Text style={styles.evidenceBadgeText}>{displayEvidenceStatus(item.status, language)}</Text>
        </View>
      </View>
      {summary ? <Text style={styles.evidenceSummary}>{summary}</Text> : null}
      <Text style={styles.evidenceFooter}>
        {new Date(item.createdAt).toLocaleDateString()} | {item.fileType || "file"}
        {typeof item.confidence === "number"
          ? text(language, ` | ${Math.round(item.confidence * 100)}% confidence`, ` | %${Math.round(item.confidence * 100)} güven`)
          : ""}
      </Text>
      {editing ? (
        <View style={styles.editEvidencePanel}>
          <View style={styles.uploadTypeGrid}>
            {evidenceUploadTypes.map((type) => {
              const selected = editType === type;
              return (
                <Pressable
                  disabled={Boolean(actionBusy)}
                  key={type}
                  onPress={() => setEditType(type)}
                  style={[
                    styles.uploadTypeChip,
                    selected && styles.uploadTypeChipActive,
                    actionBusy && styles.disabledButton,
                  ]}
                >
                  <Text
                    style={[
                      styles.uploadTypeChipText,
                      selected && styles.uploadTypeChipTextActive,
                    ]}
                  >
                    {displayEvidenceType(type, language)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            multiline
            onChangeText={setEditNote}
            placeholder={text(language, "Evidence note", "Kanit notu")}
            style={styles.evidenceNoteInput}
            value={editNote}
          />
        </View>
      ) : null}
      {actionError ? (
        <View style={styles.inlineErrorCard}>
          <Text style={styles.inlineErrorText}>{actionError}</Text>
        </View>
      ) : null}
      <View style={styles.cardActionRow}>
        <Pressable
          disabled={Boolean(actionBusy)}
          onPress={openPreview}
          style={[styles.compactButton, actionBusy === "preview" && styles.disabledButton]}
        >
          <Text style={styles.compactButtonText}>
            {actionBusy === "preview" ? text(language, "Opening", "Açiliyor") : text(language, "Preview", "Önizle")}
          </Text>
        </Pressable>
        <Pressable
          disabled={Boolean(actionBusy)}
          onPress={retryAnalysis}
          style={[styles.compactButton, actionBusy === "retry" && styles.disabledButton]}
        >
          <Text style={styles.compactButtonText}>
            {actionBusy === "retry" ? text(language, "Retrying", "Deneniyor") : text(language, "Retry", "Tekrar dene")}
          </Text>
        </Pressable>
        <Pressable
          disabled={Boolean(actionBusy)}
          onPress={() => setEditing((current) => !current)}
          style={[styles.compactButton, actionBusy && styles.disabledButton]}
        >
          <Text style={styles.compactButtonText}>{editing ? text(language, "Cancel", "Vazgeç") : text(language, "Edit", "Düzenle")}</Text>
        </Pressable>
        {editing ? (
          <Pressable
            disabled={Boolean(actionBusy)}
            onPress={saveEdits}
            style={[styles.compactButton, actionBusy === "save" && styles.disabledButton]}
          >
            <Text style={styles.compactButtonText}>
              {actionBusy === "save" ? text(language, "Saving", "Kaydediliyor") : text(language, "Save", "Kaydet")}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          disabled={Boolean(actionBusy)}
          onPress={deleteItem}
          style={[styles.compactDangerButton, actionBusy === "delete" && styles.disabledButton]}
        >
          <Text style={styles.compactDangerButtonText}>
            {actionBusy === "delete" ? text(language, "Deleting", "Siliniyor") : text(language, "Delete", "Sil")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ContractInsightCard({ item, language }: { item: EvidenceItem | null; language: AppLanguage }) {
  if (!item) {
    return (
      <View style={styles.contractInsightCard}>
        <Text style={styles.sectionTitle}>{text(language, "Contract insight", "Sözlesme özeti")}</Text>
        <Text style={styles.contractInsightText}>
          {text(language, "Upload the lease as contract evidence to show extracted rent, deposit, payment date, risk flags, and missing fields here.", "Kira, depozito, ödeme günü, riskler ve eksik alanlari burada görmek için sözlesmeni yükle.")}
        </Text>
      </View>
    );
  }

  const fields = contractFieldRows(item, language);
  const risks = arrayFromExtracted(item.extractedJson, "risk_flags");
  const missing = arrayFromExtracted(item.extractedJson, "missing_fields");
  const summary = evidenceSummaryText(item);

  return (
    <View style={styles.contractInsightCard}>
      <View style={styles.evidenceHeader}>
        <View style={styles.evidenceTitleWrap}>
          <Text style={styles.sectionTitle}>{text(language, "Contract insight", "Sözlesme özeti")}</Text>
          <Text style={styles.sectionSubtitle}>{item.fileName}</Text>
        </View>
        <View style={styles.evidenceBadge}>
          <Text style={styles.evidenceBadgeText}>{displayEvidenceStatus(item.status, language)}</Text>
        </View>
      </View>

      {summary ? <Text style={styles.contractInsightText}>{summary}</Text> : null}

      {fields.length ? (
        <View style={styles.contractFieldGrid}>
          {fields.map((field) => (
            <View key={field.label} style={styles.contractField}>
              <Text style={styles.contractFieldLabel}>{field.label}</Text>
              <Text style={styles.contractFieldValue}>{field.value}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.contractInsightText}>
          {text(language, "No structured contract fields have been extracted yet.", "Henüz yapilandirilmis sözlesme alani çikarilmadi.")}
        </Text>
      )}

      <ContractList title={text(language, "Risk flags", "Risk isaretleri")} values={risks} empty={text(language, "No risk flags found yet.", "Henüz risk isareti bulunmadi.")} />
      <ContractList title={text(language, "Missing fields", "Eksik alanlar")} values={missing} empty={text(language, "No missing fields found yet.", "Henüz eksik alan bulunmadi.")} />
    </View>
  );
}

function InspectionLogPanel({ language }: { language: AppLanguage }) {
  const roomOptions = [
    text(language, "Kitchen", "Mutfak"),
    text(language, "Bathroom", "Banyo"),
    text(language, "Living room", "Salon"),
    text(language, "Bedroom", "Yatak odasi"),
    text(language, "Balcony", "Balkon"),
  ];
  const [room, setRoom] = useState(roomOptions[0]);
  const [desc, setDesc] = useState("");
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [toast, setToast] = useState("");

  function addItem() {
    if (!desc.trim()) return;
    setItems((current) => [
      {
        desc: desc.trim(),
        id: `inspection-${Date.now()}`,
        room,
        status: "documented",
      },
      ...current,
    ]);
    setDesc("");
    setToast(text(language, "Defect added to the move-in log.", "Hasar teslim tutanagina eklendi."));
  }

  function mockCamera() {
    setToast(text(language, "Camera placeholder ready. Use Evidence upload for real photos.", "Kamera alani hazir. Gerçek fotograf için Kanit yüklemeyi kullan."));
  }

  return (
    <View style={styles.toolCard}>
      <Text style={styles.sectionTitle}>{text(language, "Move-in damage log", "Teslim hasar kaydi")}</Text>
      <Text style={styles.sectionSubtitle}>
        {text(language, "Build a dated defect list before disputes start.", "Uyusmazlik baslamadan tarihli kusur listesi olustur.")}
      </Text>
      <View style={styles.uploadTypeGrid}>
        {roomOptions.map((option) => {
          const selected = option === room;
          return (
            <Pressable
              key={option}
              onPress={() => setRoom(option)}
              style={[styles.uploadTypeChip, selected && styles.uploadTypeChipActive]}
            >
              <Text style={[styles.uploadTypeChipText, selected && styles.uploadTypeChipTextActive]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        multiline
        onChangeText={setDesc}
        placeholder={text(language, "Describe defect, location, and visible condition.", "Kusuru, yerini ve görünür durumu yaz.")}
        style={styles.evidenceNoteInput}
        value={desc}
      />
      <View style={styles.uploadButtonGrid}>
        <Pressable onPress={addItem} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{text(language, "Add defect", "Hasar ekle")}</Text>
        </Pressable>
        <Pressable onPress={mockCamera} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{text(language, "Mock camera", "Kamera dene")}</Text>
        </Pressable>
      </View>
      {toast ? <Text style={styles.successText}>{toast}</Text> : null}
      {items.length ? (
        <View style={styles.infoList}>
          {items.map((item) => (
            <View key={item.id} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.room}</Text>
              <Text style={styles.infoText}>{item.desc}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.contractInsightMuted}>
          {text(language, "No defects recorded yet.", "Henüz hasar kaydi yok.")}
        </Text>
      )}
    </View>
  );
}

function ContractList({
  empty,
  title,
  values,
}: {
  empty: string;
  title: string;
  values: string[];
}) {
  return (
    <View style={styles.contractList}>
      <Text style={styles.contractListTitle}>{title}</Text>
      {values.length ? (
        values.slice(0, 5).map((value) => (
          <Text key={value} style={styles.contractListItem}>
            {value}
          </Text>
        ))
      ) : (
        <Text style={styles.contractInsightMuted}>{empty}</Text>
      )}
    </View>
  );
}

function contractFieldRows(item: EvidenceItem, language: AppLanguage) {
  const extracted = item.extractedJson || {};
  const fields = [
    [text(language, "Rent", "Kira"), stringFromExtracted(extracted, "rent_amount")],
    [text(language, "Deposit", "Depozito"), stringFromExtracted(extracted, "deposit_amount")],
    [text(language, "Payment date", "Ödeme günü"), stringFromExtracted(extracted, "payment_date")],
    [text(language, "Address", "Adres"), stringFromExtracted(extracted, "address")],
    [text(language, "Landlord", "Ev sahibi"), stringFromExtracted(extracted, "landlord_or_agent")],
    [text(language, "Document", "Belge"), stringFromExtracted(extracted, "document_type")],
  ];

  return fields
    .filter(([, value]) => value)
    .map(([label, value]) => ({
      label,
      value: value || "",
    }));
}

function stringFromExtracted(extracted: Record<string, unknown>, key: string) {
  const value = extracted[key];
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(", ");
  return "";
}

function arrayFromExtracted(extracted: Record<string, unknown>, key: string) {
  const value = extracted[key];
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function isAnalysisPending(item: EvidenceItem) {
  return item.status === "uploaded" || item.status === "processing";
}

function AccountPanel({
  auth,
  language,
  onLanguageChange,
}: {
  auth: AuthController;
  language: AppLanguage;
  onLanguageChange: (language: AppLanguage) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [billing, setBilling] = useState<BillingEntitlement>({
    plan: billingPlans.free,
    status: "free",
  });
  const [billingMessage, setBillingMessage] = useState("");
  const [billingLoading, setBillingLoading] = useState(false);
  const [upgradeRequest, setUpgradeRequest] = useState<BillingUpgradeRequest | null>(null);
  const [usageCounters, setUsageCounters] = useState<UsageCounter[]>([]);
  const [storeBilling, setStoreBilling] = useState<StoreBillingStatus>({
    active: false,
    available: false,
    platform: "unsupported",
  });

  const disabled = busy || auth.status === "loading";

  useEffect(() => {
    let cancelled = false;

    async function loadBilling() {
      if (!auth.user?.id) {
        setBilling({ plan: billingPlans.free, status: "free" });
        setUpgradeRequest(null);
        setUsageCounters([]);
        setStoreBilling({ active: false, available: false, platform: "unsupported" });
        return;
      }

      setBillingLoading(true);
      const [entitlement, usage, latestRequest, storeStatus] = await Promise.all([
        loadBillingEntitlement(auth.user.id),
        loadUsageCounters(auth.user.id),
        loadLatestUpgradeRequest(auth.user.id),
        loadStoreBillingStatus(auth.user.id),
      ]);
      if (!cancelled) {
        setBilling(entitlement);
        setUsageCounters(usage);
        setUpgradeRequest(latestRequest);
        setStoreBilling(storeStatus);
        setBillingLoading(false);
      }
    }

    void loadBilling();

    return () => {
      cancelled = true;
    };
  }, [auth.user?.id]);

  async function handleGoogleSignIn() {
    setBusy(true);
    try {
      await auth.signInWithGoogle();
    } finally {
      setBusy(false);
    }
  }

  async function handleUpgradePress() {
    if (!auth.user) return;
    setBillingLoading(true);
    setBillingMessage("");
    try {
      const purchase = await purchaseTenantPlus(auth.user.id);
      if (purchase.active) {
        setStoreBilling((current) => ({ ...current, active: true }));
        setBillingMessage(
          text(
            language,
            "Store purchase succeeded. Next backend sync will connect this purchase to Supabase limits.",
            "Mağaza satın alımı başarılı. Sonraki backend senkronizasyonu bu satın alımı Supabase limitlerine bağlayacak.",
          ),
        );
        return;
      }
      if (purchase.canceled) {
        setBillingMessage(text(language, "Purchase canceled.", "Satın alma iptal edildi."));
        return;
      }

      const request = await createBillingUpgradeRequest("tenant_plus");
      setUpgradeRequest(request);
      setBillingMessage(
        text(
          language,
          purchase.message || "Store billing is not ready in this build. Plus request saved for manual activation.",
          purchase.message || "Bu build içinde mağaza ödemesi hazır değil. Plus talebi manuel aktivasyon için kaydedildi.",
        ),
      );
    } catch (error) {
      setBillingMessage(error instanceof Error ? error.message : text(language, "Upgrade request failed.", "Yükseltme talebi başarısız oldu."));
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleRestorePress() {
    if (!auth.user) return;
    setBillingLoading(true);
    setBillingMessage("");
    try {
      const restore = await restoreTenantPlus(auth.user.id);
      setStoreBilling((current) => ({ ...current, active: restore.active }));
      setBillingMessage(
        restore.active
          ? text(language, "Store purchase restored. Backend entitlement sync is the next stage.", "Mağaza satın alımı geri yüklendi. Backend yetki senkronizasyonu sonraki aşama.")
          : text(language, restore.message || "No active store purchase was found.", restore.message || "Aktif mağaza satın alımı bulunamadı."),
      );
    } catch (error) {
      setBillingMessage(error instanceof Error ? error.message : text(language, "Restore failed.", "Geri yükleme başarısız oldu."));
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    try {
      await auth.signOut();
    } finally {
      setBusy(false);
    }
  }

  if (auth.status === "loading") {
    return (
      <View style={styles.summaryCard}>
        <ActivityIndicator color="#0891B2" />
        <Text style={styles.centerNote}>{text(language, "Checking saved session...", "Kayitli oturum kontrol ediliyor...")}</Text>
      </View>
    );
  }

  if (auth.user) {
    return (
      <View style={styles.stack}>
        <SummaryCard
          label={text(language, "Signed in", "Giris yapildi")}
          value={auth.user.email || text(language, "Supabase account connected", "Supabase hesabi bagli")}
        />
        <View style={styles.grid}>
          <Metric
            label={text(language, "Profile", "Profil")}
            value={auth.profileRole === "admin" ? "Admin" : auth.profileRole === "tenant" ? text(language, "Tenant", "Kiraci") : text(language, "Loading", "Yükleniyor")}
          />
          <Metric label={text(language, "Session", "Oturum")} value={text(language, "Saved", "Kayitli")} />
        </View>
        {auth.message ? <Text style={styles.authMessage}>{auth.message}</Text> : null}
        <Pressable
          disabled={disabled}
          onPress={handleSignOut}
          style={[styles.primaryButton, disabled && styles.disabledButton]}
        >
          <Text style={styles.primaryButtonText}>{text(language, "Sign out", "Çikis yap")}</Text>
        </Pressable>
        <LanguagePreference
          language={language}
          onLanguageChange={onLanguageChange}
        />
        <BillingPanel
          entitlement={billing}
          language={language}
          loading={billingLoading}
          message={billingMessage}
          onUpgradePress={handleUpgradePress}
          onRestorePress={handleRestorePress}
          storeBilling={storeBilling}
          upgradeRequest={upgradeRequest}
          usageCounters={usageCounters}
        />
        {auth.profileRole === "admin" ? <RentalImportAdminPanel language={language} /> : null}
        <AccountInfoPanel language={language} />
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <SummaryCard
        label={text(language, "Google sign-in", "Google ile giriş")}
        value={text(language, "Use Google to save evidence, protect usage limits, and keep case history without manual passwords.", "Kanıtları kaydetmek, kullanım limitlerini korumak ve dosya geçmişini manuel şifre olmadan tutmak için Google ile giriş yap.")}
      />
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{text(language, "Continue with Google", "Google ile devam et")}</Text>
        <Text style={styles.sectionSubtitle}>
          {text(
            language,
            "Manual email/password accounts are disabled for this app. Google sign-in gives one trusted identity per user and reduces throwaway account abuse.",
            "Bu uygulamada manuel e-posta/şifre hesabı kapatıldı. Google girişi kullanıcı başına daha güvenilir tek kimlik sağlar ve sahte hesap kötüye kullanımını azaltır.",
          )}
        </Text>
        {auth.message ? <Text style={styles.authMessage}>{auth.message}</Text> : null}
        <LanguagePreference
          language={language}
          onLanguageChange={onLanguageChange}
        />
        <Pressable
          disabled={disabled}
          onPress={handleGoogleSignIn}
          style={[styles.googleButton, disabled && styles.disabledButton]}
        >
          {busy ? (
            <ActivityIndicator color="#4285F4" />
          ) : (
            <GoogleButtonContent
              language={language}
              subtitle={text(language, "No password needed", "Şifre gerekmez")}
            />
          )}
        </Pressable>
      </View>
      <AccountInfoPanel language={language} />
    </View>
  );
}

function BillingPanel({
  entitlement,
  language,
  loading,
  message,
  onRestorePress,
  onUpgradePress,
  storeBilling,
  upgradeRequest,
  usageCounters,
}: {
  entitlement: BillingEntitlement;
  language: AppLanguage;
  loading: boolean;
  message: string;
  onRestorePress: () => void;
  onUpgradePress: () => void;
  storeBilling: StoreBillingStatus;
  upgradeRequest: BillingUpgradeRequest | null;
  usageCounters: UsageCounter[];
}) {
  const requestIsPending = upgradeRequest?.status === "pending";
  return (
    <View style={styles.infoCard}>
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>{text(language, "Plan and limits", "Plan ve limitler")}</Text>
          <Text style={styles.sectionSubtitle}>
            {text(
              language,
              "AI and document usage will be controlled from this account plan.",
              "AI ve belge kullanımı bu hesap planından yönetilecek.",
            )}
          </Text>
        </View>
        {loading ? <ActivityIndicator color="#0891B2" /> : null}
      </View>

      <View style={styles.billingStatusCard}>
        <Text style={styles.infoLabel}>{text(language, "Current plan", "Mevcut plan")}</Text>
        <Text style={styles.billingPlanName}>{planName(entitlement.plan, language)}</Text>
        <Text style={styles.infoText}>
          {entitlement.status === "active"
            ? text(language, "Active subscription", "Aktif abonelik")
            : entitlement.status === "past_due"
              ? text(language, "Payment needs attention", "Ödeme kontrol edilmeli")
              : text(language, "Free limits are active", "Ücretsiz limitler aktif")}
        </Text>
        <Text style={styles.infoText}>
          {text(language, "Source", "Kaynak")}: {processorName(entitlement.processor, language)}
        </Text>
        <Text style={styles.infoText}>
          {text(language, "Store billing", "Mağaza ödemesi")}: {storeBillingLabel(storeBilling, language)}
        </Text>
        {storeBilling.price ? (
          <Text style={styles.infoText}>
            {text(language, "Store price", "Mağaza fiyatı")}: {storeBilling.price}
          </Text>
        ) : null}
        {upgradeRequest ? (
          <Text style={styles.infoText}>
            {text(language, "Upgrade request", "Yükseltme talebi")}: {upgradeRequestStatusText(upgradeRequest.status, language)}
          </Text>
        ) : null}
      </View>

      <UsageCounterList
        counters={usageCounters}
        entitlement={entitlement}
        language={language}
      />

      <View style={styles.planGrid}>
        <PlanCard
          active={entitlement.plan.key === "free"}
          language={language}
          plan={billingPlans.free}
        />
        <PlanCard
          active={entitlement.plan.key === "tenant_plus"}
          language={language}
          onPress={onUpgradePress}
          pending={requestIsPending}
          plan={billingPlans.tenant_plus}
          storeAvailable={storeBilling.available}
          storePrice={storeBilling.price}
        />
      </View>
      <Pressable disabled={loading} onPress={onRestorePress} style={[styles.secondaryButton, loading && styles.disabledButton]}>
        <Text style={styles.secondaryButtonText}>{text(language, "Restore store purchase", "Mağaza satın alımını geri yükle")}</Text>
      </Pressable>
      {message ? <Text style={styles.authMessage}>{message}</Text> : null}
    </View>
  );
}

function PlanCard({
  active,
  language,
  onPress,
  pending,
  plan,
  storeAvailable,
  storePrice,
}: {
  active: boolean;
  language: AppLanguage;
  onPress?: () => void;
  pending?: boolean;
  plan: BillingPlan;
  storeAvailable?: boolean;
  storePrice?: string;
}) {
  const metrics: UsageMetric[] = ["chat_messages", "contract_analyses", "evidence_analyses"];
  return (
    <View style={[styles.planCard, active && styles.planCardActive]}>
      <View style={styles.planCardHeader}>
        <Text style={styles.planTitle}>{planName(plan, language)}</Text>
        <Text style={styles.planPrice}>
          {storePrice
            ? storePrice
            : plan.monthlyUsd
            ? text(language, `$${plan.monthlyUsd}/month`, `$${plan.monthlyUsd}/ay`)
            : text(language, "Free", "Ücretsiz")}
        </Text>
      </View>
      {metrics.map((metric) => (
        <View key={metric} style={styles.planLimitRow}>
          <Text style={styles.infoText}>{metricLabel(metric, language)}</Text>
          <Text style={styles.planLimitValue}>{plan.limits[metric]}</Text>
        </View>
      ))}
      {onPress ? (
        <Pressable disabled={pending} onPress={onPress} style={[styles.primaryButton, pending && styles.disabledButton]}>
          <Text style={styles.primaryButtonText}>
            {pending
              ? text(language, "Request pending", "Talep bekliyor")
              : storeAvailable
                ? text(language, "Subscribe with store", "Mağaza ile abone ol")
                : text(language, "Request Plus access", "Plus erişimi iste")}
          </Text>
        </Pressable>
      ) : (
        <Text style={styles.helperText}>{text(language, "Default starter limits.", "Varsayılan başlangıç limitleri.")}</Text>
      )}
    </View>
  );
}

function UsageCounterList({
  counters,
  entitlement,
  language,
}: {
  counters: UsageCounter[];
  entitlement: BillingEntitlement;
  language: AppLanguage;
}) {
  const metrics: UsageMetric[] = ["chat_messages", "contract_analyses", "evidence_analyses"];
  const countersByMetric = new Map(counters.map((counter) => [counter.metric, counter]));

  return (
    <View style={styles.infoList}>
      {metrics.map((metric) => {
        const counter = countersByMetric.get(metric);
        const limit = counter?.limit ?? entitlement.plan.limits[metric];
        const used = counter?.used ?? 0;
        const remaining = Math.max(0, limit - used);
        return (
          <View key={metric} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{metricLabel(metric, language)}</Text>
            <Text style={styles.infoText}>
              {text(
                language,
                `${used} used, ${remaining} remaining from ${limit}`,
                `${limit} limitin ${used} tanesi kullanıldı, ${remaining} kaldı`,
              )}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function upgradeRequestStatusText(status: BillingUpgradeRequest["status"], language: AppLanguage) {
  const labels: Record<BillingUpgradeRequest["status"], { en: string; tr: string }> = {
    approved: { en: "Approved", tr: "Onaylandı" },
    canceled: { en: "Canceled", tr: "İptal edildi" },
    pending: { en: "Pending", tr: "Bekliyor" },
    rejected: { en: "Rejected", tr: "Reddedildi" },
  };
  return labels[status][language];
}

function storeBillingLabel(status: StoreBillingStatus, language: AppLanguage) {
  if (status.active) {
    return text(language, "Active in app store", "Mağazada aktif");
  }
  if (status.available) {
    return status.platform === "ios"
      ? text(language, "Apple billing ready", "Apple ödeme hazır")
      : text(language, "Google Play billing ready", "Google Play ödeme hazır");
  }
  return status.reason || text(language, "Needs native development build", "Native development build gerekiyor");
}

function AccountInfoPanel({ language }: { language: AppLanguage }) {
  const items = [
    {
      label: text(language, "Private evidence", "Özel kanitlar"),
      text: text(language, "Uploads are stored in the private Supabase evidence bucket under the signed-in user folder.", "Yüklemeler, giris yapan kullanicinin özel Supabase kanit klasöründe saklanir."),
    },
    {
      label: text(language, "AI usage", "Yapay zeka kullanimi"),
      text: text(language, "Kira and evidence analysis use saved case context and uploaded-file summaries through Supabase Edge Functions.", "Kira ve kanit analizi, Supabase Edge Functions üzerinden kayitli dosya baglamini ve özetleri kullanir."),
    },
    {
      label: text(language, "Legal note", "Hukuki not"),
      text: text(language, "Kira gives practical tenant guidance, not definitive legal advice. High-risk disputes still need a qualified professional.", "Kira pratik kiraci rehberligi verir, kesin hukuki tavsiye degildir. Yüksek riskli uyusmazliklar uzman destegi ister."),
    },
    {
      label: text(language, "Production reminder", "Yayin öncesi not"),
      text: text(language, "Before release, add full privacy policy, consent language, rate limits, provider disclosure, and account deletion/export.", "Yayindan önce gizlilik politikasi, onay metni, limitler, saglayici açiklamasi ve hesap silme/disa aktarma eklenmeli."),
    },
  ];

  return (
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>{text(language, "Privacy and legal", "Gizlilik ve hukuki")}</Text>
      <Text style={styles.sectionSubtitle}>
        {text(language, "Base placeholders for the final policy screens.", "Son politika ekranlari için temel yer tutucular.")}
      </Text>
      <View style={styles.infoList}>
        {items.map((item) => (
          <View key={item.label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{item.label}</Text>
            <Text style={styles.infoText}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function LanguagePreference({
  language,
  onLanguageChange,
}: {
  language: AppLanguage;
  onLanguageChange: (language: AppLanguage) => void;
}) {
  return (
    <View style={styles.preferenceCard}>
      <Text style={styles.inputLabel}>{text(language, "Language", "Dil")}</Text>
      <View style={styles.segmentedControl}>
        <Pressable
          onPress={() => onLanguageChange("en")}
          style={[
            styles.segmentButton,
            language === "en" && styles.segmentButtonActive,
          ]}
        >
          <Text
            style={[
              styles.segmentButtonText,
              language === "en" && styles.segmentButtonTextActive,
            ]}
          >
            English
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onLanguageChange("tr")}
          style={[
            styles.segmentButton,
            language === "tr" && styles.segmentButtonActive,
          ]}
        >
          <Text
            style={[
              styles.segmentButtonText,
              language === "tr" && styles.segmentButtonTextActive,
            ]}
          >
            Türkçe
          </Text>
        </Pressable>
      </View>
      <Text style={styles.preferenceNote}>
        {text(language, "Kira requests will use this language preference.", "Kira istekleri bu dil tercihini kullanir.")}
      </Text>
    </View>
  );
}

function RentalImportAdminPanel({ language }: { language: AppLanguage }) {
  const [busyId, setBusyId] = useState("");
  const [draftText, setDraftText] = useState("");
  const [imports, setImports] = useState<RentalImportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sahibindenText, setSahibindenText] = useState("");
  const [sahibindenUrl, setSahibindenUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  const pendingCount = imports.filter((item) => item.status === "pending").length;
  const parsedPreview = useMemo(() => parseRentalImportText(draftText), [draftText]);
  const sahibindenPreview = useMemo(
    () => parseSahibindenBrowserText(sahibindenText, sahibindenUrl),
    [sahibindenText, sahibindenUrl],
  );

  useEffect(() => {
    refreshImports();
  }, []);

  async function refreshImports() {
    setLoading(true);
    setMessage("");
    try {
      setImports(await loadRentalImports());
    } catch (err) {
      setMessage(err instanceof Error ? err.message : text(language, "Could not load imports.", "Aktarimlar yüklenemedi."));
    } finally {
      setLoading(false);
    }
  }

  async function stageImports() {
    const parsed = parsedPreview;
    if (!parsed.length) {
      setMessage(text(language, "No valid listing rows found.", "Geçerli ilan satiri bulunamadi."));
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      await createRentalImports(parsed);
      setDraftText("");
      setMessage(text(language, `${parsed.length} listing${parsed.length === 1 ? "" : "s"} staged for review.`, `${parsed.length} ilan inceleme kuyruğuna alindi.`));
      await refreshImports();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : text(language, "Could not stage listings.", "Ilanlar kuyruga alinamadi."));
    } finally {
      setLoading(false);
    }
  }

  function fillExampleImport() {
    setDraftText(JSON.stringify({
      address: "Ilıca Mahallesi test adresi",
      city: "İzmir",
      description: "Test açıklama",
      district: "Narlıdere",
      neighborhood: "Ilıca",
      rent: 25000,
      size: 90,
      source: "manual",
      source_url: `https://example.com/test-listing-${Date.now()}`,
      title: "Test 2+1 Daire",
    }, null, 2));
  }

  async function stageFromUrl() {
    if (!sourceUrl.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      const result = await stageRentalImportFromUrl(sourceUrl);
      setSourceUrl("");
      setMessage(
        result.duplicate
          ? text(language, "That URL is already in the import queue.", "Bu baglanti zaten aktarim kuyruğunda.")
          : text(language, "Listing URL fetched and staged for review.", "Ilan baglantisi alindi ve inceleme kuyruğuna eklendi."),
      );
      await refreshImports();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : text(language, "Could not fetch listing URL.", "Ilan baglantisi alinamadi."));
    } finally {
      setLoading(false);
    }
  }

  async function stageSahibindenBrowserImport() {
    const parsed = sahibindenPreview;
    if (!parsed.length) {
      setMessage(text(language, "No valid Sahibinden listing found in pasted page text.", "Yapıştırılan sayfa metninde geçerli Sahibinden ilanı bulunamadı."));
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      await createRentalImports(parsed);
      setSahibindenText("");
      setSahibindenUrl("");
      setMessage(text(language, "Sahibinden page text staged for review.", "Sahibinden sayfa metni inceleme kuyruğuna alındı."));
      await refreshImports();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : text(language, "Could not stage Sahibinden listing.", "Sahibinden ilanı kuyruğa alınamadı."));
    } finally {
      setLoading(false);
    }
  }

  async function copySahibindenBookmarklet() {
    const copied = await copyTextToClipboard(SAHIBINDEN_BOOKMARKLET);
    setMessage(
      copied
        ? text(language, "Sahibinden batch bookmarklet copied. Create a browser bookmark and paste it into the bookmark URL.", "Sahibinden batch bookmarklet kopyalandı. Tarayıcıda yer imi oluşturup URL alanına yapıştır.")
        : text(language, "Could not copy bookmarklet in this browser.", "Bu tarayıcıda bookmarklet kopyalanamadı."),
    );
  }

  async function approveItem(item: RentalImportItem) {
    setBusyId(item.id);
    setMessage("");
    try {
      await approveRentalImport(item);
      setMessage(text(language, "Listing approved and published.", "Ilan onaylandi ve yayinlandi."));
      await refreshImports();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : text(language, "Could not approve listing.", "Ilan onaylanamadi."));
    } finally {
      setBusyId("");
    }
  }

  async function rejectItem(id: string) {
    setBusyId(id);
    setMessage("");
    try {
      await rejectRentalImport(id);
      setMessage(text(language, "Listing rejected.", "Ilan reddedildi."));
      await refreshImports();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : text(language, "Could not reject listing.", "Ilan reddedilemedi."));
    } finally {
      setBusyId("");
    }
  }

  return (
    <View style={styles.toolCard}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{text(language, "Rental import queue", "Kira ilan aktarim kuyruğu")}</Text>
          <Text style={styles.sectionSubtitle}>
            {text(
              language,
              "Paste JSON or CSV rows, review them, then publish approved facts to market listings.",
              "JSON veya CSV satirlari yapistir, incele, sonra onaylanan bilgileri emsal ilanlara aktar.",
            )}
          </Text>
        </View>
        <View style={styles.marketBadge}>
          <Text style={styles.marketBadgeText}>{pendingCount} pending</Text>
        </View>
      </View>

      <Text style={styles.inputLabel}>{text(language, "Paste listing data", "Ilan verisini yapistir")}</Text>
      <TextInput
        multiline
        onChangeText={setDraftText}
        placeholder={'{"title":"Test 2+1 Daire","rent":25000,"size":90,"city":"İzmir","district":"Narlıdere"}'}
        style={[styles.input, styles.largeTextArea]}
        value={draftText}
      />
      <Text style={styles.preferenceNote}>
        {draftText.trim()
          ? text(language, `${parsedPreview.length} valid row${parsedPreview.length === 1 ? "" : "s"} detected.`, `${parsedPreview.length} geçerli satir algilandi.`)
          : text(language, "JSON is the safest test format. CSV also works.", "En güvenli test biçimi JSON. CSV de desteklenir.")}
      </Text>
      <View style={styles.buttonRow}>
        <Pressable
          disabled={loading || !parsedPreview.length}
          onPress={stageImports}
          style={[styles.primaryButton, (loading || !parsedPreview.length) && styles.disabledButton]}
        >
          <Text style={styles.primaryButtonText}>{text(language, "Stage listings", "Ilanlari kuyruğa al")}</Text>
        </Pressable>
        <Pressable
          disabled={loading}
          onPress={fillExampleImport}
          style={[styles.secondaryButton, loading && styles.disabledButton]}
        >
          <Text style={styles.secondaryButtonText}>{text(language, "Fill example", "Örnek doldur")}</Text>
        </Pressable>
        <Pressable
          disabled={loading}
          onPress={refreshImports}
          style={[styles.secondaryButton, loading && styles.disabledButton]}
        >
          <Text style={styles.secondaryButtonText}>{loading ? text(language, "Loading", "Yükleniyor") : text(language, "Refresh queue", "Kuyruğu yenile")}</Text>
        </Pressable>
      </View>

      <Text style={styles.inputLabel}>{text(language, "Fetch one listing URL", "Tek ilan baglantisi getir")}</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="url"
        onChangeText={setSourceUrl}
        placeholder="https://example.com/listing/123"
        style={styles.input}
        value={sourceUrl}
      />
      <Pressable
        disabled={loading || !sourceUrl.trim()}
        onPress={stageFromUrl}
        style={[styles.secondaryButton, (loading || !sourceUrl.trim()) && styles.disabledButton]}
      >
        <Text style={styles.secondaryButtonText}>{text(language, "Fetch and stage URL", "Baglantiyi getir ve kuyruğa al")}</Text>
      </Pressable>

      <Text style={styles.inputLabel}>{text(language, "Sahibinden batch helper", "Sahibinden batch yardımcısı")}</Text>
      <Text style={styles.preferenceNote}>
        {text(
          language,
          "Copy the bookmarklet, save it as a browser bookmark, then click it on each Sahibinden listing. It collects listings and can copy one batch JSON for the importer above.",
          "Bookmarklet'i kopyala, tarayıcıda yer imi olarak kaydet, sonra her Sahibinden ilanında tıkla. İlanları biriktirir ve yukarıdaki aktarıcı için tek batch JSON kopyalar.",
        )}
      </Text>
      <Pressable disabled={loading} onPress={copySahibindenBookmarklet} style={[styles.secondaryButton, loading && styles.disabledButton]}>
        <Text style={styles.secondaryButtonText}>{text(language, "Copy Sahibinden bookmarklet", "Sahibinden bookmarklet'i kopyala")}</Text>
      </Pressable>

      <Text style={styles.inputLabel}>{text(language, "Sahibinden browser import", "Sahibinden tarayıcı aktarımı")}</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="url"
        onChangeText={setSahibindenUrl}
        placeholder="https://www.sahibinden.com/ilan/..."
        style={styles.input}
        value={sahibindenUrl}
      />
      <TextInput
        multiline
        onChangeText={setSahibindenText}
        placeholder={text(
          language,
          "Open the Sahibinden listing in your browser, select the visible page text, copy it, then paste here.",
          "Sahibinden ilanını tarayıcıda aç, görünen sayfa metnini seçip kopyala, sonra buraya yapıştır.",
        )}
        style={[styles.input, styles.largeTextArea]}
        value={sahibindenText}
      />
      <Text style={styles.preferenceNote}>
        {sahibindenText.trim()
          ? text(language, `${sahibindenPreview.length} Sahibinden listing detected.`, `${sahibindenPreview.length} Sahibinden ilanı algılandı.`)
          : text(language, "This works when server fetch is blocked because your browser loads the page first.", "Sunucu erişimi engellendiğinde bu yöntem çalışır; sayfayı önce senin tarayıcın yükler.")}
      </Text>
      <Pressable
        disabled={loading || !sahibindenPreview.length}
        onPress={stageSahibindenBrowserImport}
        style={[styles.secondaryButton, (loading || !sahibindenPreview.length) && styles.disabledButton]}
      >
        <Text style={styles.secondaryButtonText}>{text(language, "Stage browser import", "Tarayıcı aktarımını kuyruğa al")}</Text>
      </Pressable>

      {message ? <Text style={styles.copyStateText}>{message}</Text> : null}

      <View style={styles.stack}>
        {imports.map((item) => (
          <RentalImportCard
            busy={busyId === item.id}
            item={item}
            key={item.id}
            language={language}
            onApprove={() => approveItem(item)}
            onReject={() => rejectItem(item.id)}
          />
        ))}
        {!loading && !imports.length ? (
          <PlaceholderLine text={text(language, "No imported listings yet.", "Henüz aktarilan ilan yok.")} />
        ) : null}
      </View>
    </View>
  );
}

function RentalImportCard({
  busy,
  item,
  language,
  onApprove,
  onReject,
}: {
  busy: boolean;
  item: RentalImportItem;
  language: AppLanguage;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <View style={styles.listingCard}>
      <View style={styles.listingHeader}>
        <View style={styles.listingTitleWrap}>
          <Text style={styles.listingTitle}>{item.title}</Text>
          <Text style={styles.listingLocation}>
            {[item.neighborhood, item.district, item.city].filter(Boolean).join(", ")}
          </Text>
        </View>
        <View style={styles.marketBadge}>
          <Text style={styles.marketBadgeText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.listingStats}>
        <Text style={styles.listingRent}>{formatLira(item.rent)}</Text>
        <Text style={styles.listingMeta}>{item.size ? `${item.size} m2` : text(language, "Size n/a", "m2 yok")}</Text>
        <Text style={styles.listingMeta}>{item.rooms || text(language, "Rooms n/a", "Oda yok")}</Text>
      </View>
      {item.address ? <Text style={styles.listingBody}>{item.address}</Text> : null}
      {item.description ? <Text numberOfLines={3} style={styles.listingBody}>{item.description}</Text> : null}
      <Text style={styles.listingSource}>
        {text(language, "Source", "Kaynak")}: {item.source || text(language, "Import", "Aktarim")} | {item.source_url || item.proof || text(language, "No URL", "URL yok")}
      </Text>
      {item.status === "pending" ? (
        <View style={styles.buttonRow}>
          <Pressable disabled={busy} onPress={onApprove} style={[styles.primaryButton, busy && styles.disabledButton]}>
            <Text style={styles.primaryButtonText}>{text(language, "Approve", "Onayla")}</Text>
          </Pressable>
          <Pressable disabled={busy} onPress={onReject} style={[styles.secondaryButton, busy && styles.disabledButton]}>
            <Text style={styles.secondaryButtonText}>{text(language, "Reject", "Reddet")}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function MarketProofSection({
  language,
  onMarketSummaryChange,
}: {
  language: AppLanguage;
  onMarketSummaryChange?: (summary: MarketSummary) => void;
}) {
  const [listings, setListings] = useState<RentListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [listingError, setListingError] = useState("");
  const median = useMemo(() => medianRent(listings), [listings]);

  useEffect(() => {
    onMarketSummaryChange?.({
      listingCount: listings.length,
      medianRent: median,
    });
  }, [listings.length, median, onMarketSummaryChange]);

  useEffect(() => {
    refreshListings();
  }, []);

  async function refreshListings() {
    setLoadingListings(true);
    setListingError("");
    try {
      setListings(await loadRentListings());
    } catch (err) {
      setListingError(err instanceof Error ? err.message : text(language, "Could not load rent listings.", "Kira ilanları yüklenemedi."));
    } finally {
      setLoadingListings(false);
    }
  }

  return (
    <View style={styles.geminiCard}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{text(language, "Nearby comparable rent", "Yakın emsal kira")}</Text>
          <Text style={styles.sectionSubtitle}>
            {listings.length
              ? text(language, `${listings.length} approved listing${listings.length === 1 ? "" : "s"} loaded`, `${listings.length} onaylı ilan yüklendi`)
              : text(language, "Approved public listings from Supabase", "Supabase'ten onaylı ilanlar")}
          </Text>
        </View>
        <Pressable
          disabled={loadingListings}
          onPress={refreshListings}
          style={[styles.iconTextButton, loadingListings && styles.disabledButton]}
        >
          <Text style={styles.iconTextButtonText}>
            {loadingListings ? text(language, "Loading", "Yükleniyor") : text(language, "Refresh", "Yenile")}
          </Text>
        </Pressable>
      </View>

      {median ? (
        <View style={styles.grid}>
          <Metric label={text(language, "Market median", "Emsal medyan")} value={formatLira(median)} />
          <Metric label={text(language, "Listing count", "İlan sayısı")} value={String(listings.length)} />
        </View>
      ) : null}

      {listingError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>{text(language, "Could not load listings", "İlanlar yüklenemedi")}</Text>
          <Text style={styles.errorText}>{listingError}</Text>
        </View>
      ) : null}

      <View style={styles.stack}>
        {loadingListings && !listings.length ? (
          <View style={styles.summaryCard}>
            <ActivityIndicator color="#0891B2" />
            <Text style={styles.centerNote}>{text(language, "Loading rent proof...", "Emsal kira yükleniyor...")}</Text>
          </View>
        ) : null}
        {!loadingListings && !listings.length && !listingError ? (
          <PlaceholderLine text={text(language, "No approved rent listings found yet.", "Henüz onaylı kira ilanı bulunamadı.")} />
        ) : null}
        {listings.map((listing) => (
          <RentListingCard key={listing.id} language={language} listing={listing} median={median} />
        ))}
      </View>
    </View>
  );
}

function RentCheckPanel({
  language,
  marketSummary,
  onMarketSummaryChange,
  onRentCaseChange,
  rentCase,
}: {
  language: AppLanguage;
  marketSummary: MarketSummary;
  onMarketSummaryChange: (summary: MarketSummary) => void;
  onRentCaseChange: (next: RentCaseState) => void;
  rentCase: RentCaseState;
}) {
  const [listings, setListings] = useState<RentListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [listingError, setListingError] = useState("");
  const [draftState, setDraftState] = useState("");

  const calculation = useMemo(
    () =>
      calculateRentIncrease({
        cpiRate: safeNumber(rentCase.cpiRate),
        currentRent: safeNumber(rentCase.currentRent),
        renewalDate: rentCase.renewalDate,
        requestedRent: safeNumber(rentCase.requestedRent),
      }),
    [rentCase],
  );

  const median = useMemo(() => medianRent(listings), [listings]);

  useEffect(() => {
    if (
      marketSummary.listingCount !== listings.length ||
      marketSummary.medianRent !== median
    ) {
      onMarketSummaryChange({
        listingCount: listings.length,
        medianRent: median,
      });
    }
  }, [listings.length, marketSummary, median, onMarketSummaryChange]);

  useEffect(() => {
    refreshListings();
  }, []);

  async function refreshListings() {
    setLoadingListings(true);
    setListingError("");
    try {
      setListings(await loadRentListings());
    } catch (err) {
      setListingError(err instanceof Error ? err.message : text(language, "Could not load rent listings.", "Kira ilanlari yüklenemedi."));
    } finally {
      setLoadingListings(false);
    }
  }

  function updateRentCase(field: keyof RentCaseState, value: string) {
    onRentCaseChange({
      ...rentCase,
      [field]: value,
    });
  }

  async function copyLegalDraft() {
    const draft = buildLegalRentDraft(language, rentCase);
    const copied = await copyTextToClipboard(draft);
    setDraftState(
      copied
        ? text(language, "Legal rent message copied.", "Yasal kira mesaji kopyalandi.")
        : draft,
    );
  }

  return (
    <View style={styles.stack}>
      <SummaryCard
        label={text(language, "Rent increase result", "Kira artis sonucu")}
        value={
          calculation.aboveCeiling
            ? text(language, `${formatLira(calculation.difference)} above estimated ceiling`, `Tahmini sinirin ${formatLira(calculation.difference)} üstünde`)
            : text(language, `${formatLira(Math.abs(calculation.difference))} under estimated ceiling`, `Tahmini sinirin ${formatLira(Math.abs(calculation.difference))} altinda`)
        }
      />

      <View style={styles.formCard}>
        <Text style={styles.inputLabel}>{text(language, "Current rent", "Mevcut kira")}</Text>
        <TextInput
          keyboardType="numeric"
          onChangeText={(value) => updateRentCase("currentRent", value)}
          placeholder="18000"
          style={styles.input}
          value={rentCase.currentRent}
        />
        <Text style={styles.inputLabel}>{text(language, "Requested rent", "Istenen kira")}</Text>
        <TextInput
          keyboardType="numeric"
          onChangeText={(value) => updateRentCase("requestedRent", value)}
          placeholder="29000"
          style={styles.input}
          value={rentCase.requestedRent}
        />
        <Text style={styles.inputLabel}>{text(language, "12-month CPI / TUFE average", "12 aylik TÜFE ortalamasi")}</Text>
        <TextInput
          keyboardType="numeric"
          onChangeText={(value) => updateRentCase("cpiRate", value)}
          placeholder="65"
          style={styles.input}
          value={rentCase.cpiRate}
        />
        <Text style={styles.inputLabel}>{text(language, "Renewal date", "Yenileme tarihi")}</Text>
        <TextInput
          onChangeText={(value) => updateRentCase("renewalDate", value)}
          placeholder="YYYY-MM-DD"
          style={styles.input}
          value={rentCase.renewalDate}
        />
      </View>

      <View style={styles.grid}>
        <Metric label={text(language, "Estimated ceiling", "Tahmini sinir")} value={formatLira(calculation.ceiling)} />
        <Metric label={text(language, "Requested increase", "Istenen artis")} value={formatPercent(calculation.increasePercent)} />
        <Metric
          label={text(language, "Difference", "Fark")}
          value={`${calculation.difference >= 0 ? "+" : "-"}${formatLira(Math.abs(calculation.difference))}`}
        />
        <Metric label={text(language, "Market median", "Emsal medyan")} value={median ? formatLira(median) : text(language, "No data", "Veri yok")} />
      </View>

      <View style={styles.toolCard}>
        <Text style={styles.sectionTitle}>{text(language, "TBK 344 message", "TBK 344 mesaji")}</Text>
        <Text style={styles.sectionSubtitle}>
          {text(language, "Copy a calm legal rent ceiling note for your landlord.", "Ev sahibine sakin bir yasal kira tavani notu hazirla.")}
        </Text>
        <Pressable onPress={copyLegalDraft} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            {text(language, "Copy legal message", "Yasal mesaji kopyala")}
          </Text>
        </Pressable>
        {draftState ? <Text style={styles.copyStateText}>{draftState}</Text> : null}
      </View>

      <EvictionRiskWizard language={language} />

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{text(language, "Nearby rent proof", "Yakin emsal kira")}</Text>
          <Text style={styles.sectionSubtitle}>
            {listings.length ? text(language, `${listings.length} public listings loaded`, `${listings.length} açik ilan yüklendi`) : text(language, "Public listings from Supabase", "Supabase'ten açik ilanlar")}
          </Text>
        </View>
        <Pressable
          disabled={loadingListings}
          onPress={refreshListings}
          style={[styles.iconTextButton, loadingListings && styles.disabledButton]}
        >
          <Text style={styles.iconTextButtonText}>
            {loadingListings ? text(language, "Loading", "Yükleniyor") : text(language, "Refresh", "Yenile")}
          </Text>
        </Pressable>
      </View>

      {listingError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>{text(language, "Could not load listings", "Ilanlar yüklenemedi")}</Text>
          <Text style={styles.errorText}>{listingError}</Text>
        </View>
      ) : null}

      <View style={styles.stack}>
        {loadingListings && !listings.length ? (
          <View style={styles.summaryCard}>
            <ActivityIndicator color="#0891B2" />
            <Text style={styles.centerNote}>{text(language, "Loading rent proof...", "Emsal kira yükleniyor...")}</Text>
          </View>
        ) : null}
        {!loadingListings && !listings.length && !listingError ? (
          <PlaceholderLine text={text(language, "No rent listings found yet.", "Henüz kira ilani bulunamadi.")} />
        ) : null}
        {listings.map((listing) => (
          <RentListingCard key={listing.id} language={language} listing={listing} median={median} />
        ))}
      </View>
    </View>
  );
}

function RentListingCard({
  language,
  listing,
  median,
}: {
  language: AppLanguage;
  listing: RentListing;
  median: number;
}) {
  return (
    <View style={styles.listingCard}>
      <View style={styles.listingHeader}>
        <View style={styles.listingTitleWrap}>
          <Text style={styles.listingTitle}>{listing.title || listing.neighborhood || text(language, "Rent listing", "Kira ilani")}</Text>
          <Text style={styles.listingLocation}>
            {[listing.neighborhood, listing.district, listing.city].filter(Boolean).join(", ")}
          </Text>
        </View>
        <View style={styles.marketBadge}>
          <Text style={styles.marketBadgeText}>{marketComparison(listing.rent, median)}</Text>
        </View>
      </View>
      <View style={styles.listingStats}>
        <Text style={styles.listingRent}>{formatLira(listing.rent)}</Text>
        <Text style={styles.listingMeta}>{listing.size ? `${listing.size} m2` : text(language, "Size n/a", "m2 yok")}</Text>
        <Text style={styles.listingMeta}>
          {rentPerSquareMeter(listing) ? `${formatLira(rentPerSquareMeter(listing))} / m2` : text(language, "m2 n/a", "m2 yok")}
        </Text>
      </View>
      {listing.address ? <Text style={styles.listingBody}>{listing.address}</Text> : null}
      <Text style={styles.listingSource}>
        {text(language, "Source", "Kaynak")}: {listing.source || text(language, "Manual", "Manuel")} | {text(language, "Proof", "Kanit")}: {listing.proof || text(language, "Not attached", "Eklenmedi")}
      </Text>
    </View>
  );
}

function EvictionRiskWizard({ language }: { language: AppLanguage }) {
  const [state, setState] = useState<EvictionWizardState>({
    blankDate: "unknown",
    sameDate: "unknown",
  });

  const result = getEvictionWizardResult(language, state);

  function Choice({
    field,
    label,
    value,
  }: {
    field: keyof EvictionWizardState;
    label: string;
    value: "no" | "yes";
  }) {
    const selected = state[field] === value;
    return (
      <Pressable
        onPress={() => setState((current) => ({ ...current, [field]: value }))}
        style={[styles.segmentButton, selected && styles.segmentButtonActive]}
      >
        <Text style={[styles.segmentButtonText, selected && styles.segmentButtonTextActive]}>
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.toolCard}>
      <Text style={styles.sectionTitle}>{text(language, "Eviction undertaking risk", "Tahliye taahhüdü riski")}</Text>
      <Text style={styles.sectionSubtitle}>
        {text(language, "Quick diagnostic for common tahliye taahhütnamesi issues.", "Tahliye taahhütnamesi için hizli risk kontrolü.")}
      </Text>

      <Text style={styles.inputLabel}>
        {text(language, "Was it signed the same day as the lease?", "Sözlesmeyle ayni gün mü imzalandi?")}
      </Text>
      <View style={styles.segmentedControl}>
        <Choice field="sameDate" label={text(language, "Yes", "Evet")} value="yes" />
        <Choice field="sameDate" label={text(language, "No", "Hayir")} value="no" />
      </View>

      <Text style={styles.inputLabel}>
        {text(language, "Was the eviction date blank when signed?", "Imzalanirken tahliye tarihi bos muydu?")}
      </Text>
      <View style={styles.segmentedControl}>
        <Choice field="blankDate" label={text(language, "Yes", "Evet")} value="yes" />
        <Choice field="blankDate" label={text(language, "No", "Hayir")} value="no" />
      </View>

      <View style={styles.resultPanel}>
        <Text style={styles.resultLabel}>{result.label}</Text>
        <Text style={styles.resultText}>{result.text}</Text>
      </View>
    </View>
  );
}

function getEvictionWizardResult(language: AppLanguage, state: EvictionWizardState) {
  if (state.sameDate === "yes") {
    return {
      label: text(language, "Likely invalid", "Muhtemelen geçersiz"),
      text: text(
        language,
        "Undertakings signed with the lease are commonly challenged as pressure/duress. Keep the document and seek legal review.",
        "Kira sözlesmesiyle ayni gün alinan taahhütler baski iddiasiyla sikça tartisilir. Belgeyi sakla ve hukuki inceleme al.",
      ),
    };
  }

  if (state.sameDate === "no" && state.blankDate === "yes") {
    return {
      label: text(language, "High risk", "Yüksek risk"),
      text: text(
        language,
        "A blank date can create serious proof risk because dates may be filled later. Collect messages and signing context.",
        "Bos tarih sonradan doldurma riski yaratabilir. Mesajlari ve imza baglamini topla.",
      ),
    };
  }

  if (state.sameDate === "no" && state.blankDate === "no") {
    return {
      label: text(language, "Formally stronger", "Seklen daha güçlü"),
      text: text(
        language,
        "The form risk is lower, but eviction disputes still depend on proof, dates, and procedure.",
        "Sekli risk daha düsük; yine de tahliye uyusmazligi ispat, tarih ve usule baglidir.",
      ),
    };
  }

  return {
    label: text(language, "Answer both questions", "Iki soruyu da yanitla"),
    text: text(
      language,
      "The risk result will update as you choose the signing details.",
      "Imza detaylarini seçtikçe risk sonucu güncellenecek.",
    ),
  };
}

function RentStatusHero({
  isPaid,
  language,
  onPaidChange,
  rentCase,
}: {
  isPaid: boolean;
  language: AppLanguage;
  onPaidChange: (value: boolean) => void;
  rentCase: RentCaseState;
}) {
  const [copyState, setCopyState] = useState("");
  const currentRent = safeNumber(rentCase.currentRent);
  const requestedRent = safeNumber(rentCase.requestedRent);
  const calculation = calculateRentIncrease({
    cpiRate: safeNumber(rentCase.cpiRate),
    currentRent,
    renewalDate: rentCase.renewalDate,
    requestedRent,
  });
  const urgency = isPaid
    ? text(language, "Paid", "Ödendi")
    : text(language, "Due soon", "Yaklasan ödeme");

  async function copyReceiptMessage() {
    const draft = buildReceiptDraft(language, currentRent);
    const copied = await copyTextToClipboard(draft);
    setCopyState(
      copied
        ? text(language, "Receipt message copied.", "Dekont mesaji kopyalandi.")
        : draft,
    );
  }

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroBadgeRow}>
        <Text style={styles.heroKicker}>{text(language, "Rent status", "Kira durumu")}</Text>
        <View style={[styles.paymentBadge, isPaid && styles.paymentBadgePaid]}>
          <Text style={[styles.paymentBadgeText, isPaid && styles.paymentBadgeTextPaid]}>
            {urgency}
          </Text>
        </View>
      </View>
      <Text style={styles.heroTitle}>
        {text(language, "Your tenant file is ready for the next move.", "Kiraci dosyan siradaki adima hazir.")}
      </Text>
      <View style={styles.heroStatRow}>
        <View style={styles.heroStat}>
          <Text style={styles.heroStatLabel}>{text(language, "Current", "Mevcut")}</Text>
          <Text style={styles.heroStatValue}>{formatLira(currentRent)}</Text>
        </View>
        <View style={styles.heroStat}>
          <Text style={styles.heroStatLabel}>{text(language, "Legal ceiling", "Yasal tavan")}</Text>
          <Text style={styles.heroStatValue}>{formatLira(calculation.ceiling)}</Text>
        </View>
      </View>
      <View style={styles.heroButtonRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onPaidChange(!isPaid)}
          style={[styles.heroActionButton, isPaid && styles.heroActionButtonMuted]}
        >
          <Text style={styles.heroActionButtonText}>
            {isPaid ? text(language, "Mark unpaid", "Ödenmedi yap") : text(language, "Mark paid", "Ödendi yap")}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={copyReceiptMessage}
          style={styles.heroActionButton}
        >
          <Text style={styles.heroActionButtonText}>
            {text(language, "Copy notice", "Mesaji kopyala")}
          </Text>
        </Pressable>
      </View>
      {copyState ? <Text style={styles.heroCopyStateText}>{copyState}</Text> : null}
    </View>
  );
}

function buildReceiptDraft(language: AppLanguage, currentRent: number) {
  if (language === "en") {
    return `Dear landlord,\n\nI have paid this month's rent of ${formatLira(currentRent)} on time. I am keeping the receipt in my tenant file for our records.\n\nBest regards.`;
  }

  return `Sayin ev sahibim,\n\nBu aya ait ${formatLira(currentRent)} kira ödememi zamaninda yaptim. Dekontu kayitlarimiz için kiraci dosyamda sakliyorum.\n\nBilginize sunarim.`;
}

function buildLegalRentDraft(language: AppLanguage, rentCase: RentCaseState) {
  const currentRent = safeNumber(rentCase.currentRent);
  const requestedRent = safeNumber(rentCase.requestedRent);
  const cpiRate = safeNumber(rentCase.cpiRate);
  const calculation = calculateRentIncrease({
    cpiRate,
    currentRent,
    renewalDate: rentCase.renewalDate,
    requestedRent,
  });
  const maxIncreaseAmount = calculation.ceiling - currentRent;

  if (language === "en") {
    return `Dear landlord,\n\nUnder TBK Article 344, the maximum rent increase for the renewal period is limited by the 12-month CPI average of ${formatPercent(cpiRate)}.\n\nCurrent rent: ${formatLira(currentRent)}\nLegal increase amount: ${formatLira(maxIncreaseAmount)}\nNew legal rent ceiling: ${formatLira(calculation.ceiling)}\nRequested rent: ${formatLira(requestedRent)}\n\nAs a tenant who pays on time, I propose that the new period continue at the legal ceiling of ${formatLira(calculation.ceiling)}. Respectfully.`;
  }

  return `Sayin ev sahibim,\n\nYasal düzenlemelere (TBK Madde 344) göre yenileme dönemindeki azami kira artis orani 12 aylik TÜFE ortalamasi olan ${formatPercent(cpiRate)} ile sinirlidir.\n\nMevcut kira: ${formatLira(currentRent)}\nYasal zam miktari: ${formatLira(maxIncreaseAmount)}\nYeni yasal kira tavani: ${formatLira(calculation.ceiling)}\nTalep edilen kira: ${formatLira(requestedRent)}\n\nÖdemelerimi zamaninda yapan bir kiraci olarak, yeni dönem kiramizin yasal tavan olan ${formatLira(calculation.ceiling)} üzerinden devam etmesini teklif ediyorum. Bilgilerinize sunarim.`;
}

async function copyTextToClipboard(value: string) {
  try {
    const webNavigator = Platform.OS === "web" ? (globalThis.navigator as any) : null;
    if (webNavigator?.clipboard?.writeText) {
      await webNavigator.clipboard.writeText(value);
      return true;
    }
  } catch {}
  return false;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryAccent}>
        <Text style={styles.summaryAccentText}>+</Text>
      </View>
      <View style={styles.cardCopy}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardValue}>{value}</Text>
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function PlaceholderLine({ text }: { text: string }) {
  return (
    <View style={styles.placeholderLine}>
      <Text style={styles.placeholderText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EAFBFF",
  },
  welcomeScreen: {
    flex: 1,
    backgroundColor: "#EAFBFF",
    overflow: "hidden",
  },
  welcomeTopWash: {
    backgroundColor: "#0891B2",
    height: 250,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  welcomeHeader: {
    alignItems: "flex-end",
    paddingHorizontal: 22,
    paddingTop: 18,
    zIndex: 2,
  },
  welcomeContent: {
    gap: 22,
    paddingBottom: 36,
    paddingHorizontal: 22,
    paddingTop: 4,
  },
  welcomeLogoBlock: {
    alignItems: "center",
    minHeight: 220,
    justifyContent: "center",
    paddingBottom: 20,
    paddingTop: 2,
  },
  welcomeBrand: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 40,
    marginTop: 2,
    textAlign: "center",
  },
  welcomeTagline: {
    color: "rgba(236,254,255,0.92)",
    fontFamily: fontRegular,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 330,
    textAlign: "center",
  },
  welcomeHeroCard: {
    backgroundColor: "transparent",
    borderColor: "rgba(8,145,178,0.22)",
    borderRadius: 0,
    borderTopWidth: 1,
    gap: 11,
    paddingTop: 18,
  },
  welcomeEyebrow: {
    color: "#0891B2",
    fontFamily: fontMedium,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  welcomeTitle: {
    color: "#0F172A",
    fontFamily: fontMedium,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 33,
  },
  welcomeBody: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
  },
  welcomeFeatureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  welcomeFeatureCard: {
    backgroundColor: "transparent",
    borderColor: "rgba(8,145,178,0.22)",
    borderRadius: 0,
    borderTopWidth: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "47%",
    minHeight: 84,
    minWidth: 142,
    paddingTop: 14,
  },
  welcomeFeatureLabel: {
    color: "#0E7490",
    fontFamily: fontMedium,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18,
  },
  welcomeFeatureValue: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 7,
  },
  welcomeActionCard: {
    backgroundColor: "transparent",
    borderColor: "rgba(8,145,178,0.22)",
    borderRadius: 0,
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 18,
  },
  welcomePrimaryButton: {
    alignItems: "center",
    backgroundColor: "#0891B2",
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 18,
  },
  welcomePrimaryButtonText: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
    textAlign: "center",
  },
  welcomeSecondaryButton: {
    alignItems: "center",
    backgroundColor: "rgba(207,250,254,0.34)",
    borderColor: "rgba(8,145,178,0.24)",
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 18,
  },
  welcomeSecondaryButtonText: {
    color: "#0E7490",
    fontFamily: fontMedium,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
    textAlign: "center",
  },
  welcomePrivacyNote: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    paddingHorizontal: 4,
    textAlign: "center",
  },
  googleButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(15,23,42,0.10)",
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 14,
    ...softShadow,
  },
  googleButtonInner: {
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  googleMark: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(15,23,42,0.10)",
    borderRadius: 17,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    position: "relative",
    width: 34,
  },
  googleMarkBlue: {
    color: "#4285F4",
    fontFamily: fontMedium,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
  },
  googleDot: {
    borderRadius: 3,
    height: 6,
    position: "absolute",
    width: 6,
  },
  googleDotRed: {
    backgroundColor: "#EA4335",
    right: 6,
    top: 5,
  },
  googleDotYellow: {
    backgroundColor: "#FBBC05",
    bottom: 5,
    right: 6,
  },
  googleDotGreen: {
    backgroundColor: "#34A853",
    bottom: 5,
    left: 6,
  },
  googleButtonCopy: {
    flex: 1,
    minWidth: 0,
  },
  googleButtonText: {
    color: "#0F172A",
    fontFamily: fontMedium,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  googleButtonSubtitle: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: 1,
  },
  app: {
    flex: 1,
    backgroundColor: "#EAFBFF",
    overflow: "hidden",
  },
  backgroundTopWash: {
    backgroundColor: "#0E7490",
    height: 132,
    left: 0,
    opacity: 1,
    position: "absolute",
    right: 0,
    top: 0,
  },
  header: {
    alignItems: "flex-start",
    backgroundColor: "transparent",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 14,
  },
  logoSmallFrame: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: "transparent",
    borderRadius: 18,
    borderWidth: 0,
    justifyContent: "center",
    height: 52,
    width: 52,
    ...softShadow,
  },
  logoSmallImage: {
    height: 46,
    width: 46,
  },
  logoLargeFrame: {
    alignItems: "center",
    backgroundColor: "transparent",
    justifyContent: "center",
    height: 104,
    width: 138,
  },
  logoLargeImage: {
    height: 104,
    width: 138,
  },
  pageLogoWrap: {
    alignItems: "center",
    backgroundColor: "transparent",
    marginBottom: 18,
    marginTop: -4,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  brand: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 30,
  },
  subtitle: {
    color: "rgba(207,250,254,0.88)",
    fontFamily: fontRegular,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 1,
  },
  statusPill: {
    backgroundColor: "rgba(14,116,144,0.94)",
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 0,
    flexShrink: 0,
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...softShadow,
  },
  statusText: {
    color: "#CFFAFE",
    fontFamily: fontMedium,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  languageIconButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 0,
    flexShrink: 0,
    justifyContent: "center",
    minHeight: 42,
    minWidth: 42,
    paddingHorizontal: 8,
    ...softShadow,
  },
  languageIcon: {
    color: "#0E7490",
    fontFamily: fontMedium,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 15,
  },
  languageIconText: {
    color: "#0E7490",
    fontFamily: fontMedium,
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 14,
  },
  content: {
    paddingHorizontal: 22,
    paddingBottom: 136,
    paddingTop: 4,
  },
  pageIntro: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    marginBottom: 18,
    overflow: "visible",
    paddingHorizontal: 2,
    paddingTop: 10,
    paddingBottom: 0,
  },
  eyebrow: {
    color: "#0891B2",
    fontFamily: fontMedium,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: "#0F4F64",
    fontFamily: fontMedium,
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 36,
    marginTop: 7,
    marginBottom: 8,
  },
  stack: {
    gap: 16,
  },
  homeHero: {
    backgroundColor: "#0E7490",
    borderRadius: 30,
    gap: 18,
    paddingHorizontal: 20,
    paddingVertical: 22,
    ...softShadow,
  },
  homeHeroHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  homeEyebrow: {
    color: "#CFFAFE",
    fontFamily: fontMedium,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  homeHeroAmount: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40,
    marginTop: 4,
  },
  homeStatusBadge: {
    borderColor: "rgba(207,250,254,0.48)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  homeStatusBadgePaid: {
    backgroundColor: "rgba(207,250,254,0.16)",
  },
  homeStatusText: {
    color: "#CFFAFE",
    fontFamily: fontMedium,
    fontSize: 11,
    fontWeight: "900",
  },
  homeDetails: {
    borderTopColor: "rgba(207,250,254,0.24)",
    borderTopWidth: 1,
    gap: 10,
    paddingTop: 14,
  },
  homeDetailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  homeDetailLabel: {
    color: "rgba(207,250,254,0.78)",
    fontFamily: fontRegular,
    fontSize: 12,
    fontWeight: "700",
  },
  homeDetailValue: {
    color: "#FFFFFF",
    flexShrink: 1,
    fontFamily: fontMedium,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
  },
  homeIbanButton: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
    minWidth: 0,
  },
  homeIbanText: {
    color: "#CFFAFE",
    flexShrink: 1,
    fontFamily: Platform.select({ android: "monospace", ios: "Menlo", default: "monospace" }),
    fontSize: 11,
    fontWeight: "800",
  },
  homeIbanCopy: {
    color: "#A5F3FC",
    fontFamily: fontMedium,
    fontSize: 10,
    fontWeight: "900",
  },
  homeIbanInput: {
    backgroundColor: "rgba(15,23,42,0.18)",
    borderColor: "rgba(207,250,254,0.24)",
    borderRadius: 16,
    borderWidth: 1,
    color: "#FFFFFF",
    fontFamily: Platform.select({ android: "monospace", ios: "Menlo", default: "monospace" }),
    fontSize: 13,
    fontWeight: "800",
    minHeight: 46,
    paddingHorizontal: 12,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null),
  },
  homeActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  homePrimaryAction: {
    alignItems: "center",
    backgroundColor: "#06B6D4",
    borderRadius: 16,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  homeSecondaryAction: {
    backgroundColor: "rgba(15,23,42,0.34)",
  },
  homePrimaryActionText: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  homeGhostAction: {
    alignItems: "center",
    borderColor: "rgba(207,250,254,0.38)",
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  homeGhostActionText: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
  },
  homeSection: {
    borderTopColor: "rgba(8,145,178,0.22)",
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 18,
  },
  homeSectionTitle: {
    color: "#0F4F64",
    flexShrink: 1,
    fontFamily: fontMedium,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
  },
  homeSectionText: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  homeQuickAction: {
    borderColor: "rgba(8,145,178,0.22)",
    borderRadius: 0,
    borderTopWidth: 1,
    flex: 1,
    minHeight: 96,
    paddingTop: 14,
  },
  geminiHeroCard: {
    backgroundColor: "#0E7490",
    borderRadius: 28,
    gap: 14,
    padding: 20,
    ...softShadow,
  },
  geminiHeroKicker: {
    color: "#CFFAFE",
    fontFamily: fontMedium,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  geminiHeroAmount: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 38,
    marginTop: 2,
  },
  geminiPaymentBadge: {
    backgroundColor: "rgba(207,250,254,0.18)",
    borderColor: "rgba(207,250,254,0.56)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  geminiPaymentBadgePaid: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#34D399",
  },
  geminiPaymentBadgeText: {
    color: "#CFFAFE",
    fontFamily: fontMedium,
    fontSize: 11,
    fontWeight: "900",
  },
  ibanPanel: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    borderWidth: 1,
    gap: 9,
    padding: 12,
  },
  detailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  detailLabel: {
    color: "rgba(207,250,254,0.78)",
    fontFamily: fontRegular,
    fontSize: 11,
    fontWeight: "700",
  },
  detailValueLight: {
    color: "#FFFFFF",
    flexShrink: 1,
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right",
  },
  ibanCopyButton: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "flex-end",
    minWidth: 0,
  },
  ibanText: {
    color: "#CFFAFE",
    flexShrink: 1,
    fontFamily: Platform.select({ android: "monospace", ios: "Menlo", default: "monospace" }),
    fontSize: 11,
    fontWeight: "800",
  },
  ibanCopyText: {
    color: "#A5F3FC",
    fontFamily: fontMedium,
    fontSize: 10,
    fontWeight: "900",
  },
  heroActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryHeroButton: {
    alignItems: "center",
    backgroundColor: "#0891B2",
    borderRadius: 14,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 12,
  },
  secondaryHeroButton: {
    backgroundColor: "#334155",
  },
  primaryHeroButtonText: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
  },
  messageHeroButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  messageHeroButtonText: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
  },
  toastInline: {
    backgroundColor: "#0F172A",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  toastInlineText: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  quickGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickCard: {
    backgroundColor: "rgba(207,250,254,0.34)",
    borderColor: "rgba(8,145,178,0.18)",
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    padding: 15,
    ...softShadow,
  },
  quickIcon: {
    color: "#0891B2",
    fontFamily: fontMedium,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
  },
  quickTitle: {
    color: "#172033",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
  },
  quickText: {
    color: "#64748B",
    fontFamily: fontRegular,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: 4,
  },
  geminiCard: {
    backgroundColor: "transparent",
    borderColor: "rgba(8,145,178,0.22)",
    borderRadius: 0,
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 18,
  },
  cardHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  geminiSectionTitle: {
    color: "#172033",
    flexShrink: 1,
    fontFamily: fontMedium,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19,
  },
  cardMeta: {
    color: "#94A3B8",
    fontFamily: fontMedium,
    fontSize: 10,
    fontWeight: "800",
  },
  reportButton: {
    alignItems: "center",
    backgroundColor: "#CFFAFE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reportButtonText: {
    color: "#0E7490",
    fontFamily: fontMedium,
    fontSize: 10,
    fontWeight: "900",
  },
  clearSmallButton: {
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearSmallButtonText: {
    color: "#991B1B",
    fontFamily: fontMedium,
    fontSize: 10,
    fontWeight: "900",
  },
  paymentToggleRow: {
    flexDirection: "row",
    gap: 8,
  },
  paymentToggleButton: {
    alignItems: "center",
    backgroundColor: "rgba(6,182,212,0.10)",
    borderColor: "rgba(8,145,178,0.18)",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  paymentToggleButtonActive: {
    backgroundColor: "rgba(8,145,178,0.18)",
    borderColor: "#0891B2",
  },
  paymentToggleText: {
    color: "#334155",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
  },
  paymentHistoryRow: {
    alignItems: "center",
    backgroundColor: "rgba(6,182,212,0.10)",
    borderColor: "rgba(8,145,178,0.16)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },
  paymentMonth: {
    color: "#334155",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "800",
  },
  paymentHistoryRight: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  paymentAmount: {
    color: "#0F172A",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
  },
  paymentStatus: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paymentStatusPaid: {
    backgroundColor: "rgba(8,145,178,0.18)",
  },
  paymentStatusPending: {
    backgroundColor: "rgba(6,182,212,0.10)",
  },
  paymentStatusText: {
    color: "#334155",
    fontFamily: fontMedium,
    fontSize: 10,
    fontWeight: "900",
  },
  legalBullet: {
    alignItems: "flex-start",
    backgroundColor: "rgba(6,182,212,0.10)",
    borderColor: "rgba(8,145,178,0.16)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 11,
  },
  legalBulletNumber: {
    alignItems: "center",
    backgroundColor: "#CFFAFE",
    borderRadius: 999,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  legalBulletNumberText: {
    color: "#0E7490",
    fontFamily: fontMedium,
    fontSize: 11,
    fontWeight: "900",
  },
  legalBulletCopy: {
    flex: 1,
    gap: 3,
  },
  legalBulletTitle: {
    color: "#172033",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
  },
  legalBulletBody: {
    color: "#64748B",
    fontFamily: fontRegular,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },
  aiBanner: {
    alignItems: "center",
    backgroundColor: "#0E7490",
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    ...softShadow,
  },
  aiBannerTitle: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 13,
    fontWeight: "900",
  },
  aiBannerText: {
    color: "#CFFAFE",
    fontFamily: fontRegular,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  aiBannerArrow: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 32,
    fontWeight: "600",
  },
  geminiMuted: {
    color: "#64748B",
    fontFamily: fontRegular,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  labeledInputWrap: {
    gap: 6,
  },
  geminiInputLabel: {
    color: "#334155",
    fontFamily: fontMedium,
    fontSize: 11,
    fontWeight: "900",
  },
  geminiInput: {
    backgroundColor: "rgba(6,182,212,0.10)",
    borderColor: "rgba(8,145,178,0.16)",
    borderRadius: 14,
    borderWidth: 1,
    color: "#172033",
    fontFamily: fontMedium,
    fontSize: 13,
    fontWeight: "800",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  saveSmallButton: {
    alignItems: "center",
    backgroundColor: "rgba(8,145,178,0.14)",
    borderRadius: 14,
    paddingVertical: 11,
  },
  saveSmallButtonText: {
    color: "#0E7490",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
  },
  resultCard: {
    backgroundColor: "#0F172A",
    borderColor: "#1E293B",
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16,
    ...softShadow,
  },
  resultLine: {
    borderBottomColor: "#1E293B",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  resultLineLabel: {
    color: "#94A3B8",
    fontFamily: fontRegular,
    fontSize: 12,
    fontWeight: "700",
  },
  resultLineValue: {
    color: "#67E8F9",
    fontFamily: fontMedium,
    fontSize: 13,
    fontWeight: "900",
  },
  resultKicker: {
    color: "#34D399",
    fontFamily: fontMedium,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  resultAmount: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 30,
    fontWeight: "900",
  },
  resultNote: {
    color: "#94A3B8",
    fontFamily: fontRegular,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
  },
  resultButton: {
    alignItems: "center",
    backgroundColor: "#0891B2",
    borderRadius: 14,
    paddingVertical: 12,
  },
  resultButtonText: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  wizardQuestion: {
    backgroundColor: "rgba(6,182,212,0.10)",
    borderColor: "rgba(8,145,178,0.16)",
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  wizardQuestionText: {
    color: "#172033",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 17,
  },
  wizardButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  wizardButton: {
    alignItems: "center",
    backgroundColor: "rgba(207,250,254,0.34)",
    borderColor: "rgba(8,145,178,0.14)",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  wizardButtonActive: {
    borderColor: "#0891B2",
    backgroundColor: "rgba(8,145,178,0.18)",
  },
  wizardButtonText: {
    color: "#334155",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
  },
  wizardResult: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderRadius: 16,
    borderWidth: 1,
    gap: 5,
    padding: 13,
  },
  wizardResultTitle: {
    color: "#166534",
    fontFamily: fontMedium,
    fontSize: 13,
    fontWeight: "900",
  },
  wizardResultBody: {
    color: "#166534",
    fontFamily: fontRegular,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 17,
  },
  noticeButton: {
    alignItems: "center",
    backgroundColor: "#0891B2",
    borderRadius: 18,
    paddingVertical: 14,
  },
  noticeButtonText: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  inspectionRow: {
    alignItems: "center",
    backgroundColor: "rgba(207,250,254,0.34)",
    borderColor: "rgba(8,145,178,0.16)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    padding: 13,
    ...softShadow,
  },
  inspectionCopy: {
    flex: 1,
    gap: 5,
  },
  inspectionRoom: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(6,182,212,0.10)",
    borderRadius: 999,
    color: "#334155",
    fontFamily: fontMedium,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  inspectionDesc: {
    color: "#172033",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 17,
  },
  inspectionAttachmentText: {
    color: "#64748B",
    fontFamily: fontRegular,
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 15,
  },
  attachmentList: {
    gap: 6,
  },
  attachmentPill: {
    backgroundColor: "rgba(6,182,212,0.10)",
    borderColor: "rgba(8,145,178,0.16)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  attachmentText: {
    color: "#334155",
    fontFamily: fontMedium,
    fontSize: 11,
    fontWeight: "800",
  },
  heroCard: {
    backgroundColor: "rgba(207,250,254,0.34)",
    borderColor: "rgba(8,145,178,0.16)",
    borderWidth: 1,
    borderRadius: 30,
    gap: 16,
    overflow: "hidden",
    padding: 20,
    ...glassShadow,
  },
  heroBadgeRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  heroKicker: {
    color: "#0891B2",
    fontFamily: fontMedium,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  paymentBadge: {
    backgroundColor: "rgba(6,182,212,0.14)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  paymentBadgePaid: {
    backgroundColor: "rgba(8,145,178,0.18)",
  },
  paymentBadgeText: {
    color: "#0E7490",
    fontFamily: fontMedium,
    fontSize: 11,
    fontWeight: "900",
  },
  paymentBadgeTextPaid: {
    color: "#0E7490",
  },
  heroTitle: {
    color: "#0F172A",
    fontFamily: fontMedium,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 32,
  },
  heroStatRow: {
    flexDirection: "row",
    gap: 10,
  },
  heroStat: {
    backgroundColor: "rgba(207,250,254,0.42)",
    borderRadius: 20,
    flex: 1,
    padding: 12,
  },
  heroStatLabel: {
    color: "#0891B2",
    fontFamily: fontMedium,
    fontSize: 11,
    fontWeight: "800",
  },
  heroStatValue: {
    color: "#0F172A",
    fontFamily: fontMedium,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 6,
  },
  heroButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  heroActionButton: {
    alignItems: "center",
    backgroundColor: "#06B6D4",
    borderRadius: 18,
    flex: 1,
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  heroActionButtonMuted: {
    backgroundColor: "rgba(8,145,178,0.48)",
  },
  heroActionButtonText: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 13,
    fontWeight: "900",
  },
  copyStateText: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  heroCopyStateText: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  summaryCard: {
    alignItems: "flex-start",
    backgroundColor: "transparent",
    borderColor: "rgba(8,145,178,0.22)",
    borderRadius: 0,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 14,
    paddingTop: 16,
  },
  summaryAccent: {
    alignItems: "center",
    backgroundColor: "rgba(8,145,178,0.14)",
    borderRadius: 16,
    height: 44,
    justifyContent: "center",
    marginTop: 2,
    width: 44,
  },
  summaryAccentText: {
    color: "#0891B2",
    fontFamily: fontMedium,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 28,
  },
  cardCopy: {
    flex: 1,
  },
  cardLabel: {
    color: "#0E7490",
    fontFamily: fontMedium,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 9,
    textTransform: "uppercase",
  },
  cardValue: {
    color: "#0F172A",
    fontFamily: fontRegular,
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 27,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metric: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "47%",
    minHeight: 72,
    minWidth: 142,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  metricLabel: {
    color: "#0E7490",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "700",
  },
  metricValue: {
    color: "#0F172A",
    fontFamily: fontMedium,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
    marginTop: 12,
  },
  placeholderLine: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  placeholderText: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 15,
    fontWeight: "700",
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionHeaderRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#0F172A",
    fontFamily: fontMedium,
    fontSize: 20,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 3,
  },
  checklistCard: {
    backgroundColor: "transparent",
    borderColor: "rgba(8,145,178,0.22)",
    borderRadius: 0,
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 16,
  },
  toolCard: {
    backgroundColor: "transparent",
    borderColor: "rgba(8,145,178,0.22)",
    borderRadius: 0,
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 16,
  },
  resultPanel: {
    backgroundColor: "rgba(207,250,254,0.28)",
    borderRadius: 22,
    gap: 6,
    padding: 14,
  },
  resultLabel: {
    color: "#0891B2",
    fontFamily: fontMedium,
    fontSize: 15,
    fontWeight: "900",
  },
  resultText: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
  },
  checklistList: {
    gap: 10,
  },
  checklistRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 58,
    paddingVertical: 3,
  },
  checklistDot: {
    alignItems: "center",
    borderRadius: 14,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  checklistDotComplete: {
    backgroundColor: "rgba(207,250,254,0.30)",
  },
  checklistDotPending: {
    backgroundColor: "rgba(6,182,212,0.14)",
  },
  checklistDotText: {
    color: "#0891B2",
    fontSize: 10,
    fontWeight: "900",
  },
  checklistTextWrap: {
    flex: 1,
  },
  checklistLabel: {
    color: "#0F172A",
    fontFamily: fontMedium,
    fontSize: 14,
    fontWeight: "900",
  },
  checklistHelper: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 3,
  },
  checklistActionText: {
    color: "#0891B2",
    flexShrink: 0,
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
  },
  iconTextButton: {
    alignItems: "center",
    backgroundColor: "#0891B2",
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 12,
    ...softShadow,
  },
  iconTextButtonText: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 13,
    fontWeight: "900",
  },
  listingCard: {
    backgroundColor: "transparent",
    borderColor: "rgba(8,145,178,0.22)",
    borderRadius: 0,
    borderTopWidth: 1,
    gap: 10,
    paddingTop: 14,
  },
  listingHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  listingTitleWrap: {
    flex: 1,
  },
  listingTitle: {
    color: "#0F172A",
    fontFamily: fontMedium,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
  },
  listingLocation: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 3,
  },
  marketBadge: {
    backgroundColor: "transparent",
    borderRadius: 0,
    flexShrink: 1,
    maxWidth: 132,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  marketBadgeText: {
    color: "#0891B2",
    fontFamily: fontMedium,
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  listingStats: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  listingRent: {
    color: "#0891B2",
    fontFamily: fontMedium,
    fontSize: 19,
    fontWeight: "900",
  },
  listingMeta: {
    color: "#0E7490",
    fontFamily: fontMedium,
    fontSize: 13,
    fontWeight: "800",
  },
  listingBody: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  listingSource: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  uploadPanel: {
    backgroundColor: "transparent",
    borderColor: "rgba(8,145,178,0.22)",
    borderRadius: 0,
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 16,
  },
  uploadTitle: {
    color: "#0F172A",
    fontFamily: fontMedium,
    fontSize: 20,
    fontWeight: "900",
  },
  uploadSubtitle: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  uploadTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  uploadTypeChip: {
    alignItems: "center",
    backgroundColor: "rgba(6,182,212,0.10)",
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 0,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 10,
  },
  uploadTypeChipActive: {
    backgroundColor: "#0891B2",
    borderColor: "#0891B2",
  },
  uploadTypeChipText: {
    color: "#0E7490",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
  },
  uploadTypeChipTextActive: {
    color: "#FFFFFF",
  },
  evidenceNoteInput: {
    backgroundColor: "rgba(6,182,212,0.10)",
    borderColor: "transparent",
    borderRadius: 20,
    borderWidth: 0,
    color: "#0F172A",
    fontFamily: fontRegular,
    fontSize: 14,
    minHeight: 72,
    paddingHorizontal: 12,
    paddingTop: 10,
    textAlignVertical: "top",
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null),
  },
  uploadButtonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  inlineLoading: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  inlineLoadingText: {
    color: "#0E7490",
    fontFamily: fontMedium,
    fontSize: 13,
    fontWeight: "800",
  },
  successText: {
    color: "#0891B2",
    fontFamily: fontMedium,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  evidenceCard: {
    backgroundColor: "transparent",
    borderColor: "rgba(8,145,178,0.22)",
    borderRadius: 0,
    borderTopWidth: 1,
    gap: 10,
    paddingTop: 14,
  },
  evidenceHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  evidenceTitleWrap: {
    flex: 1,
  },
  evidenceTitle: {
    color: "#0F172A",
    fontFamily: fontMedium,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
  },
  evidenceMeta: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 3,
  },
  evidenceBadge: {
    backgroundColor: "transparent",
    borderRadius: 0,
    flexShrink: 1,
    maxWidth: 132,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  evidenceBadgeText: {
    color: "#0891B2",
    fontFamily: fontMedium,
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  evidenceSummary: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
  },
  evidenceFooter: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  editEvidencePanel: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    gap: 10,
    padding: 12,
  },
  contractInsightCard: {
    backgroundColor: "transparent",
    borderColor: "rgba(8,145,178,0.22)",
    borderRadius: 0,
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 16,
  },
  contractInsightText: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  contractInsightMuted: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  contractFieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  contractField: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "47%",
    minHeight: 74,
    minWidth: 142,
    padding: 10,
  },
  contractFieldLabel: {
    color: "#0891B2",
    fontFamily: fontMedium,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  contractFieldValue: {
    color: "#0F172A",
    fontFamily: fontRegular,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  contractList: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    gap: 7,
    padding: 12,
  },
  contractListTitle: {
    color: "#0891B2",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  contractListItem: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  cardActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  compactButton: {
    alignItems: "center",
    backgroundColor: "#0891B2",
    borderRadius: 18,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 40,
    minWidth: 92,
    paddingHorizontal: 10,
  },
  compactButtonText: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
  },
  compactDangerButton: {
    alignItems: "center",
    backgroundColor: "#FFF0EF",
    borderColor: "#F1B8B3",
    borderRadius: 18,
    borderWidth: 0,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 40,
    minWidth: 92,
    paddingHorizontal: 10,
  },
  compactDangerButtonText: {
    color: "#8A261F",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
  },
  inlineErrorCard: {
    backgroundColor: "#FFF0EF",
    borderColor: "#F1B8B3",
    borderRadius: 20,
    borderWidth: 0,
    padding: 10,
  },
  inlineErrorText: {
    color: "#8A261F",
    fontFamily: fontRegular,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  formCard: {
    backgroundColor: "transparent",
    borderColor: "rgba(8,145,178,0.22)",
    borderRadius: 0,
    borderTopWidth: 1,
    paddingTop: 16,
  },
  preferenceCard: {
    backgroundColor: "transparent",
    borderColor: "rgba(8,145,178,0.22)",
    borderRadius: 0,
    borderTopWidth: 1,
    paddingTop: 16,
  },
  segmentedControl: {
    backgroundColor: "rgba(6,182,212,0.14)",
    borderRadius: 22,
    flexDirection: "row",
    gap: 6,
    padding: 4,
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: 18,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
  },
  segmentButtonActive: {
    backgroundColor: "#0891B2",
  },
  segmentButtonText: {
    color: "#0E7490",
    fontFamily: fontMedium,
    fontSize: 13,
    fontWeight: "900",
  },
  segmentButtonTextActive: {
    color: "#FFFFFF",
  },
  preferenceNote: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 10,
  },
  infoCard: {
    backgroundColor: "transparent",
    borderColor: "rgba(8,145,178,0.22)",
    borderRadius: 0,
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 16,
  },
  billingStatusCard: {
    backgroundColor: "rgba(207,250,254,0.28)",
    borderRadius: 22,
    gap: 5,
    padding: 14,
  },
  billingPlanName: {
    color: "#0F172A",
    fontFamily: fontMedium,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 29,
  },
  planGrid: {
    gap: 12,
  },
  planCard: {
    backgroundColor: "transparent",
    borderColor: "rgba(8,145,178,0.22)",
    borderRadius: 0,
    borderTopWidth: 1,
    gap: 11,
    paddingTop: 14,
  },
  planCardActive: {
    borderColor: "rgba(6,182,212,0.55)",
  },
  planCardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  planTitle: {
    color: "#0F172A",
    flex: 1,
    fontFamily: fontMedium,
    fontSize: 17,
    fontWeight: "900",
  },
  planPrice: {
    color: "#0891B2",
    fontFamily: fontMedium,
    fontSize: 14,
    fontWeight: "900",
  },
  planLimitRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  planLimitValue: {
    color: "#0F172A",
    fontFamily: fontMedium,
    fontSize: 15,
    fontWeight: "900",
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    padding: 12,
  },
  infoLabel: {
    color: "#0F172A",
    fontFamily: fontMedium,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 5,
  },
  infoText: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  inputLabel: {
    color: "#0E7490",
    fontFamily: fontMedium,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "rgba(6,182,212,0.10)",
    borderColor: "transparent",
    borderRadius: 18,
    borderWidth: 0,
    color: "#0F172A",
    fontFamily: fontRegular,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null),
  },
  largeTextArea: {
    minHeight: 132,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  authMessage: {
    color: "#0891B2",
    fontFamily: fontRegular,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 10,
  },
  helperText: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
  },
  centerNote: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
  promptRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  promptChip: {
    backgroundColor: "rgba(6,182,212,0.10)",
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  promptChipText: {
    color: "#0E7490",
    fontFamily: fontMedium,
    fontSize: 13,
    fontWeight: "800",
  },
  chatList: {
    gap: 10,
  },
  emptyChat: {
    backgroundColor: "transparent",
    borderColor: "rgba(8,145,178,0.22)",
    borderRadius: 0,
    borderTopWidth: 1,
    paddingTop: 16,
  },
  emptyChatTitle: {
    color: "#0F172A",
    fontFamily: fontMedium,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  emptyChatText: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
  },
  chatBubble: {
    borderRadius: 24,
    padding: 14,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#0891B2",
    borderRadius: 18,
    maxWidth: "88%",
    ...softShadow,
  },
  userBubbleText: {
    color: "#FFFFFF",
    fontFamily: fontRegular,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  assistantBubble: {
    alignSelf: "stretch",
    backgroundColor: "transparent",
    borderColor: "rgba(8,145,178,0.22)",
    borderTopWidth: 1,
    gap: 10,
    paddingTop: 16,
  },
  assistantBubbleText: {
    color: "#0E7490",
    fontFamily: fontRegular,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
  },
  answerTitle: {
    color: "#0F172A",
    fontFamily: fontMedium,
    fontSize: 17,
    fontWeight: "900",
  },
  answerSection: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 6,
  },
  answerSectionMuted: {
    backgroundColor: "transparent",
  },
  answerLabel: {
    color: "#0891B2",
    fontFamily: fontMedium,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  errorCard: {
    backgroundColor: "#FFF0EF",
    borderColor: "#F1B8B3",
    borderRadius: 20,
    borderWidth: 0,
    padding: 14,
  },
  errorTitle: {
    color: "#8A261F",
    fontFamily: fontMedium,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 6,
  },
  errorText: {
    color: "#8A261F",
    fontFamily: fontRegular,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  fatalErrorCard: {
    backgroundColor: "#FFF0EF",
    borderColor: "#F1B8B3",
    borderRadius: 20,
    borderWidth: 0,
    margin: 20,
    padding: 16,
  },
  composerCard: {
    backgroundColor: "transparent",
    borderColor: "rgba(8,145,178,0.22)",
    borderRadius: 0,
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 16,
  },
  messageInput: {
    backgroundColor: "rgba(6,182,212,0.10)",
    borderColor: "transparent",
    borderRadius: 22,
    borderWidth: 0,
    color: "#0F172A",
    fontFamily: fontRegular,
    fontSize: 15,
    minHeight: 96,
    paddingHorizontal: 12,
    paddingTop: 12,
    textAlignVertical: "top",
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null),
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#0891B2",
    borderRadius: 18,
    flex: 1,
    flexBasis: 130,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 14,
    fontWeight: "900",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#0891B2",
    borderRadius: 18,
    flex: 1,
    flexBasis: 130,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontFamily: fontMedium,
    fontSize: 14,
    fontWeight: "900",
  },
  textOnlyButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    marginTop: 10,
  },
  textOnlyButtonText: {
    color: "#0891B2",
    fontFamily: fontMedium,
    fontSize: 13,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.6,
  },
  tabBar: {
    backgroundColor: "rgba(207,250,254,0.72)",
    borderTopColor: "rgba(255,255,255,0.22)",
    borderTopWidth: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 6,
    left: 0,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 16,
    position: "absolute",
    right: 0,
    ...glassShadow,
  },
  tabButton: {
    alignItems: "center",
    borderRadius: 20,
    flex: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 3,
  },
  tabButtonActive: {
    backgroundColor: "#0891B2",
    ...softShadow,
  },
  tabSymbol: {
    color: "#0E7490",
    fontFamily: fontMedium,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 16,
    marginBottom: 3,
  },
  tabSymbolActive: {
    color: "#FFFFFF",
  },
  tabLabel: {
    color: "#0E7490",
    fontFamily: fontMedium,
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 13,
    textAlign: "center",
  },
  tabLabelActive: {
    color: "#FFFFFF",
  },
});



