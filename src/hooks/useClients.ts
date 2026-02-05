import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Client {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  tem_debito?: boolean;
}

export interface ClientInput {
  nome: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    if (!user) {
      setClients([]);
      setLoading(false);
      return;
    }

    try {
      // Usar função segura que retorna dados baseado no papel do usuário
      const { data, error } = await supabase.rpc("get_clients_for_user");

      if (error) throw error;
      setClients((data as Client[]) || []);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user]);

  const addClient = async (input: ClientInput) => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          nome: input.nome,
          telefone: input.telefone || null,
          email: input.email || null,
          endereco: input.endereco || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setClients((prev) => [data, ...prev]);
      toast.success("Cliente cadastrado com sucesso!");
      return data;
    } catch (error: any) {
      console.error("Error adding client:", error);
      toast.error("Erro ao cadastrar cliente");
      return null;
    }
  };

  const updateClient = async (id: string, input: ClientInput) => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .update({
          nome: input.nome,
          telefone: input.telefone || null,
          email: input.email || null,
          endereco: input.endereco || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      setClients((prev) =>
        prev.map((c) => (c.id === id ? data : c))
      );
      toast.success("Cliente atualizado com sucesso!");
      return data;
    } catch (error: any) {
      console.error("Error updating client:", error);
      toast.error("Erro ao atualizar cliente");
      return null;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setClients((prev) => prev.filter((c) => c.id !== id));
      toast.success("Cliente excluído com sucesso!");
      return true;
    } catch (error: any) {
      console.error("Error deleting client:", error);
      toast.error("Erro ao excluir cliente");
      return false;
    }
  };

  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient,
    refetch: fetchClients,
  };
}
