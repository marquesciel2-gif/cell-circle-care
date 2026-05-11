import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Repair } from "@/hooks/useRepairs";
import { ClientPicker } from "@/components/clients/ClientPicker";

export interface EditRepairPayload {
  device: string;
  client_name: string;
  client_id?: string | null;
  problem: string;
  notes?: string;
  value?: number | null;
}

interface EditRepairModalProps {
  open: boolean;
  onClose: () => void;
  repair: Repair | null;
  onSave: (id: string, payload: EditRepairPayload) => void;
}

export function EditRepairModal({ open, onClose, repair, onSave }: EditRepairModalProps) {
  const [device, setDevice] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [problem, setProblem] = useState("");
  const [notes, setNotes] = useState("");
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (repair) {
      setDevice(repair.device);
      setClientName(repair.client_name);
      setClientId(repair.client_id);
      setProblem(repair.problem);
      setNotes(repair.notes || "");
      setValor(repair.value != null ? String(repair.value) : "");
    }
  }, [repair]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repair || !device || !clientName || !problem) return;

    onSave(repair.id, {
      device,
      client_name: clientName,
      client_id: clientId,
      problem,
      notes: notes || undefined,
      value: valor ? parseFloat(valor) : null,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Conserto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Aparelho *</label>
            <input
              type="text"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
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
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Cliente *</label>
            <ClientPicker
              value={clientName}
              onChange={setClientName}
              onSelect={(c) => {
                if (c) {
                  setClientId(c.id);
                  setClientName(c.nome);
                } else {
                  setClientId(null);
                }
              }}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
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
