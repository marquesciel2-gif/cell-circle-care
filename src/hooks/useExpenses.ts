import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useTenant } from "./useTenant";
import { toast } from "sonner";

export interface Expense {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  data_despesa: string;
  forma_pagamento: string;
  status: "pago" | "pendente";
  fornecedor_id: string | null;
  fornecedor_nome: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ExpenseCategory = 
  | "aluguel"
  | "energia"
  | "agua"
  | "internet"
  | "fornecedor"
  | "manutencao"
  | "salarios"
  | "impostos"
  | "outros";

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "aluguel", label: "Aluguel" },
  { value: "energia", label: "Energia/Luz" },
  { value: "agua", label: "Água" },
  { value: "internet", label: "Internet/Telefone" },
  { value: "fornecedor", label: "Fornecedores" },
  { value: "manutencao", label: "Manutenção" },
  { value: "salarios", label: "Salários" },
  { value: "impostos", label: "Impostos" },
  { value: "outros", label: "Outros" },
];

export interface NewExpense {
  descricao: string;
  valor: number;
  categoria: string;
  data_despesa: string;
  forma_pagamento: string;
  status: "pago" | "pendente";
  fornecedor_id?: string | null;
  fornecedor_nome?: string | null;
}

export function useExpenses() {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("data_despesa", { ascending: false });

    if (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Erro ao carregar despesas");
    } else {
      setExpenses(data as Expense[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = async (expense: NewExpense) => {
    if (!user || !tenantId) {
      toast.error("Usuário não autenticado");
      return false;
    }

    const { error } = await supabase.from("expenses").insert({
      ...expense,
      tenant_id: tenantId,
      created_by: user.id,
    });

    if (error) {
      console.error("Error adding expense:", error);
      toast.error("Erro ao adicionar despesa");
      return false;
    }

    toast.success("Despesa adicionada com sucesso");
    await fetchExpenses();
    return true;
  };

  const updateExpense = async (id: string, updates: Partial<NewExpense>) => {
    const { error } = await supabase
      .from("expenses")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating expense:", error);
      toast.error("Erro ao atualizar despesa");
      return false;
    }

    toast.success("Despesa atualizada com sucesso");
    await fetchExpenses();
    return true;
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) {
      console.error("Error deleting expense:", error);
      toast.error("Erro ao excluir despesa");
      return false;
    }

    toast.success("Despesa excluída com sucesso");
    await fetchExpenses();
    return true;
  };

  const getTotalByCategory = (categoria: string) => {
    return expenses
      .filter((e) => e.categoria === categoria)
      .reduce((sum, e) => sum + Number(e.valor), 0);
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, e) => sum + Number(e.valor), 0);
  };

  const getTotalPaid = () => {
    return expenses
      .filter((e) => e.status === "pago")
      .reduce((sum, e) => sum + Number(e.valor), 0);
  };

  const getTotalPending = () => {
    return expenses
      .filter((e) => e.status === "pendente")
      .reduce((sum, e) => sum + Number(e.valor), 0);
  };

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    fetchExpenses,
    getTotalByCategory,
    getTotalExpenses,
    getTotalPaid,
    getTotalPending,
  };
}
