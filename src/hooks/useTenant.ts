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
  current_period_end: string | null;
  onboarded: boolean;
}

export function useTenant() {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tenant-context", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: member } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!member) return { tenant: null, roles: [] as AppRole[] };

      const [{ data: tenant }, { data: rolesRows }] = await Promise.all([
        supabase.from("tenants").select("*").eq("id", member.tenant_id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id).eq("tenant_id", member.tenant_id),
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

  const trialDaysRemaining = tenant?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / 86_400_000))
    : 0;

  return {
    tenant,
    tenantId: tenant?.id ?? null,
    role,
    roles,
    plano: tenant?.plano ?? null,
    status: tenant?.status ?? null,
    trialDaysRemaining,
    onboarded: tenant?.onboarded ?? false,
    isOwner: !!tenant && tenant.owner_id === user?.id,
    loading: isLoading,
    refetch,
  };
}
