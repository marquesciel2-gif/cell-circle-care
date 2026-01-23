import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Repair } from "@/types";

interface EditRepairModalProps {
  open: boolean;
  onClose: () => void;
  repair: Repair | null;
  onSave: (repair: Repair) => void;
}

export function EditRepairModal({ open, onClose, repair, onSave }: EditRepairModalProps) {
  const [aparelho, setAparelho] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [problema, setProblema] = useState("");
  const [previsao, setPrevisao] = useState("");
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (repair) {
      setAparelho(repair.aparelho);
      setCliente(repair.cliente);
      setTelefone(repair.telefone);
      setProblema(repair.problema);
      setPrevisao(repair.previsao);
      setValor(repair.valor?.toString() || "");
    }
  }, [repair]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repair || !aparelho || !cliente || !telefone || !problema) return;

    onSave({
      ...repair,
      aparelho,
      cliente,
      telefone,
      problema,
      previsao,
      valor: valor ? parseFloat(valor) : undefined,
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
              value={aparelho}
              onChange={(e) => setAparelho(e.target.value)}
              placeholder="Ex: iPhone 12 - Tela quebrada"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Problema / Serviço *</label>
            <input
              type="text"
              value={problema}
              onChange={(e) => setProblema(e.target.value)}
              placeholder="Ex: Troca de tela"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
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
          <div className="grid grid-cols-2 gap-4">
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
              <label className="text-sm font-medium text-foreground">Previsão de Entrega</label>
              <input
                type="text"
                value={previsao}
                onChange={(e) => setPrevisao(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
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
