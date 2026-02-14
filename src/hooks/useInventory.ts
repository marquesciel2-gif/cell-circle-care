import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface InventoryItem {
  id: string;
  nome: string;
  descricao: string | null;
  quantidade: number;
  preco_custo: number | null;
  preco_venda: number | null;
  categoria: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryInput {
  nome: string;
  descricao?: string;
  quantidade: number;
  preco_custo?: number;
  preco_venda?: number;
  categoria?: string;
}

export function useInventory(categoria?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: allItems = [], isLoading: loading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_inventory_for_user");
      if (error) throw error;
      return (data as InventoryItem[]) || [];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const items = categoria ? allItems.filter(item => item.categoria === categoria) : allItems;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["inventory"] });

  const addItem = async (input: InventoryInput) => {
    if (!user) {
      toast({ title: "Você precisa estar logado", variant: "destructive" });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("inventory")
        .insert({
          nome: input.nome,
          descricao: input.descricao || null,
          quantidade: input.quantidade,
          preco_custo: input.preco_custo || null,
          preco_venda: input.preco_venda || null,
          categoria: input.categoria || categoria || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      invalidate();
      toast({ title: "Produto adicionado!" });
      return data;
    } catch (error: any) {
      console.error("Error adding item:", error);
      toast({ title: "Erro ao adicionar produto", variant: "destructive" });
      return null;
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryInput>) => {
    try {
      const { data, error } = await supabase
        .from("inventory")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      invalidate();
      toast({ title: "Produto atualizado!" });
      return data;
    } catch (error: any) {
      console.error("Error updating item:", error);
      toast({ title: "Erro ao atualizar produto", variant: "destructive" });
      return null;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("inventory")
        .delete()
        .eq("id", id);

      if (error) throw error;
      invalidate();
      toast({ title: "Produto removido" });
      return true;
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast({ title: "Erro ao remover produto", variant: "destructive" });
      return false;
    }
  };

  const decrementQuantity = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item || item.quantidade <= 0) return null;
    return updateItem(id, { quantidade: item.quantidade - 1 });
  };

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    decrementQuantity,
    refetch: invalidate,
  };
}
