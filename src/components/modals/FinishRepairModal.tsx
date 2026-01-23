import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Repair } from "@/types";

interface FinishRepairModalProps {
  open: boolean;
  onClose: () => void;
  repair: Repair | null;
  onFinish: (id: number, valor: number) => void;
}

export function FinishRepairModal({ open, onClose, repair, onFinish }: FinishRepairModalProps) {
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (repair) {
      setValor(repair.valor?.toString() || "");
    }
  }, [repair]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repair || !valor) return;

    onFinish(repair.id, parseFloat(valor));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Finalizar Conserto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Informe o valor do serviço para finalizar o conserto.
          </p>
          {repair && (
            <div className="p-3 rounded-lg bg-muted">
              <p className="font-medium text-foreground">{repair.aparelho}</p>
              <p className="text-sm text-muted-foreground">{repair.cliente}</p>
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
          <div className="flex justify-end gap-3 pt-4">
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
