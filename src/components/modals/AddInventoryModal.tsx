import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InventoryItem } from "@/types";

interface AddInventoryModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: Omit<InventoryItem, "id">) => void;
  type: "novos" | "usados" | "acessorios" | "eletros";
}

export function AddInventoryModal({ open, onClose, onAdd, type }: AddInventoryModalProps) {
  const [nome, setNome] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [preco, setPreco] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [condicao, setCondicao] = useState<"novo" | "usado" | "seminovo">(
    type === "novos" ? "novo" : type === "usados" ? "usado" : "novo"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !marca || !modelo || !preco) return;

    onAdd({
      nome,
      marca,
      modelo,
      preco: parseFloat(preco),
      quantidade: parseInt(quantidade),
      status: "disponivel",
      condicao,
      tipo: type,
    });

    // Reset form
    setNome("");
    setMarca("");
    setModelo("");
    setPreco("");
    setQuantidade("1");
    onClose();
  };

  const getTitle = () => {
    switch (type) {
      case "novos": return "Adicionar Aparelho Novo";
      case "usados": return "Adicionar Segunda Mão";
      case "acessorios": return "Adicionar Acessório";
      case "eletros": return "Adicionar Móvel/Eletro";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Nome do Produto *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: iPhone 15 Pro"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Marca *</label>
              <input
                type="text"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ex: Apple"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Modelo *</label>
              <input
                type="text"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ex: 128GB"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Preço (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="0,00"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Quantidade</label>
              <input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          {type === "usados" && (
            <div>
              <label className="text-sm font-medium text-foreground">Condição</label>
              <select
                value={condicao}
                onChange={(e) => setCondicao(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="seminovo">Seminovo</option>
                <option value="usado">Usado</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-primary-foreground border-0">
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
