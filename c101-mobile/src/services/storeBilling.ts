import { Platform } from "react-native";

import type { CustomerInfo, PurchasesPackage } from "react-native-purchases";

export type StoreBillingStatus = {
  active: boolean;
  available: boolean;
  packageId?: string;
  platform: "android" | "ios" | "web" | "unsupported";
  price?: string;
  reason?: string;
};

export type StorePurchaseResult = {
  active: boolean;
  canceled?: boolean;
  message?: string;
  productId?: string;
};

const entitlementId = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || "tenant_plus";

let configuredForUserId: string | null = null;

export async function loadStoreBillingStatus(userId?: string): Promise<StoreBillingStatus> {
  const ready = await ensureStoreBillingReady(userId);
  if (!ready.available) return ready;

  const Purchases = await loadPurchasesSdk();
  const [customerInfo, activePackage] = await Promise.all([
    Purchases.getCustomerInfo(),
    loadTenantPlusPackage(),
  ]);

  return {
    active: hasTenantPlusEntitlement(customerInfo),
    available: true,
    packageId: activePackage?.identifier,
    platform: platformName(),
    price: activePackage?.product.priceString,
  };
}

export async function purchaseTenantPlus(userId?: string): Promise<StorePurchaseResult> {
  const ready = await ensureStoreBillingReady(userId);
  if (!ready.available) {
    return {
      active: false,
      message: ready.reason,
    };
  }

  const Purchases = await loadPurchasesSdk();
  const tenantPackage = await loadTenantPlusPackage();
  if (!tenantPackage) {
    return {
      active: false,
      message: "Tenant Plus product is not available yet. Check RevenueCat offerings and store product setup.",
    };
  }

  try {
    const result = await Purchases.purchasePackage(tenantPackage);
    return {
      active: hasTenantPlusEntitlement(result.customerInfo),
      productId: result.productIdentifier,
    };
  } catch (error) {
    if (isPurchaseCancelled(error)) {
      return {
        active: false,
        canceled: true,
        message: "Purchase canceled.",
      };
    }
    throw error;
  }
}

export async function restoreTenantPlus(userId?: string): Promise<StorePurchaseResult> {
  const ready = await ensureStoreBillingReady(userId);
  if (!ready.available) {
    return {
      active: false,
      message: ready.reason,
    };
  }

  const Purchases = await loadPurchasesSdk();
  const customerInfo = await Purchases.restorePurchases();
  return {
    active: hasTenantPlusEntitlement(customerInfo),
  };
}

async function ensureStoreBillingReady(userId?: string): Promise<StoreBillingStatus> {
  if (!isNativeStorePlatform()) {
    return {
      active: false,
      available: false,
      platform: platformName(),
      reason: "Native app-store billing works only in an Android/iOS development or store build.",
    };
  }

  const apiKey = revenueCatApiKey();
  if (!apiKey) {
    return {
      active: false,
      available: false,
      platform: platformName(),
      reason: "RevenueCat API key is missing. Add the platform key before testing store billing.",
    };
  }

  try {
    const Purchases = await loadPurchasesSdk();
    if (configuredForUserId !== userId) {
      Purchases.configure({
        apiKey,
        appUserID: userId,
      } as any);
      configuredForUserId = userId || null;
    }
    return {
      active: false,
      available: true,
      platform: platformName(),
    };
  } catch (error) {
    return {
      active: false,
      available: false,
      platform: platformName(),
      reason: error instanceof Error ? error.message : "Store billing is not available in this build.",
    };
  }
}

async function loadTenantPlusPackage(): Promise<PurchasesPackage | null> {
  const Purchases = await loadPurchasesSdk();
  const offerings = await Purchases.getOfferings();
  const availablePackages = offerings.current?.availablePackages || [];
  return availablePackages.find((item) => item.packageType === "MONTHLY")
    || availablePackages[0]
    || null;
}

async function loadPurchasesSdk() {
  const module = await import("react-native-purchases");
  return module.default;
}

function hasTenantPlusEntitlement(customerInfo: CustomerInfo) {
  return Boolean(customerInfo.entitlements.active[entitlementId]);
}

function isNativeStorePlatform() {
  return Platform.OS === "android" || Platform.OS === "ios";
}

function platformName(): StoreBillingStatus["platform"] {
  if (Platform.OS === "android") return "android";
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "web") return "web";
  return "unsupported";
}

function revenueCatApiKey() {
  if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || "";
  }
  if (Platform.OS === "ios") {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "";
  }
  return "";
}

function isPurchaseCancelled(error: unknown) {
  const value = error as { code?: string; userCancelled?: boolean };
  return Boolean(value?.userCancelled || value?.code === "PURCHASE_CANCELLED_ERROR");
}
