import { useEffect, useState } from "react";
import { useTenant } from "./useTenant";
import { supabase } from "@/integrations/supabase/client";

export type Feature =
  | "advanced_reports"
  | "unlimited_users"
  | "unlimited_clients"
  | "multi_store"
  | "priority_support";

// Feature matrix per plan
const FEATURES: Record<string, Feature[]> = {
  free: [],
  starter: [],
  trial: [
    "advanced_reports",
    "unlimited_users",
    "unlimited_clients",
  ],
  pro: [
    "advanced_reports",
    "unlimited_users",
    "unlimited_clients",
  ],
  business: [
    "advanced_reports",
    "unlimited_users",
    "unlimited_clients",
    "multi_store",
    "priority_support",
  ],
};

export const PLAN_LIMITS = {
  free: { users: 1, clients: 50 },
  starter: { users: 1, clients: 50 },
  trial: { users: Infinity, clients: Infinity },
  pro: { users: Infinity, clients: Infinity },
  business: { users: Infinity, clients: Infinity },
} as const;

export function useFeatureGate(feature: Feature) {
  const { plano, status, isSuperAdmin } = useTenant();
  if (isSuperAdmin) {
    return { allowed: true, plan: "super_admin", reason: null };
  }
  // During trial, unlock pro features
  const effective = status === "trialing" ? "trial" : plano ?? "free";
  const allowed = (FEATURES[effective] ?? []).includes(feature);
  return {
    allowed,
    plan: effective,
    reason: allowed
      ? null
      : `Este recurso está disponível a partir do plano ${
          feature === "multi_store" ? "Business" : "Pro"
        }.`,
  };
}

export function usePlanLimits() {
  const { plano, status, tenantId } = useTenant();
  const effective = (status === "trialing" ? "trial" : plano ?? "free") as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[effective] ?? PLAN_LIMITS.free;
  const [usage, setUsage] = useState<{ users: number; clients: number }>({
    users: 0,
    clients: 0,
  });

  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      const [{ count: members }, { count: clients }] = await Promise.all([
        supabase
          .from("tenant_members")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId),
        supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId),
      ]);
      setUsage({ users: members ?? 0, clients: clients ?? 0 });
    })();
  }, [tenantId]);

  return {
    plan: effective,
    limits,
    usage,
    canAddUser: usage.users < limits.users,
    canAddClient: usage.clients < limits.clients,
  };
}
