import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

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
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRepairs = async () => {
    if (!user) {
      setRepairs([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("repairs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRepairs(data || []);
    } catch (error: any) {
      console.error("Error fetching repairs:", error);
      toast({ title: "Erro ao carregar consertos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairs();
  }, [user]);

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
      
      setRepairs((prev) => [data, ...prev]);
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
      
      setRepairs((prev) => prev.map((r) => (r.id === id ? data : r)));
      toast({ title: "Conserto atualizado!" });
      return data;
    } catch (error: any) {
      console.error("Error updating repair:", error);
      toast({ title: "Erro ao atualizar conserto", variant: "destructive" });
      return null;
    }
  };

  const startRepair = async (id: string) => {
    return updateRepair(id, { status: "em_andamento" });
  };

  const finishRepair = async (id: string, value: number) => {
    return updateRepair(id, { 
      status: "pronto", 
      value, 
      finished_at: new Date().toISOString() 
    });
  };

  const deliverRepair = async (id: string) => {
    return updateRepair(id, { status: "entregue" });
  };

  const deleteRepair = async (id: string) => {
    try {
      const { error } = await supabase
        .from("repairs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setRepairs((prev) => prev.filter((r) => r.id !== id));
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
    refetch: fetchRepairs,
  };
}
