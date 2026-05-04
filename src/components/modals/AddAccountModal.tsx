import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Account } from "@/types";

interface AddAccountModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (account: Omit<Account, "id" | "status">) => void;
}

const paymentMethods = [
  { value: "promissoria" as const, label: "Promissória" },
  { value: "avista" as const, label: "À Vista" },
  { value: "cartao" as const, label: "Cartão" },
];

export function AddAccountModal({ open, onClose, onAdd }: AddAccountModalProps) {
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [valorPago, setValorPago] = useState("0");
  const [dataVencimento, setDataVencimento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<Account["formaPagamento"]>("avista");
  const [numeroParcelas, setNumeroParcelas] = useState("");

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente || !telefone || !descricao || !valor || !dataVencimento) return;

    onAdd({
      cliente,
      telefone,
      descricao,
      valor: parseFloat(valor),
      valorPago: parseFloat(valorPago) || 0,
      dataVencimento, // ISO yyyy-mm-dd do <input type="date">
      formaPagamento,
      numeroParcelas: numeroParcelas ? parseInt(numeroParcelas) : undefined,
    });

    // Reset form
    setCliente("");
    setTelefone("");
    setDescricao("");
    setValor("");
    setValorPago("0");
    setDataVencimento("");
    setFormaPagamento("avista");
    setNumeroParcelas("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Conta a Receber</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Cliente *</label>
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Nome do cliente"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Telefone *</label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Descrição *</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: iPhone 12 - Conserto de tela"
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
                placeholder="0,00"
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
                placeholder="0,00"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Forma de Pagamento *</label>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value as Account["formaPagamento"])}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
          {formaPagamento === "promissoria" && (
            <div>
              <label className="text-sm font-medium text-foreground">Número de Parcelas</label>
              <input
                type="number"
                min="1"
                value={numeroParcelas}
                onChange={(e) => setNumeroParcelas(e.target.value)}
                placeholder="Ex: 3"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground">Data de Vencimento *</label>
            <input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-primary-foreground border-0">
              Adicionar Conta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
