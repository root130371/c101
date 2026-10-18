import { supabase } from "../lib/supabase";

export type PlanKey = "free" | "tenant_plus";

export type BillingProcessor = "apple" | "google" | "iyzico" | "manual" | "paytr";

export type UsageMetric = "chat_messages" | "contract_analyses" | "evidence_analyses";

export type BillingPlan = {
  key: PlanKey;
  monthlyUsd: number;
  limits: Record<UsageMetric, number>;
};

export type BillingEntitlement = {
  processor?: BillingProcessor | null;
  plan: BillingPlan;
  status: "active" | "free" | "past_due" | "canceled" | "unknown";
  periodEnd?: string | null;
};

export type UsageCounter = {
  limit: number;
  metric: UsageMetric;
  periodStart: string;
  remaining: number;
  used: number;
};

export type BillingUpgradeRequest = {
  createdAt: string;
  id: string;
  planKey: PlanKey;
  status: "approved" | "canceled" | "pending" | "rejected";
};

export const billingPlans: Record<PlanKey, BillingPlan> = {
  free: {
    key: "free",
    monthlyUsd: 0,
    limits: {
      chat_messages: 5,
      contract_analyses: 1,
      evidence_analyses: 2,
    },
  },
  tenant_plus: {
    key: "tenant_plus",
    monthlyUsd: 10,
    limits: {
      chat_messages: 50,
      contract_analyses: 10,
      evidence_analyses: 25,
    },
  },
};

export async function loadBillingEntitlement(userId?: string): Promise<BillingEntitlement> {
  if (!userId) {
    return { plan: billingPlans.free, status: "free" };
  }

  const { data, error } = await supabase
    .from("billing_subscriptions")
    .select("plan_key,status,processor,current_period_end")
    .eq("user_id", userId)
    .eq("plan_key", "tenant_plus")
    .in("status", ["active", "trialing"])
    .or(`current_period_end.is.null,current_period_end.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { plan: billingPlans.free, status: "unknown" };
  }

  const planKey = data?.plan_key === "tenant_plus" ? "tenant_plus" : "free";
  const status = data?.status === "active" || data?.status === "trialing"
    ? "active"
    : data?.status === "past_due"
      ? "past_due"
      : "free";

  return {
    processor: isBillingProcessor(data?.processor) ? data.processor : null,
    plan: billingPlans[planKey],
    status,
    periodEnd: data?.current_period_end ?? null,
  };
}

export async function loadUsageCounters(userId?: string): Promise<UsageCounter[]> {
  if (!userId) return [];

  const periodStarts = [
    dailyPeriodStart(),
    monthlyPeriodStart(),
  ];

  const { data, error } = await supabase
    .from("usage_counters")
    .select("metric,period_start,used_count,limit_count")
    .eq("user_id", userId)
    .in("metric", ["chat_messages", "contract_analyses", "evidence_analyses"])
    .in("period_start", periodStarts);

  if (error) return [];

  return ((data || []) as Array<{
    limit_count: number;
    metric: UsageMetric;
    period_start: string;
    used_count: number;
  }>).map((row) => ({
    limit: Number(row.limit_count || 0),
    metric: row.metric,
    periodStart: row.period_start,
    remaining: Math.max(0, Number(row.limit_count || 0) - Number(row.used_count || 0)),
    used: Number(row.used_count || 0),
  }));
}

export async function loadLatestUpgradeRequest(userId?: string): Promise<BillingUpgradeRequest | null> {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("billing_upgrade_requests")
    .select("id,plan_key,status,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    createdAt: data.created_at,
    id: data.id,
    planKey: data.plan_key === "tenant_plus" ? "tenant_plus" : "free",
    status: isUpgradeRequestStatus(data.status) ? data.status : "pending",
  };
}

export async function createBillingUpgradeRequest(planKey: PlanKey = "tenant_plus"): Promise<BillingUpgradeRequest> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    throw new Error(userError?.message || "Sign in before requesting an upgrade.");
  }

  const existing = await loadLatestUpgradeRequest(user.id);
  if (existing?.status === "pending") {
    return existing;
  }

  const { data, error } = await supabase
    .from("billing_upgrade_requests")
    .insert({
      plan_key: planKey,
      source: "app_manual",
      user_id: user.id,
    })
    .select("id,plan_key,status,created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Upgrade request could not be created.");
  }

  return {
    createdAt: data.created_at,
    id: data.id,
    planKey: "tenant_plus",
    status: isUpgradeRequestStatus(data.status) ? data.status : "pending",
  };
}

function isBillingProcessor(value: unknown): value is BillingProcessor {
  return value === "apple"
    || value === "google"
    || value === "iyzico"
    || value === "manual"
    || value === "paytr";
}

function isUpgradeRequestStatus(value: unknown): value is BillingUpgradeRequest["status"] {
  return value === "approved" || value === "canceled" || value === "pending" || value === "rejected";
}

function dailyPeriodStart() {
  return new Date().toISOString().slice(0, 10);
}

function monthlyPeriodStart() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function planName(plan: BillingPlan, language: "en" | "tr") {
  if (plan.key === "tenant_plus") {
    return language === "en" ? "Tenant Plus" : "Kiracı Plus";
  }
  return language === "en" ? "Free" : "Ücretsiz";
}

export function metricLabel(metric: UsageMetric, language: "en" | "tr") {
  const labels: Record<UsageMetric, { en: string; tr: string }> = {
    chat_messages: { en: "AI questions / day", tr: "AI soru / gün" },
    contract_analyses: { en: "Contract analyses / month", tr: "Sözleşme analizi / ay" },
    evidence_analyses: { en: "Evidence analyses / month", tr: "Kanıt analizi / ay" },
  };
  return labels[metric][language];
}

export function processorName(processor: BillingProcessor | null | undefined, language: "en" | "tr") {
  if (!processor) return language === "en" ? "Not connected" : "Bağlı değil";
  const labels: Record<BillingProcessor, { en: string; tr: string }> = {
    apple: { en: "Apple App Store", tr: "Apple App Store" },
    google: { en: "Google Play", tr: "Google Play" },
    iyzico: { en: "Website / iyzico", tr: "Web sitesi / iyzico" },
    manual: { en: "Manual admin grant", tr: "Manuel admin tanımı" },
    paytr: { en: "Website / PayTR", tr: "Web sitesi / PayTR" },
  };
  return labels[processor][language];
}
