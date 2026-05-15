import { useState, useMemo } from "react";
import { Search, Printer, FileText, CreditCard, Banknote, AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAccounts, Account } from "@/hooks/useAccounts";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  pendente: { label: "Pendente", icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
  atrasado: { label: "Atrasado", icon: AlertCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
  pago: { label: "Pago", icon: CheckCircle2, className: "bg-success/10 text-success border-success/20" },
  parcial: { label: "Parcial", icon: Clock, className: "bg-accent/10 text-accent border-accent/20" },
};

const paymentLabels: Record<string, string> = {
  promissoria: "Promissória",
  avista: "À Vista",
  cartao: "Cartão",
};

const paymentIcons: Record<string, any> = {
  promissoria: FileText,
  avista: Banknote,
  cartao: CreditCard,
};

const STATUS_COLORS: Record<string, string> = {
  pendente: "hsl(var(--warning))",
  atrasado: "hsl(var(--destructive))",
  pago: "hsl(var(--success))",
  parcial: "hsl(var(--accent))",
};

const PAYMENT_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))"];

export function AccountsReport() {
  const { accounts, loading } = useAccounts();
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch =
        account.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPayment = paymentFilter === "all" || account.forma_pagamento === paymentFilter;
      const matchesStatus = statusFilter === "all" || account.status === statusFilter;
      return matchesSearch && matchesPayment && matchesStatus;
    });
  }, [accounts, searchTerm, paymentFilter, statusFilter]);

  const summary = useMemo(() => {
    return filteredAccounts.reduce(
      (acc, a) => {
        const restante = a.valor_total - a.valor_pago;
        if (a.status === "pago") acc.pago += a.valor_total;
        else if (a.status === "atrasado") acc.atrasado += restante;
        else acc.pendente += restante;
        acc.total += a.valor_total;
        return acc;
      },
      { pendente: 0, atrasado: 0, pago: 0, total: 0 }
    );
  }, [filteredAccounts]);

  const statusChartData = useMemo(
    () =>
      [
        { name: "Pendente", value: summary.pendente, color: STATUS_COLORS.pendente },
        { name: "Atrasado", value: summary.atrasado, color: STATUS_COLORS.atrasado },
        { name: "Pago", value: summary.pago, color: STATUS_COLORS.pago },
      ].filter((i) => i.value > 0),
    [summary]
  );

  const paymentChartData = useMemo(() => {
    const byPayment: Record<string, number> = {};
    filteredAccounts.forEach((a) => {
      const key = paymentLabels[a.forma_pagamento] || a.forma_pagamento;
      byPayment[key] = (byPayment[key] || 0) + a.valor_total;
    });
    return Object.entries(byPayment).map(([name, value]) => ({ name, value }));
  }, [filteredAccounts]);

  const toOldFormat = (a: Account) => ({
    id: 0,
    cliente: a.client_name,
    telefone: "",
    descricao: a.descricao,
    valor: a.valor_total,
    valorPago: a.valor_pago,
    dataVencimento: a.vencimento ? format(new Date(a.vencimento), "dd/MM/yyyy", { locale: ptBR }) : "",
    formaPagamento: a.forma_pagamento as any,
    numeroParcelas: a.parcelas,
    status: a.status as any,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="stat-card">
          <div className="stat-card-gradient gradient-warning" />
          <div className="relative">
            <p className="text-sm text-muted-foreground">Pendente</p>
            <p className="text-lg font-bold text-warning">R$ {summary.pendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-gradient gradient-danger" />
          <div className="relative">
            <p className="text-sm text-muted-foreground">Atrasado</p>
            <p className="text-lg font-bold text-destructive">R$ {summary.atrasado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-gradient gradient-success" />
          <div className="relative">
            <p className="text-sm text-muted-foreground">Recebido</p>
            <p className="text-lg font-bold text-success">R$ {summary.pago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-gradient gradient-primary" />
          <div className="relative">
            <p className="text-sm text-muted-foreground">Total Geral</p>
            <p className="text-xl font-bold text-primary">R$ {summary.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      {filteredAccounts.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2 print:hidden">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-4">Contas por Status</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-4">Contas por Forma de Pagamento</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentChartData} layout="vertical">
                  <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={80} />
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {paymentChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row print:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por cliente ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-input bg-card py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-40 bg-card"><SelectValue placeholder="Pagamento" /></SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="promissoria">Promissória</SelectItem>
            <SelectItem value="avista">À Vista</SelectItem>
            <SelectItem value="cartao">Cartão</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-card"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="atrasado">Atrasado</SelectItem>
            <SelectItem value="parcial">Parcial</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Table */}
      <div className="table-container print:shadow-none print:border-black">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Descrição</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Pagamento</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Valor</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Restante</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhuma conta encontrada.</td>
                </tr>
              ) : (
                filteredAccounts.map((account) => {
                  const config = statusConfig[account.status] || statusConfig.pendente;
                  const StatusIcon = config.icon;
                  const PaymentIcon = paymentIcons[account.forma_pagamento] || Banknote;
                  const restante = account.valor_total - account.valor_pago;
                  return (
                    <tr key={account.id} className="border-b border-border transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3"><p className="font-medium text-foreground">{account.client_name}</p><p className="text-[10px] text-muted-foreground capitalize">{account.origem}</p></td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">{account.descricao}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="secondary" className="text-xs">
                          <PaymentIcon className="mr-1 h-3 w-3" />
                          {paymentLabels[account.forma_pagamento] || account.forma_pagamento}
                          {account.parcelas > 1 && ` (${account.parcelas}x)`}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className={config.className}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">R$ {account.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">R$ {restante.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-center print:hidden">
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedAccount(account); setReceiptModalOpen(true); }} title="Gerar Comprovante">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground print:hidden">
        <span>{filteredAccounts.length} contas encontradas</span>
      </div>

      <ReceiptModal
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        account={selectedAccount ? toOldFormat(selectedAccount) : null}
      />
    </div>
  );
}
