import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Repair } from "@/types";

interface AddRepairModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (repair: Omit<Repair, "id" | "status">) => void;
}

export function AddRepairModal({ open, onClose, onAdd }: AddRepairModalProps) {
  const [aparelho, setAparelho] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [problema, setProblema] = useState("");
  const [previsao, setPrevisao] = useState("");
  const [valor, setValor] = useState("");

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aparelho || !cliente || !telefone || !problema || !valor) return;

    onAdd({
      aparelho,
      cliente,
      telefone,
      problema,
      dataEntrada: formatDate(new Date()),
      previsao: previsao || formatDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
      valor: parseFloat(valor),
    });

    // Reset form
    setAparelho("");
    setCliente("");
    setTelefone("");
    setProblema("");
    setPrevisao("");
    setValor("");
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
              <label className="text-sm font-medium text-foreground">Valor (R$) *</label>
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
              <label className="text-sm font-medium text-foreground">Previsão de Entrega</label>
              <input
                type="date"
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
              Registrar Conserto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
