import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Repair } from "@/hooks/useRepairs";

export interface FinishRepairPayload {
  valor: number;
  formaPagamento: "avista" | "cartao" | "promissoria";
  parcelas?: number;
  vencimento?: string;
}

interface FinishRepairModalProps {
  open: boolean;
  onClose: () => void;
  repair: Repair | null;
  onFinish: (id: string, payload: FinishRepairPayload) => void;
}

const paymentMethods = [
  { value: "avista", label: "À Vista (já pago)" },
  { value: "cartao", label: "Cartão (pago)" },
  { value: "promissoria", label: "Promissória / Fiado" },
] as const;

export function FinishRepairModal({ open, onClose, repair, onFinish }: FinishRepairModalProps) {
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<FinishRepairPayload["formaPagamento"]>("avista");
  const [parcelas, setParcelas] = useState("1");
  const [vencimento, setVencimento] = useState("");

  useEffect(() => {
    if (repair) {
      setValor(repair.value?.toString() || "");
      setFormaPagamento("avista");
      setParcelas("1");
      setVencimento("");
    }
  }, [repair]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repair || !valor) return;

    onFinish(repair.id, {
      valor: parseFloat(valor),
      formaPagamento,
      parcelas: formaPagamento === "promissoria" ? parseInt(parcelas) || 1 : undefined,
      vencimento: formaPagamento === "promissoria" ? vencimento : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Finalizar Conserto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {repair && (
            <div className="p-3 rounded-lg bg-muted">
              <p className="font-medium text-foreground">{repair.device}</p>
              <p className="text-sm text-muted-foreground">{repair.client_name}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground">Valor do Serviço (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Forma de Pagamento *</label>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value as any)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {paymentMethods.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          {formaPagamento === "promissoria" && (
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
          <p className="text-xs text-muted-foreground">
            Uma conta a receber será criada automaticamente vinculada a este cliente.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-success text-success-foreground border-0">
              Finalizar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
