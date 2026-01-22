import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Account } from "@/types";

interface ReceivePaymentModalProps {
  open: boolean;
  onClose: () => void;
  account: Account | null;
  onReceive: (accountId: number, valorRecebido: number) => void;
}

export function ReceivePaymentModal({ open, onClose, account, onReceive }: ReceivePaymentModalProps) {
  const [valorRecebido, setValorRecebido] = useState("");

  if (!account) return null;

  const restante = account.valor - account.valorPago;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(valorRecebido);
    if (!valor || valor <= 0) return;

    onReceive(account.id, valor);
    setValorRecebido("");
    onClose();
  };

  const handleReceiveAll = () => {
    onReceive(account.id, restante);
    setValorRecebido("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receber Pagamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="font-medium text-foreground">{account.cliente}</p>
            <p className="text-sm text-muted-foreground">{account.descricao}</p>
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Valor Total:</span>
              <span className="font-medium">R$ {account.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Já Pago:</span>
              <span className="font-medium text-success">R$ {account.valorPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
              <span className="text-muted-foreground">Restante:</span>
              <span className="font-bold text-warning">R$ {restante.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Valor a Receber (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={restante}
                value={valorRecebido}
                onChange={(e) => setValorRecebido(e.target.value)}
                placeholder={restante.toFixed(2)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="button" variant="outline" onClick={handleReceiveAll}>
                Receber Tudo
              </Button>
              <Button type="submit" className="gradient-success text-success-foreground border-0" disabled={!valorRecebido}>
                Receber
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
