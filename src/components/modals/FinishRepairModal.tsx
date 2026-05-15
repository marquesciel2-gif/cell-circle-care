import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Repair } from "@/hooks/useRepairs";
import { useInventory, InventoryItem } from "@/hooks/useInventory";
import { Search, Plus, X, Package } from "lucide-react";

export interface PecaUsada {
  id: string;
  nome: string;
  quantidade: number;
  preco_unitario: number;
}

export interface FinishRepairPayload {
  valor: number;
  formaPagamento: "avista" | "cartao" | "promissoria";
  parcelas?: number;
  vencimento?: string;
  pecas: PecaUsada[];
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
  const { items } = useInventory();
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<FinishRepairPayload["formaPagamento"]>("avista");
  const [parcelas, setParcelas] = useState("1");
  const [vencimento, setVencimento] = useState("");
  const [pecas, setPecas] = useState<PecaUsada[]>([]);
  const [pieceSearch, setPieceSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (repair) {
      setValor(repair.value?.toString() || "");
      setFormaPagamento("avista");
      setParcelas("1");
      setVencimento("");
      setPecas([]);
      setPieceSearch("");
    }
  }, [repair]);

  const availableItems = useMemo(() => {
    const q = pieceSearch.trim().toLowerCase();
    return items
      .filter((i) => i.quantidade > 0 && !pecas.find((p) => p.id === i.id))
      .filter((i) => !q || i.nome.toLowerCase().includes(q))
      .slice(0, 6);
  }, [items, pieceSearch, pecas]);

  const totalPecas = useMemo(
    () => pecas.reduce((s, p) => s + p.quantidade * p.preco_unitario, 0),
    [pecas]
  );

  const addPeca = (item: InventoryItem) => {
    setPecas((p) => [
      ...p,
      {
        id: item.id,
        nome: item.nome,
        quantidade: 1,
        preco_unitario: item.preco_venda || 0,
      },
    ]);
    setPieceSearch("");
    setPickerOpen(false);
  };

  const updatePeca = (id: string, patch: Partial<PecaUsada>) => {
    setPecas((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const removePeca = (id: string) => setPecas((p) => p.filter((x) => x.id !== id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repair || !valor) return;

    onFinish(repair.id, {
      valor: parseFloat(valor),
      formaPagamento,
      parcelas: formaPagamento === "promissoria" ? parseInt(parcelas) || 1 : undefined,
      vencimento: formaPagamento === "promissoria" ? vencimento : undefined,
      pecas,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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

          {/* Peças usadas */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Package className="h-4 w-4" /> Peças usadas (opcional)
            </label>

            {pecas.length > 0 && (
              <div className="space-y-2">
                {pecas.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.nome}</p>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={p.quantidade}
                      onChange={(e) => updatePeca(p.id, { quantidade: parseInt(e.target.value) || 1 })}
                      className="w-14 rounded border border-input bg-background px-2 py-1 text-xs"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={p.preco_unitario}
                      onChange={(e) => updatePeca(p.id, { preco_unitario: parseFloat(e.target.value) || 0 })}
                      className="w-20 rounded border border-input bg-background px-2 py-1 text-xs"
                    />
                    <Button type="button" size="sm" variant="ghost" onClick={() => removePeca(p.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground text-right">
                  Subtotal peças: R$ {totalPecas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={pieceSearch}
                onChange={(e) => {
                  setPieceSearch(e.target.value);
                  setPickerOpen(true);
                }}
                onFocus={() => setPickerOpen(true)}
                placeholder="Buscar peça no estoque..."
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {pickerOpen && availableItems.length > 0 && (
                <div className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-border bg-popover shadow-lg">
                  {availableItems.map((it) => (
                    <button
                      type="button"
                      key={it.id}
                      onClick={() => addPeca(it)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Plus className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate">{it.nome}</span>
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        Estoque: {it.quantidade} • R$ {(it.preco_venda || 0).toLocaleString("pt-BR")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

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
            />
            {totalPecas > 0 && (
              <button
                type="button"
                onClick={() => setValor(String((parseFloat(valor) || 0) + totalPecas))}
                className="mt-1 text-xs text-primary hover:underline"
              >
                + somar peças (R$ {totalPecas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
              </button>
            )}
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
            As peças serão baixadas do estoque e a conta a receber será criada vinculada ao cliente.
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
