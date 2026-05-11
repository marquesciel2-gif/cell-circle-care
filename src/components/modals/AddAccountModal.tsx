import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientPicker } from "@/components/clients/ClientPicker";
import { useClients } from "@/hooks/useClients";

interface AddAccountModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (account: any) => void;
}

const paymentMethods = [
  { value: "promissoria", label: "Promissória" },
  { value: "avista", label: "À Vista" },
  { value: "cartao", label: "Cartão" },
];

export function AddAccountModal({ open, onClose, onAdd }: AddAccountModalProps) {
  const { addClient } = useClients();
  const [cliente, setCliente] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [telefone, setTelefone] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [valorPago, setValorPago] = useState("0");
  const [dataVencimento, setDataVencimento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("avista");
  const [numeroParcelas, setNumeroParcelas] = useState("");

  const reset = () => {
    setCliente("");
    setClienteId(null);
    setTelefone("");
    setDescricao("");
    setValor("");
    setValorPago("0");
    setDataVencimento("");
    setFormaPagamento("avista");
    setNumeroParcelas("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente || !descricao || !valor || !dataVencimento) return;

    let resolvedClientId = clienteId;
    // Auto-cadastrar cliente se não vinculado
    if (!resolvedClientId) {
      const created = await addClient({ nome: cliente, telefone: telefone || undefined });
      if (created) resolvedClientId = created.id;
    }

    onAdd({
      cliente,
      client_id: resolvedClientId,
      telefone,
      descricao,
      valor: parseFloat(valor),
      valorPago: parseFloat(valorPago) || 0,
      dataVencimento,
      formaPagamento,
      numeroParcelas: numeroParcelas ? parseInt(numeroParcelas) : undefined,
    });

    reset();
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
              <ClientPicker
                value={cliente}
                onChange={setCliente}
                onSelect={(c) => {
                  if (c) {
                    setClienteId(c.id);
                    setCliente(c.nome);
                    if (c.telefone) setTelefone(c.telefone);
                  } else {
                    setClienteId(null);
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
                placeholder="(00) 00000-0000"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
