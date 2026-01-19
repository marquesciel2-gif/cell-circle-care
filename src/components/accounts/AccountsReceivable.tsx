import { useState } from "react";
import { 
  Search, 
  Plus, 
  Calendar,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Account {
  id: number;
  cliente: string;
  telefone: string;
  descricao: string;
  valor: number;
  valorPago: number;
  dataVencimento: string;
  status: "pendente" | "atrasado" | "pago" | "parcial";
}

const mockAccounts: Account[] = [
  { id: 1, cliente: "João Silva", telefone: "(11) 99999-1234", descricao: "iPhone 12 - Conserto de tela", valor: 450, valorPago: 0, dataVencimento: "20/01/2025", status: "pendente" },
  { id: 2, cliente: "Maria Santos", telefone: "(11) 98888-5678", descricao: "Galaxy S21 - Parcelado 2x", valor: 1899, valorPago: 949.5, dataVencimento: "15/01/2025", status: "parcial" },
  { id: 3, cliente: "Carlos Oliveira", telefone: "(11) 97777-9012", descricao: "Acessórios diversos", valor: 320, valorPago: 0, dataVencimento: "10/01/2025", status: "atrasado" },
  { id: 4, cliente: "Ana Costa", telefone: "(11) 96666-3456", descricao: "Moto G84 - À vista", valor: 1799, valorPago: 1799, dataVencimento: "12/01/2025", status: "pago" },
  { id: 5, cliente: "Pedro Lima", telefone: "(11) 95555-7890", descricao: "Conserto + Capa", valor: 180, valorPago: 0, dataVencimento: "22/01/2025", status: "pendente" },
];

const statusConfig = {
  pendente: { 
    label: "Pendente", 
    icon: Clock, 
    className: "bg-warning/10 text-warning border-warning/20" 
  },
  atrasado: { 
    label: "Atrasado", 
    icon: AlertCircle, 
    className: "bg-destructive/10 text-destructive border-destructive/20" 
  },
  pago: { 
    label: "Pago", 
    icon: CheckCircle2, 
    className: "bg-success/10 text-success border-success/20" 
  },
  parcial: { 
    label: "Parcial", 
    icon: DollarSign, 
    className: "bg-accent/10 text-accent border-accent/20" 
  },
};

export function AccountsReceivable() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAccounts = mockAccounts.filter(a => 
    a.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPendente = mockAccounts
    .filter(a => a.status !== "pago")
    .reduce((sum, a) => sum + (a.valor - a.valorPago), 0);

  const totalAtrasado = mockAccounts
    .filter(a => a.status === "atrasado")
    .reduce((sum, a) => sum + a.valor, 0);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Contas a Receber</h1>
        <Button className="gradient-primary text-primary-foreground border-0">
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="stat-card-gradient gradient-warning" />
          <div className="relative">
            <p className="text-sm text-muted-foreground">Total Pendente</p>
            <p className="mt-1 text-2xl font-bold text-warning">
              R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-gradient gradient-danger" />
          <div className="relative">
            <p className="text-sm text-muted-foreground">Total Atrasado</p>
            <p className="mt-1 text-2xl font-bold text-destructive">
              R$ {totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-gradient gradient-primary" />
          <div className="relative">
            <p className="text-sm text-muted-foreground">Contas Ativas</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {mockAccounts.filter(a => a.status !== "pago").length}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por cliente ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-input bg-card py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Accounts List */}
      <div className="space-y-3">
        {filteredAccounts.map((account) => {
          const config = statusConfig[account.status];
          const StatusIcon = config.icon;
          const restante = account.valor - account.valorPago;

          return (
            <div 
              key={account.id}
              className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">{account.cliente}</h3>
                    <Badge variant="outline" className={cn("text-xs", config.className)}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{account.descricao}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {account.telefone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Venc: {account.dataVencimento}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="text-lg font-bold text-foreground">
                      R$ {account.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {account.status === "parcial" && (
                      <p className="text-xs text-muted-foreground">
                        Restante: R$ {restante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                  {account.status !== "pago" && (
                    <Button size="sm" className="gradient-success text-success-foreground border-0">
                      Receber
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
