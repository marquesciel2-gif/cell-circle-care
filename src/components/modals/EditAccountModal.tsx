import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Account } from "@/hooks/useAccounts";
import { ClientPicker } from "@/components/clients/ClientPicker";

export interface EditAccountPayload {
  client_id?: string | null;
  client_name: string;
  descricao: string;
  valor_total: number;
  valor_pago: number;
  forma_pagamento: string;
  parcelas?: number;
  vencimento?: string;
}

interface EditAccountModalProps {
  open: boolean;
  onClose: () => void;
  account: Account | null;
  onSave: (id: string, payload: EditAccountPayload) => void;
}

const paymentMethods = [
  { value: "promissoria", label: "Promissória" },
  { value: "avista", label: "À Vista" },
  { value: "cartao", label: "Cartão" },
];

export function EditAccountModal({ open, onClose, account, onSave }: EditAccountModalProps) {
  const [cliente, setCliente] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [valorPago, setValorPago] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("avista");
  const [parcelas, setParcelas] = useState("");

  useEffect(() => {
    if (account) {
      setCliente(account.client_name);
      setClienteId(account.client_id);
      setDescricao(account.descricao);
      setValor(String(account.valor_total));
      setValorPago(String(account.valor_pago));
      setVencimento(account.vencimento || "");
      setFormaPagamento(account.forma_pagamento);
      setParcelas(account.parcelas > 1 ? String(account.parcelas) : "");
    }
  }, [account]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !cliente || !descricao || !valor) return;

    onSave(account.id, {
      client_id: clienteId,
      client_name: cliente,
      descricao,
      valor_total: parseFloat(valor),
      valor_pago: parseFloat(valorPago) || 0,
      forma_pagamento: formaPagamento,
      parcelas: parcelas ? parseInt(parcelas) : 1,
      vencimento: vencimento || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Conta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Cliente *</label>
            <ClientPicker
              value={cliente}
              onChange={setCliente}
              onSelect={(c) => {
                if (c) {
                  setClienteId(c.id);
                  setCliente(c.nome);
                } else {
                  setClienteId(null);
                }
              }}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Descrição *</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Valor Total (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Valor Pago (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Forma de Pagamento *</label>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {paymentMethods.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          {formaPagamento === "promissoria" && (
            <div>
              <label className="text-sm font-medium text-foreground">Número de Parcelas</label>
              <input
                type="number"
                min="1"
                value={parcelas}
                onChange={(e) => setParcelas(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground">Vencimento</label>
            <input
              type="date"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-primary-foreground border-0">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
