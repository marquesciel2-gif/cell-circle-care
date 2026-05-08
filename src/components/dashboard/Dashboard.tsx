import { useState } from "react";
import { Smartphone, Package, Wrench, Receipt, Headphones, Loader2, Wallet, ArrowDownCircle } from "lucide-react";
import { StatCard } from "./StatCard";
import { QuickActions } from "./QuickActions";
import { useInventory } from "@/hooks/useInventory";
import { useRepairs } from "@/hooks/useRepairs";
import { useAccounts } from "@/hooks/useAccounts";
import { useExpenses } from "@/hooks/useExpenses";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { toast } from "sonner";

interface DashboardProps {
  onNavigate?: (section: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { items: novos, loading: loadingNovos } = useInventory("novos");
  const { items: usados, loading: loadingUsados } = useInventory("usados");
  const { items: acessorios, loading: loadingAcessorios } = useInventory("acessorios");
  const { repairs, loading: loadingRepairs } = useRepairs();
  const { accounts, loading: loadingAccounts, totalPendente } = useAccounts();
  const { expenses, loading: loadingExpenses, addExpense } = useExpenses();

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawValue, setWithdrawValue] = useState("");
  const [withdrawDesc, setWithdrawDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loading = loadingNovos || loadingUsados || loadingAcessorios || loadingRepairs || loadingAccounts || loadingExpenses;

  const totalNovos = novos.reduce((sum, item) => sum + item.quantidade, 0);
  const totalUsados = usados.reduce((sum, item) => sum + item.quantidade, 0);
  const totalAcessorios = acessorios.reduce((sum, item) => sum + item.quantidade, 0);
  const totalEstoque = totalNovos + totalUsados + totalAcessorios;

  const consertosPendentes = repairs.filter(r => r.status === "pendente" || r.status === "em_andamento").length;
  const consertosProntos = repairs.filter(r => r.status === "pronto").length;

  const contasPendentes = accounts.filter(a => a.status !== "pago");
  const quantidadeContas = contasPendentes.length;

  const totalRecebido = accounts.reduce((sum, a) => sum + Number(a.valor_pago || 0), 0);
  const totalDespesasPagas = expenses
    .filter(e => e.status === "pago")
    .reduce((sum, e) => sum + Number(e.valor || 0), 0);
  const valorEmCaixa = totalRecebido - totalDespesasPagas;

  const handleWithdraw = async () => {
    const valor = parseFloat(withdrawValue);
    if (!valor || valor <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    setSubmitting(true);
    const ok = await addExpense({
      descricao: withdrawDesc || "Retirada de caixa",
      valor,
      categoria: "outros",
      data_despesa: format(new Date(), "yyyy-MM-dd"),
      forma_pagamento: "dinheiro",
      status: "pago",
    });
    setSubmitting(false);
    if (ok) {
      setWithdrawValue("");
      setWithdrawDesc("");
      setWithdrawOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Estoque Total" 
          value={totalEstoque} 
          subtitle="Aparelhos em estoque" 
          icon={Smartphone} 
          variant="primary" 
        />
        <StatCard 
          title="Consertos Pendentes" 
          value={consertosPendentes} 
          subtitle="Aguardando reparo" 
          icon={Wrench} 
          variant="warning" 
        />
        <StatCard 
          title="Consertos Prontos" 
          value={consertosProntos} 
          subtitle="Para retirada" 
          icon={Wrench} 
          variant="success" 
        />
        <StatCard 
          title="Contas a Receber" 
          value={quantidadeContas} 
          subtitle={`R$ ${totalPendente.toLocaleString('pt-BR')} pendente`} 
          icon={Receipt} 
          variant="danger" 
        />
      </div>

      {/* Caixa */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <Wallet className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor em Caixa</p>
              <p className="text-3xl font-bold text-foreground">
                R$ {valorEmCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Recebido R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} − Despesas R$ {totalDespesasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <Button onClick={() => setWithdrawOpen(true)} className="gradient-primary text-primary-foreground border-0">
            <ArrowDownCircle className="mr-2 h-4 w-4" />
            Retirar
          </Button>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Novos</p>
              <p className="text-2xl font-bold">{totalNovos}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <Package className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Usados</p>
              <p className="text-2xl font-bold">{totalUsados}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <Headphones className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Acessórios</p>
              <p className="text-2xl font-bold">{totalAcessorios}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-md">
        <QuickActions onNavigate={onNavigate} />
      </div>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Retirar do Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-value">Valor (R$)</Label>
              <Input
                id="withdraw-value"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={withdrawValue}
                onChange={(e) => setWithdrawValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdraw-desc">Descrição (opcional)</Label>
              <Input
                id="withdraw-desc"
                placeholder="Retirada de caixa"
                value={withdrawDesc}
                onChange={(e) => setWithdrawDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Cancelar</Button>
            <Button onClick={handleWithdraw} disabled={submitting}>
              {submitting ? "Salvando..." : "Confirmar Retirada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
