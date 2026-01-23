import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Account } from "@/types";

interface EditAccountModalProps {
  open: boolean;
  onClose: () => void;
  account: Account | null;
  onSave: (account: Account) => void;
}

const paymentMethods = [
  { value: "promissoria" as const, label: "Promissória" },
  { value: "avista" as const, label: "À Vista" },
  { value: "cartao" as const, label: "Cartão" },
];

export function EditAccountModal({ open, onClose, account, onSave }: EditAccountModalProps) {
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [valorPago, setValorPago] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<Account["formaPagamento"]>("avista");
  const [numeroParcelas, setNumeroParcelas] = useState("");

  useEffect(() => {
    if (account) {
      setCliente(account.cliente);
      setTelefone(account.telefone);
      setDescricao(account.descricao);
      setValor(account.valor.toString());
      setValorPago(account.valorPago.toString());
      setDataVencimento(account.dataVencimento);
      setFormaPagamento(account.formaPagamento);
      setNumeroParcelas(account.numeroParcelas?.toString() || "");
    }
  }, [account]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !cliente || !telefone || !descricao || !valor) return;

    const novoValorPago = parseFloat(valorPago) || 0;
    const valorTotal = parseFloat(valor);
    let novoStatus: Account["status"] = account.status;
    
    if (novoValorPago >= valorTotal) {
      novoStatus = "pago";
    } else if (novoValorPago > 0) {
      novoStatus = "parcial";
    } else {
      novoStatus = "pendente";
    }

    onSave({
      ...account,
      cliente,
      telefone,
      descricao,
      valor: valorTotal,
      valorPago: novoValorPago,
      dataVencimento,
      formaPagamento,
      numeroParcelas: numeroParcelas ? parseInt(numeroParcelas) : undefined,
      status: novoStatus,
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
            <label className="text-sm font-medium text-foreground">Data de Vencimento</label>
            <input
              type="text"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              placeholder="DD/MM/AAAA"
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
