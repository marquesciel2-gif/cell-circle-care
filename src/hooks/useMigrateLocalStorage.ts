import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useTenant } from "./useTenant";
import { toast } from "@/hooks/use-toast";

// Helper to convert DD/MM/YYYY to YYYY-MM-DD
const convertDate = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  
  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.split('T')[0];
  }
  
  // DD/MM/YYYY format
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  
  return null;
};

export function useMigrateLocalStorage() {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [migrating, setMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  const migrateAll = async () => {
    if (!user || migrating) return;
    
    const hasMigrated = localStorage.getItem("migration_complete_v2");
    if (hasMigrated === "true") {
      setMigrationComplete(true);
      return;
    }

    setMigrating(true);
    let totalMigrated = 0;

    try {
      // Migrate accounts
      const accountsMigrated = await migrateAccounts();
      totalMigrated += accountsMigrated;

      // Migrate clients
      const clientsMigrated = await migrateClients();
      totalMigrated += clientsMigrated;

      // Migrate inventory (all categories)
      const inventoryMigrated = await migrateInventory();
      totalMigrated += inventoryMigrated;

      // Migrate repairs
      const repairsMigrated = await migrateRepairs();
      totalMigrated += repairsMigrated;

      // Mark migration as complete
      localStorage.setItem("migration_complete_v2", "true");
      setMigrationComplete(true);

      if (totalMigrated > 0) {
        toast({
          title: "Migração concluída!",
          description: `${totalMigrated} registro(s) migrado(s) para o banco de dados.`,
        });
      }
    } catch (error) {
      console.error("Migration error:", error);
    } finally {
      setMigrating(false);
    }
  };

  const migrateAccounts = async (): Promise<number> => {
    const localStr = localStorage.getItem("accounts");
    if (!localStr) return 0;

    try {
      const localData = JSON.parse(localStr);
      if (!Array.isArray(localData) || localData.length === 0) {
        localStorage.removeItem("accounts");
        return 0;
      }

      let migrated = 0;
      for (const item of localData) {
        const { error } = await supabase.from("accounts_receivable").insert({
          client_name: item.cliente || item.client_name || "Cliente",
          descricao: item.descricao || "Sem descrição",
          valor_total: item.valor || item.valor_total || 0,
          valor_pago: item.valorPago || item.valor_pago || 0,
          parcelas: item.numeroParcelas || item.parcelas || 1,
          forma_pagamento: item.formaPagamento || item.forma_pagamento || "dinheiro",
          status: item.status || "pendente",
          vencimento: convertDate(item.dataVencimento || item.vencimento),
          created_by: user!.id,
        });
        if (!error) migrated++;
      }

      localStorage.removeItem("accounts");
      return migrated;
    } catch (e) {
      console.error("Error migrating accounts:", e);
      return 0;
    }
  };

  const migrateClients = async (): Promise<number> => {
    const localStr = localStorage.getItem("clients");
    if (!localStr) return 0;

    try {
      const localData = JSON.parse(localStr);
      if (!Array.isArray(localData) || localData.length === 0) {
        localStorage.removeItem("clients");
        return 0;
      }

      let migrated = 0;
      for (const item of localData) {
        const { error } = await supabase.from("clients").insert({
          nome: item.nome || item.name || "Cliente",
          telefone: item.telefone || item.phone || null,
          email: item.email || null,
          endereco: item.endereco || item.address || null,
          created_by: user!.id,
        });
        if (!error) migrated++;
      }

      localStorage.removeItem("clients");
      return migrated;
    } catch (e) {
      console.error("Error migrating clients:", e);
      return 0;
    }
  };

  const migrateInventory = async (): Promise<number> => {
    const categories = ["novos", "usados", "acessorios", "eletros"];
    let totalMigrated = 0;

    for (const category of categories) {
      const localStr = localStorage.getItem(category);
      if (!localStr) continue;

      try {
        const localData = JSON.parse(localStr);
        if (!Array.isArray(localData) || localData.length === 0) {
          localStorage.removeItem(category);
          continue;
        }

        for (const item of localData) {
          const { error } = await supabase.from("inventory").insert({
            nome: item.nome || item.name || item.modelo || "Produto",
            descricao: item.descricao || item.description || null,
            quantidade: item.quantidade || item.quantity || 1,
            preco_custo: item.precoCusto || item.preco_custo || item.cost || null,
            preco_venda: item.precoVenda || item.preco_venda || item.price || null,
            categoria: category,
            created_by: user!.id,
          });
          if (!error) totalMigrated++;
        }

        localStorage.removeItem(category);
      } catch (e) {
        console.error(`Error migrating ${category}:`, e);
      }
    }

    return totalMigrated;
  };

  const migrateRepairs = async (): Promise<number> => {
    const localStr = localStorage.getItem("repairs") || localStorage.getItem("consertos");
    if (!localStr) return 0;

    try {
      const localData = JSON.parse(localStr);
      if (!Array.isArray(localData) || localData.length === 0) {
        localStorage.removeItem("repairs");
        localStorage.removeItem("consertos");
        return 0;
      }

      let migrated = 0;
      for (const item of localData) {
        const { error } = await supabase.from("repairs").insert({
          client_name: item.cliente || item.client_name || item.clientName || "Cliente",
          device: item.aparelho || item.device || item.dispositivo || "Dispositivo",
          problem: item.problema || item.problem || item.defeito || "Sem descrição",
          status: item.status || "pendente",
          value: item.valor || item.value || null,
          notes: item.observacoes || item.notes || null,
          technician_id: user!.id,
          created_by: user!.id,
        });
        if (!error) migrated++;
      }

      localStorage.removeItem("repairs");
      localStorage.removeItem("consertos");
      return migrated;
    } catch (e) {
      console.error("Error migrating repairs:", e);
      return 0;
    }
  };

  useEffect(() => {
    if (user) {
      migrateAll();
    }
  }, [user]);

  return { migrating, migrationComplete };
}
