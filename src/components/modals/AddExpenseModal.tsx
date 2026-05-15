import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { EXPENSE_CATEGORIES, NewExpense } from "@/hooks/useExpenses";
import { ClientPicker } from "@/components/clients/ClientPicker";
import { useClients } from "@/hooks/useClients";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (expense: NewExpense) => Promise<boolean>;
}

export function AddExpenseModal({ isOpen, onClose, onAdd }: AddExpenseModalProps) {
  const { addClient } = useClients();
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [dataExpense, setDataExpense] = useState<Date>(new Date());
  const [formaPagamento, setFormaPagamento] = useState("");
  const [status, setStatus] = useState<"pago" | "pendente">("pendente");
  const [fornecedorNome, setFornecedorNome] = useState("");
  const [fornecedorId, setFornecedorId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!descricao || !valor || !categoria || !formaPagamento) {
      return;
    }

    setIsSubmitting(true);

    let resolvedFornecedorId = fornecedorId;
    if (fornecedorNome && !resolvedFornecedorId) {
      const c = await addClient({ nome: fornecedorNome });
      if (c) resolvedFornecedorId = c.id;
    }

    const success = await onAdd({
      descricao,
      valor: parseFloat(valor),
      categoria,
      data_despesa: format(dataExpense, "yyyy-MM-dd"),
      forma_pagamento: formaPagamento,
      status,
      fornecedor_nome: fornecedorNome || null,
      fornecedor_id: resolvedFornecedorId,
    });

    if (success) {
      resetForm();
      onClose();
    }

    setIsSubmitting(false);
  };

  const resetForm = () => {
    setDescricao("");
    setValor("");
    setCategoria("");
    setDataExpense(new Date());
    setFormaPagamento("");
    setStatus("pendente");
    setFornecedorNome("");
    setFornecedorId(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Despesa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Conta de luz - Janeiro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fornecedor (opcional)</Label>
            <ClientPicker
              value={fornecedorNome}
              onChange={setFornecedorNome}
              onSelect={(c) => {
                if (c) {
                  setFornecedorId(c.id);
                  setFornecedorNome(c.nome);
                } else {
                  setFornecedorId(null);
                }
              }}
              placeholder="Buscar ou cadastrar fornecedor"
            />
          </div>

          <div className="space-y-2">
            <Label>Data da Despesa</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataExpense && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataExpense
                    ? format(dataExpense, "PPP", { locale: ptBR })
                    : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataExpense}
                  onSelect={(date) => date && setDataExpense(date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "pago" | "pendente")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
