import { useState } from "react";
import { 
  Search, 
  Plus, 
  Calendar,
  Phone,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Clock,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AddAccountModal } from "@/components/modals/AddAccountModal";
import { ReceivePaymentModal } from "@/components/modals/ReceivePaymentModal";
import { Account } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "@/hooks/use-toast";

const initialAccounts: Account[] = [
  { id: 1, cliente: "João Silva", telefone: "(11) 99999-1234", descricao: "iPhone 12 - Conserto de tela", valor: 450, valorPago: 0, dataVencimento: "20/01/2025", status: "pendente" },
  { id: 2, cliente: "Maria Santos", telefone: "(11) 98888-5678", descricao: "Galaxy S21 - Parcelado 2x", valor: 1899, valorPago: 949.5, dataVencimento: "15/01/2025", status: "parcial" },
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
  const [modalOpen, setModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useLocalStorage<Account[]>("accounts", initialAccounts);

  const filteredAccounts = accounts.filter(a => 
    a.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPendente = accounts
    .filter(a => a.status !== "pago")
    .reduce((sum, a) => sum + (a.valor - a.valorPago), 0);

  const totalAtrasado = accounts
    .filter(a => a.status === "atrasado")
    .reduce((sum, a) => sum + (a.valor - a.valorPago), 0);

  const handleAddAccount = (newAccount: Omit<Account, "id" | "status">) => {
    const id = Date.now();
    let status: Account["status"] = "pendente";
    if (newAccount.valorPago >= newAccount.valor) {
      status = "pago";
    } else if (newAccount.valorPago > 0) {
      status = "parcial";
    }
    setAccounts([...accounts, { ...newAccount, id, status }]);
    toast({
      title: "Conta registrada!",
      description: `Conta de ${newAccount.cliente} foi adicionada.`,
    });
  };

  const handleReceivePayment = (accountId: number, valorRecebido: number) => {
    setAccounts(accounts.map(a => {
      if (a.id === accountId) {
        const novoValorPago = a.valorPago + valorRecebido;
        let novoStatus: Account["status"] = a.status;
        if (novoValorPago >= a.valor) {
          novoStatus = "pago";
        } else if (novoValorPago > 0) {
          novoStatus = "parcial";
        }
        return { ...a, valorPago: novoValorPago, status: novoStatus };
      }
      return a;
    }));
    toast({
      title: "Pagamento recebido!",
      description: `R$ ${valorRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} registrado.`,
    });
  };

  const handleDelete = (id: number) => {
    setAccounts(accounts.filter(a => a.id !== id));
    toast({ title: "Conta removida" });
  };

  const openReceiveModal = (account: Account) => {
    setSelectedAccount(account);
    setReceiveModalOpen(true);
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Contas a Receber</h1>
        <Button 
          className="gradient-primary text-primary-foreground border-0"
          onClick={() => setModalOpen(true)}
        >
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
              {accounts.filter(a => a.status !== "pago").length}
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
        {filteredAccounts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Nenhuma conta encontrada. Clique em "Nova Conta" para registrar.
          </div>
        ) : (
          filteredAccounts.map((account) => {
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
                      {(account.status === "parcial" || account.status === "pendente") && restante > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Restante: R$ {restante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                    {account.status !== "pago" && (
                      <Button 
                        size="sm" 
                        className="gradient-success text-success-foreground border-0"
                        onClick={() => openReceiveModal(account)}
                      >
                        Receber
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <AddAccountModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddAccount}
      />
      <ReceivePaymentModal
        open={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        account={selectedAccount}
        onReceive={handleReceivePayment}
      />
    </div>
  );
}
