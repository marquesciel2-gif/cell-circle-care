import { useState } from "react";
import { 
  Search, 
  Plus,
  Trash2,
  ShoppingCart,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AddInventoryModal } from "@/components/modals/AddInventoryModal";
import { SellInventoryModal, SellPayload } from "@/components/inventory/SellInventoryModal";
import { useInventory, InventoryInput, InventoryItem } from "@/hooks/useInventory";
import { useAccounts } from "@/hooks/useAccounts";
import { useUserRole } from "@/hooks/useUserRole";

interface InventoryTableProps {
  title: string;
  type: "novos" | "usados" | "acessorios" | "eletros";
}

const statusStyles = {
  disponivel: "bg-success/10 text-success border-success/20",
  reservado: "bg-warning/10 text-warning border-warning/20",
  vendido: "bg-muted text-muted-foreground border-muted",
};

const statusLabels: Record<string, string> = {
  disponivel: "Disponível",
  reservado: "Reservado",
  vendido: "Vendido",
};

export function InventoryTable({ title, type }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [sellItem, setSellItem] = useState<InventoryItem | null>(null);

  const { items, loading, addItem, deleteItem, updateItem } = useInventory(type);
  const { addAccount } = useAccounts();
  const { isAdmin, isVendedor } = useUserRole();

  const canEdit = isAdmin || isVendedor;
  const canView = isAdmin || isVendedor;

  const filteredItems = items.filter(item => 
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.descricao && item.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddItem = async (newItem: any) => {
    const input: InventoryInput = {
      nome: newItem.nome,
      descricao: `${newItem.marca} - ${newItem.modelo}`,
      quantidade: newItem.quantidade,
      preco_venda: newItem.preco,
      categoria: type,
    };
    await addItem(input);
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteItem(id);
  };

  const handleSell = async (payload: SellPayload) => {
    if (!sellItem) return;
    const total = payload.preco_unitario * payload.quantidade;
    const isPaid = payload.forma_pagamento !== "promissoria";

    // Baixa estoque
    await updateItem(sellItem.id, { quantidade: sellItem.quantidade - payload.quantidade });

    // Cria conta a receber vinculada
    await addAccount({
      client_id: payload.client_id,
      client_name: payload.client_name,
      descricao: `Venda: ${sellItem.nome}${payload.quantidade > 1 ? ` (${payload.quantidade}x)` : ""}`,
      valor_total: total,
      valor_pago: isPaid ? total : 0,
      parcelas: payload.parcelas || 1,
      forma_pagamento: payload.forma_pagamento,
      vencimento: payload.vencimento,
    });

    setSellItem(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {canEdit && (
          <Button 
            className="gradient-primary text-primary-foreground border-0"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-input bg-card py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Produto</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Descrição</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Preço</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Qtd</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Status</th>
                {canEdit && (
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum item encontrado.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const status = item.quantidade > 0 ? "disponivel" : "vendido";
                  return (
                    <tr 
                      key={item.id} 
                      className="border-b border-border transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{item.nome}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{item.descricao || "-"}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        R$ {(item.preco_venda || 0).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-foreground">{item.quantidade}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", statusStyles[status as keyof typeof statusStyles])}
                        >
                          {statusLabels[status]}
                        </Badge>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {item.quantidade > 0 && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-success"
                                onClick={() => handleSell(item)}
                                title="Vender"
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Mostrando {filteredItems.length} de {items.length} itens</span>
      </div>

      {/* Modal */}
      <AddInventoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddItem}
        type={type}
      />
    </div>
  );
}
