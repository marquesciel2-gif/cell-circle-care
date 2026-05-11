import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientPicker } from "@/components/clients/ClientPicker";

interface AddRepairModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (repair: { client_name: string; device: string; problem: string }) => void;
}

export function AddRepairModal({ open, onClose, onAdd }: AddRepairModalProps) {
  const [device, setDevice] = useState("");
  const [clientName, setClientName] = useState("");
  const [problem, setProblem] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!device || !clientName || !problem) return;

    onAdd({
      device,
      client_name: clientName,
      problem,
    });

    // Reset form
    setDevice("");
    setClientName("");
    setProblem("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Conserto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Aparelho *</label>
            <input
              type="text"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              placeholder="Ex: iPhone 12 - Tela quebrada"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Problema / Serviço *</label>
            <input
              type="text"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Ex: Troca de tela"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Cliente *</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nome do cliente"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            * O valor do serviço será informado ao finalizar o conserto.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-primary-foreground border-0">
              Registrar Conserto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
