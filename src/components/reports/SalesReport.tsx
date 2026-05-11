import { useState, useMemo } from "react";
import { format, isWithinInterval, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Calendar, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccounts } from "@/hooks/useAccounts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const PAYMENT_LABELS: Record<string, string> = {
  promissoria: "Promissória",
  avista: "À Vista",
  cartao: "Cartão",
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))"];

export function SalesReport() {
  const { accounts, loading } = useAccounts();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // "Vendas" = contas geradas por vendas de estoque (descrição começa com "Venda")
  const sales = useMemo(
    () => accounts.filter((a) => a.descricao.toLowerCase().startsWith("venda")),
    [accounts]
  );

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        s.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.client_name.toLowerCase().includes(searchTerm.toLowerCase());
      let matchDate = true;
      if (dateRange.from && dateRange.to) {
        const d = parseISO(s.created_at);
        matchDate = isWithinInterval(d, { start: dateRange.from, end: dateRange.to });
      }
      return matchSearch && matchDate;
    });
  }, [sales, searchTerm, dateRange]);

  const totalByPayment = useMemo(() => {
    return filtered.reduce(
      (acc, s) => {
        const key = s.forma_pagamento;
        acc[key] = (acc[key] || 0) + s.valor_total;
        acc.total += s.valor_total;
        return acc;
      },
      { total: 0 } as Record<string, number>
    );
  }, [filtered]);

  const pieData = useMemo(
    () =>
      Object.entries(totalByPayment)
        .filter(([k]) => k !== "total")
        .map(([k, v]) => ({ name: PAYMENT_LABELS[k] || k, value: v }))
        .filter((d) => d.value > 0),
    [totalByPayment]
  );

  const barData = useMemo(() => {
    const byDate: Record<string, number> = {};
    filtered.forEach((s) => {
      const d = format(parseISO(s.created_at), "dd/MM/yyyy");
      byDate[d] = (byDate[d] || 0) + s.valor_total;
    });
    return Object.entries(byDate)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        {(["avista", "cartao", "promissoria"] as const).map((k) => (
          <div key={k} className="stat-card">
            <p className="text-sm text-muted-foreground">{PAYMENT_LABELS[k]}</p>
            <p className="text-lg font-bold text-foreground">
              R$ {(totalByPayment[k] || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
        <div className="stat-card">
          <div className="stat-card-gradient gradient-primary" />
          <div className="relative">
            <p className="text-sm text-muted-foreground">Total Vendas</p>
            <p className="text-xl font-bold text-primary">
              R$ {totalByPayment.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      {filtered.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2 print:hidden">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-4">Vendas por Forma de Pagamento</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-4">Vendas por Dia (Últimos 7)</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => v.slice(0, 5)} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por produto ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-input bg-card py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              {dateRange.from && dateRange.to ? `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}` : "Período"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover" align="end">
            <CalendarComponent mode="range" selected={{ from: dateRange.from, to: dateRange.to }} onSelect={(r) => setDateRange({ from: r?.from, to: r?.to })} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
        <Button onClick={() => window.print()} className="gap-2 print:hidden">
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
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Descrição</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Pagamento</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Valor</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhuma venda encontrada no período.</td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="border-b border-border transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{s.descricao}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{s.client_name || "-"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{PAYMENT_LABELS[s.forma_pagamento] || s.forma_pagamento}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">R$ {s.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">{format(parseISO(s.created_at), "dd/MM/yyyy")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground print:hidden">
        <span>{filtered.length} vendas encontradas</span>
      </div>
    </div>
  );
}
