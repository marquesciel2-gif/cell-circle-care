import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientPicker } from "@/components/clients/ClientPicker";
import { useClients } from "@/hooks/useClients";

interface AddRepairModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (repair: { client_id?: string; client_name: string; device: string; problem: string }) => void;
}

export function AddRepairModal({ open, onClose, onAdd }: AddRepairModalProps) {
  const { addClient } = useClients();
  const [device, setDevice] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [telefone, setTelefone] = useState("");
  const [problem, setProblem] = useState("");

  const reset = () => {
    setDevice("");
    setClientName("");
    setClientId(null);
    setTelefone("");
    setProblem("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device || !clientName || !problem) return;

    let resolvedId = clientId;
    if (!resolvedId) {
      const created = await addClient({ nome: clientName, telefone: telefone || undefined });
      if (created) resolvedId = created.id;
    }

    onAdd({
      device,
      client_name: clientName,
      client_id: resolvedId || undefined,
      problem,
    });

    reset();
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
                placeholder="(00) 00000-0000"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
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
