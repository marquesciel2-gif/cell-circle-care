import { useState } from "react";
import { 
  Search, 
  Filter, 
  Plus, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Transaction {
  id: number;
  tipo: "entrada" | "saida";
  produto: string;
  quantidade: number;
  valor: number;
  data: string;
  observacao?: string;
}

const mockTransactions: Transaction[] = [
  { id: 1, tipo: "entrada", produto: "iPhone 15 Pro 128GB", quantidade: 3, valor: 20997, data: "19/01/2025", observacao: "Compra fornecedor ABC" },
  { id: 2, tipo: "saida", produto: "Galaxy S24 Ultra 256GB", quantidade: 1, valor: 7499, data: "19/01/2025", observacao: "Venda - Cliente João" },
  { id: 3, tipo: "entrada", produto: "Carregador Turbo 30W", quantidade: 10, valor: 890, data: "18/01/2025" },
  { id: 4, tipo: "saida", produto: "iPhone 12 64GB (Usado)", quantidade: 1, valor: 2499, data: "18/01/2025", observacao: "Venda com garantia 3 meses" },
  { id: 5, tipo: "entrada", produto: "Fone JBL Tune 510", quantidade: 5, valor: 995, data: "17/01/2025" },
  { id: 6, tipo: "saida", produto: "Capa Silicone iPhone 15", quantidade: 2, valor: 598, data: "17/01/2025" },
];

export function TransactionsSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todas");

  const filteredTransactions = mockTransactions.filter(t => {
    const matchesSearch = t.produto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "todas" || t.tipo === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalEntradas = mockTransactions
    .filter(t => t.tipo === "entrada")
    .reduce((sum, t) => sum + t.valor, 0);

  const totalSaidas = mockTransactions
    .filter(t => t.tipo === "saida")
    .reduce((sum, t) => sum + t.valor, 0);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Entrada / Saída</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-success text-success hover:bg-success/10">
            <ArrowDownCircle className="h-4 w-4" />
            Nova Entrada
          </Button>
          <Button variant="outline" className="gap-2 border-accent text-accent hover:bg-accent/10">
            <ArrowUpCircle className="h-4 w-4" />
            Nova Saída
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="stat-card">
          <div className="stat-card-gradient gradient-success" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-success">
              <ArrowDownCircle className="h-6 w-6 text-success-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Entradas</p>
              <p className="text-2xl font-bold text-success">
                R$ {totalEntradas.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-gradient gradient-primary" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
              <ArrowUpCircle className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Saídas</p>
              <p className="text-2xl font-bold text-accent">
                R$ {totalSaidas.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-input bg-card py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Período
        </Button>
      </div>

      {/* Tabs and Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="entrada">Entradas</TabsTrigger>
          <TabsTrigger value="saida">Saídas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="table-container">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Produto</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Qtd</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Valor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Data</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr 
                      key={transaction.id} 
                      className="border-b border-border transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            transaction.tipo === "entrada" 
                              ? "bg-success/10 text-success border-success/20" 
                              : "bg-accent/10 text-accent border-accent/20"
                          )}
                        >
                          {transaction.tipo === "entrada" ? (
                            <ArrowDownCircle className="mr-1 h-3 w-3" />
                          ) : (
                            <ArrowUpCircle className="mr-1 h-3 w-3" />
                          )}
                          {transaction.tipo === "entrada" ? "Entrada" : "Saída"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{transaction.produto}</td>
                      <td className="px-4 py-3 text-center text-sm text-foreground">{transaction.quantidade}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        R$ {transaction.valor.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{transaction.data}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {transaction.observacao || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
