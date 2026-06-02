import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Tenant {
  id: string;
  nome: string;
  owner_id: string;
  plano: string;
  status: string;
  trial_ends_at: string;
  subscription_id: string | null;
  current_period_end: string | null;
}

export function useTenant() {
  const { user } = useAuth();

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: member, error: memberErr } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (memberErr || !member) return null;
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", member.tenant_id)
        .maybeSingle();
      if (error) return null;
      return data as Tenant | null;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  return {
    tenant,
    tenantId: tenant?.id ?? null,
    loading: isLoading,
  };
}
