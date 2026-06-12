import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { AppRole } from "./useUserRole";

export interface Tenant {
  id: string;
  nome: string;
  owner_id: string;
  plano: string;
  status: string;
  trial_ends_at: string;
  subscription_id: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_end: string | null;
  onboarded: boolean;
}

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export function useTenant() {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tenant-context", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: members } = await supabase
        .from("tenant_members")
        .select("tenant_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (!members || members.length === 0) return { tenant: null, roles: [] as AppRole[] };

      const activeId =
        (profile?.active_tenant_id && members.some((m: any) => m.tenant_id === profile.active_tenant_id)
          ? profile.active_tenant_id
          : members[0].tenant_id) as string;

      const [{ data: tenant }, { data: rolesRows }] = await Promise.all([
        supabase.from("tenants").select("*").eq("id", activeId).maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("tenant_id", activeId),
      ]);

      return {
        tenant: (tenant as Tenant | null) ?? null,
        roles: (rolesRows ?? []).map((r: any) => r.role as AppRole),
      };
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const tenant = data?.tenant ?? null;
  const roles = data?.roles ?? [];

  const role: AppRole | null = roles.includes("admin")
    ? "admin"
    : roles.includes("tecnico")
    ? "tecnico"
    : roles.includes("vendedor")
    ? "vendedor"
    : null;

  const trialEnd = tenant?.trial_ends_at ? new Date(tenant.trial_ends_at) : null;
  const trialDaysRemaining = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86_400_000))
    : 0;
  const trialExpired = !!trialEnd && trialEnd.getTime() < Date.now();

  const status = tenant?.status ?? null;
  const plano = tenant?.plano ?? null;

  // Access is blocked when:
  // - status is canceled / unpaid / past_due / incomplete_expired
  // - status is trialing but trial already expired and no paid subscription
  let isAccessBlocked = false;
  if (tenant) {
    if (status && !ACTIVE_STATUSES.has(status)) {
      isAccessBlocked = true;
    } else if (status === "trialing" && trialExpired) {
      isAccessBlocked = true;
    }
  }

  return {
    tenant,
    tenantId: tenant?.id ?? null,
    role,
    roles,
    plano,
    status,
    trialDaysRemaining,
    trialExpired,
    isAccessBlocked,
    onboarded: tenant?.onboarded ?? false,
    isOwner: !!tenant && tenant.owner_id === user?.id,
    loading: isLoading,
    refetch,
  };
}
