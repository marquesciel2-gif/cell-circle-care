import { useState, useMemo } from "react";
import { format, isWithinInterval, parse, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Calendar, Printer, Package, Smartphone, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sale } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

const tipoLabels = {
  novos: "Novos",
  usados: "Usados",
  acessorios: "Acessórios",
};

const tipoIcons = {
  novos: Smartphone,
  usados: Package,
  acessorios: Headphones,
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))"];

export function SalesReport() {
  const [sales] = useLocalStorage<Sale[]>("sales", []);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // Search filter
      const matchesSearch =
        sale.itemNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      // Date filter
      let matchesDate = true;
      if (dateRange.from && dateRange.to) {
        try {
          const saleDate = parse(sale.dataVenda, "dd/MM/yyyy", new Date());
          matchesDate = isWithinInterval(saleDate, {
            start: dateRange.from,
            end: dateRange.to,
          });
        } catch {
          matchesDate = true;
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [sales, searchTerm, dateRange]);

  const totalByType = useMemo(() => {
    return filteredSales.reduce(
      (acc, sale) => {
        acc[sale.tipo] = (acc[sale.tipo] || 0) + sale.preco;
        acc.total += sale.preco;
        return acc;
      },
      { novos: 0, usados: 0, acessorios: 0, total: 0 } as Record<string, number>
    );
  }, [filteredSales]);

  const pieChartData = useMemo(() => {
    return [
      { name: "Novos", value: totalByType.novos },
      { name: "Usados", value: totalByType.usados },
      { name: "Acessórios", value: totalByType.acessorios },
    ].filter((item) => item.value > 0);
  }, [totalByType]);

  const barChartData = useMemo(() => {
    const salesByDate: Record<string, number> = {};
    filteredSales.forEach((sale) => {
      if (!salesByDate[sale.dataVenda]) {
        salesByDate[sale.dataVenda] = 0;
      }
      salesByDate[sale.dataVenda] += sale.preco;
    });
    return Object.entries(salesByDate)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => {
        const dateA = parse(a.date, "dd/MM/yyyy", new Date());
        const dateB = parse(b.date, "dd/MM/yyyy", new Date());
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-7);
  }, [filteredSales]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {(["novos", "usados", "acessorios"] as const).map((tipo) => {
          const Icon = tipoIcons[tipo];
          return (
            <div key={tipo} className="stat-card">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{tipoLabels[tipo]}</p>
                  <p className="text-lg font-bold text-foreground">
                    R$ {totalByType[tipo].toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div className="stat-card">
          <div className="stat-card-gradient gradient-primary" />
          <div className="relative">
            <p className="text-sm text-muted-foreground">Total Vendas</p>
            <p className="text-xl font-bold text-primary">
              R$ {totalByType.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      {filteredSales.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2 print:hidden">
          {/* Pie Chart - Sales by Category */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-4">Vendas por Categoria</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    }
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart - Sales by Day */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-4">Vendas por Dia (Últimos 7)</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => value.slice(0, 5)}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    }
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
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
              {dateRange.from && dateRange.to
                ? `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}`
                : "Período"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover" align="end">
            <CalendarComponent
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) =>
                setDateRange({ from: range?.from, to: range?.to })
              }
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        <Button onClick={handlePrint} className="gap-2 print:hidden">
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Sales Table */}
      <div className="table-container print:shadow-none print:border-black">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Produto
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Categoria
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Cliente
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Valor
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma venda encontrada no período selecionado.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b border-border transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{sale.itemNome}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        {tipoLabels[sale.tipo]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {sale.cliente || "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      R$ {sale.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                      {sale.dataVenda}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground print:hidden">
        <span>{filteredSales.length} vendas encontradas</span>
      </div>
    </div>
  );
}
