import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useTenant } from "./useTenant";
import { toast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface Repair {
  id: string;
  client_id: string | null;
  client_name: string;
  device: string;
  problem: string;
  status: string;
  value: number | null;
  technician_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
  delivered_at: string | null;
}

export interface RepairInput {
  client_id?: string;
  client_name: string;
  device: string;
  problem: string;
  notes?: string;
  technician_id?: string;
}

export function useRepairs() {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const { data: repairs = [], isLoading: loading } = useQuery({
    queryKey: ["repairs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repairs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["repairs"] });

  const addRepair = async (input: RepairInput) => {
    if (!user) {
      toast({ title: "Você precisa estar logado", variant: "destructive" });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("repairs")
        .insert({
          client_id: input.client_id || null,
          client_name: input.client_name,
          device: input.device,
          problem: input.problem,
          notes: input.notes || null,
          technician_id: input.technician_id || user.id,
          created_by: user.id,
          status: "pendente",
        })
        .select()
        .single();

      if (error) throw error;
      invalidate();
      toast({ title: "Conserto registrado!" });
      return data;
    } catch (error: any) {
      console.error("Error adding repair:", error);
      toast({ title: "Erro ao registrar conserto", variant: "destructive" });
      return null;
    }
  };

  const updateRepair = async (id: string, updates: Partial<Repair>) => {
    try {
      const { data, error } = await supabase
        .from("repairs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      invalidate();
      toast({ title: "Conserto atualizado!" });
      return data;
    } catch (error: any) {
      console.error("Error updating repair:", error);
      toast({ title: "Erro ao atualizar conserto", variant: "destructive" });
      return null;
    }
  };

  const startRepair = async (id: string) => updateRepair(id, { status: "em_andamento" });

  const finishRepair = async (id: string, value: number) => {
    return updateRepair(id, { status: "pronto", value, finished_at: new Date().toISOString() });
  };

  const deliverRepair = async (id: string) => updateRepair(id, { status: "entregue", delivered_at: new Date().toISOString() });

  const deleteRepair = async (id: string) => {
    try {
      const { error } = await supabase.from("repairs").delete().eq("id", id);
      if (error) throw error;
      invalidate();
      toast({ title: "Conserto removido" });
      return true;
    } catch (error: any) {
      console.error("Error deleting repair:", error);
      toast({ title: "Erro ao remover conserto", variant: "destructive" });
      return false;
    }
  };

  return {
    repairs,
    loading,
    addRepair,
    updateRepair,
    startRepair,
    finishRepair,
    deliverRepair,
    deleteRepair,
    refetch: invalidate,
  };
}
