import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface Account {
  id: string;
  client_id: string | null;
  client_name: string;
  descricao: string;
  valor_total: number;
  valor_pago: number;
  parcelas: number;
  forma_pagamento: string;
  status: string;
  vencimento: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AccountInput {
  client_id?: string;
  client_name: string;
  descricao: string;
  valor_total: number;
  valor_pago?: number;
  parcelas?: number;
  forma_pagamento: string;
  vencimento?: string;
}

export function useAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationDone, setMigrationDone] = useState(false);

  const migrateFromLocalStorage = async () => {
    if (!user || migrationDone) return;
    
    const localAccountsStr = localStorage.getItem("accounts");
    if (!localAccountsStr) {
      setMigrationDone(true);
      return;
    }

    try {
      const localAccounts = JSON.parse(localAccountsStr);
      if (!Array.isArray(localAccounts) || localAccounts.length === 0) {
        localStorage.removeItem("accounts");
        setMigrationDone(true);
        return;
      }

      let migrated = 0;
      for (const account of localAccounts) {
        const { error } = await supabase.from("accounts_receivable").insert({
          client_name: account.cliente || account.client_name || "Cliente",
          descricao: account.descricao || "Sem descrição",
          valor_total: account.valor || account.valor_total || 0,
          valor_pago: account.valorPago || account.valor_pago || 0,
          parcelas: account.numeroParcelas || account.parcelas || 1,
          forma_pagamento: account.formaPagamento || account.forma_pagamento || "dinheiro",
          status: account.status || "pendente",
          vencimento: account.dataVencimento || account.vencimento || null,
          created_by: user.id,
        });

        if (!error) migrated++;
      }

      localStorage.removeItem("accounts");
      setMigrationDone(true);
      
      if (migrated > 0) {
        toast({ 
          title: "Dados migrados!", 
          description: `${migrated} conta(s) recuperada(s) do armazenamento local.` 
        });
      }
    } catch (error) {
      console.error("Error migrating accounts:", error);
      setMigrationDone(true);
    }
  };

  const fetchAccounts = async () => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("accounts_receivable")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
      toast({ title: "Erro ao carregar contas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await migrateFromLocalStorage();
      await fetchAccounts();
    };
    init();
  }, [user]);

  const getStatus = (valorTotal: number, valorPago: number): string => {
    if (valorPago >= valorTotal) return "pago";
    if (valorPago > 0) return "parcial";
    return "pendente";
  };

  const addAccount = async (input: AccountInput) => {
    if (!user) {
      toast({ title: "Você precisa estar logado", variant: "destructive" });
      return null;
    }

    const valorPago = input.valor_pago || 0;
    const status = getStatus(input.valor_total, valorPago);

    try {
      const { data, error } = await supabase
        .from("accounts_receivable")
        .insert({
          client_id: input.client_id || null,
          client_name: input.client_name,
          descricao: input.descricao,
          valor_total: input.valor_total,
          valor_pago: valorPago,
          parcelas: input.parcelas || 1,
          forma_pagamento: input.forma_pagamento,
          status,
          vencimento: input.vencimento || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setAccounts((prev) => [data, ...prev]);
      toast({ title: "Conta registrada!" });
      return data;
    } catch (error: any) {
      console.error("Error adding account:", error);
      toast({ title: "Erro ao registrar conta", variant: "destructive" });
      return null;
    }
  };

  const updateAccount = async (id: string, updates: Partial<AccountInput>) => {
    try {
      const account = accounts.find((a) => a.id === id);
      if (!account) return null;

      const valorTotal = updates.valor_total ?? account.valor_total;
      const valorPago = updates.valor_pago ?? account.valor_pago;
      const status = getStatus(valorTotal, valorPago);

      const { data, error } = await supabase
        .from("accounts_receivable")
        .update({ ...updates, status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      setAccounts((prev) => prev.map((a) => (a.id === id ? data : a)));
      toast({ title: "Conta atualizada!" });
      return data;
    } catch (error: any) {
      console.error("Error updating account:", error);
      toast({ title: "Erro ao atualizar conta", variant: "destructive" });
      return null;
    }
  };

  const receivePayment = async (id: string, valor: number) => {
    const account = accounts.find((a) => a.id === id);
    if (!account) return null;

    const novoValorPago = account.valor_pago + valor;
    const status = getStatus(account.valor_total, novoValorPago);

    try {
      const { data, error } = await supabase
        .from("accounts_receivable")
        .update({ valor_pago: novoValorPago, status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      setAccounts((prev) => prev.map((a) => (a.id === id ? data : a)));
      toast({ title: "Pagamento recebido!", description: `R$ ${valor.toFixed(2)} registrado.` });
      return data;
    } catch (error: any) {
      console.error("Error receiving payment:", error);
      toast({ title: "Erro ao registrar pagamento", variant: "destructive" });
      return null;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from("accounts_receivable")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Conta removida" });
      return true;
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({ title: "Erro ao remover conta", variant: "destructive" });
      return false;
    }
  };

  const totalPendente = accounts
    .filter((a) => a.status !== "pago")
    .reduce((sum, a) => sum + (a.valor_total - a.valor_pago), 0);

  const totalAtrasado = accounts
    .filter((a) => a.status === "atrasado")
    .reduce((sum, a) => sum + (a.valor_total - a.valor_pago), 0);

  return {
    accounts,
    loading,
    addAccount,
    updateAccount,
    receivePayment,
    deleteAccount,
    totalPendente,
    totalAtrasado,
    refetch: fetchAccounts,
  };
}
