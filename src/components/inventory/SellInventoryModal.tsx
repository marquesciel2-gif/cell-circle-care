import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientPicker } from "@/components/clients/ClientPicker";
import { useClients } from "@/hooks/useClients";
import type { InventoryItem } from "@/hooks/useInventory";

export interface SellPayload {
  client_id?: string;
  client_name: string;
  quantidade: number;
  preco_unitario: number;
  forma_pagamento: "avista" | "cartao" | "promissoria";
  parcelas?: number;
  vencimento?: string;
}

interface SellInventoryModalProps {
  open: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSell: (payload: SellPayload) => void;
}

const paymentMethods = [
  { value: "avista", label: "À Vista" },
  { value: "cartao", label: "Cartão" },
  { value: "promissoria", label: "Promissória / Fiado" },
] as const;

export function SellInventoryModal({ open, onClose, item, onSell }: SellInventoryModalProps) {
  const { addClient } = useClients();
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [telefone, setTelefone] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [preco, setPreco] = useState("");
  const [forma, setForma] = useState<SellPayload["forma_pagamento"]>("avista");
  const [parcelas, setParcelas] = useState("1");
  const [vencimento, setVencimento] = useState("");

  useEffect(() => {
    if (item) {
      setClientName("");
      setClientId(null);
      setTelefone("");
      setQuantidade("1");
      setPreco(item.preco_venda ? String(item.preco_venda) : "");
      setForma("avista");
      setParcelas("1");
      setVencimento("");
    }
  }, [item]);

  if (!item) return null;

  const qtd = parseInt(quantidade) || 0;
  const precoNum = parseFloat(preco) || 0;
  const total = qtd * precoNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || qtd <= 0 || qtd > item.quantidade || precoNum <= 0) return;

    let resolvedId = clientId;
    if (!resolvedId) {
      const c = await addClient({ nome: clientName, telefone: telefone || undefined });
      if (c) resolvedId = c.id;
    }

    onSell({
      client_id: resolvedId || undefined,
      client_name: clientName,
      quantidade: qtd,
      preco_unitario: precoNum,
      forma_pagamento: forma,
      parcelas: forma === "promissoria" ? parseInt(parcelas) || 1 : undefined,
      vencimento: forma === "promissoria" ? vencimento : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Venda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded-lg bg-muted">
            <p className="font-medium text-foreground">{item.nome}</p>
            <p className="text-xs text-muted-foreground">
              Em estoque: {item.quantidade}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Cliente *</label>
              <ClientPicker
                value={clientName}
                onChange={setClientName}
                onSelect={(c) => {
                  if (c) {
                    setClientId(c.id);
                    setClientName(c.nome);
                    if (c.telefone) setTelefone(c.telefone);
                  } else {
                    setClientId(null);
                  }
                }}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Telefone</label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Quantidade *</label>
              <input
                type="number"
                min="1"
                max={item.quantidade}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Preço unitário (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Forma de Pagamento *</label>
            <select
              value={forma}
              onChange={(e) => setForma(e.target.value as any)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {paymentMethods.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {forma === "promissoria" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Parcelas</label>
                <input
                  type="number"
                  min="1"
                  value={parcelas}
                  onChange={(e) => setParcelas(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Vencimento *</label>
                <input
                  type="date"
                  value={vencimento}
                  onChange={(e) => setVencimento(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg bg-accent/30 p-3">
            <span className="text-sm text-muted-foreground">Total da venda:</span>
            <span className="text-lg font-bold text-foreground">
              R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-success text-success-foreground border-0">
              Registrar Venda
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
