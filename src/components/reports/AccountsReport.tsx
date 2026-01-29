import { useState, useMemo } from "react";
import { Search, Printer, FileText, CreditCard, Banknote, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Account } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusConfig = {
  pendente: { label: "Pendente", icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
  atrasado: { label: "Atrasado", icon: AlertCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
  pago: { label: "Pago", icon: CheckCircle2, className: "bg-success/10 text-success border-success/20" },
  parcial: { label: "Parcial", icon: Clock, className: "bg-accent/10 text-accent border-accent/20" },
};

const paymentLabels = {
  promissoria: "Promissória",
  avista: "À Vista",
  cartao: "Cartão",
};

const paymentIcons = {
  promissoria: FileText,
  avista: Banknote,
  cartao: CreditCard,
};

export function AccountsReport() {
  const [accounts] = useLocalStorage<Account[]>("accounts", []);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch =
        account.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.descricao.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPayment =
        paymentFilter === "all" || account.formaPagamento === paymentFilter;

      const matchesStatus =
        statusFilter === "all" || account.status === statusFilter;

      return matchesSearch && matchesPayment && matchesStatus;
    });
  }, [accounts, searchTerm, paymentFilter, statusFilter]);

  const summary = useMemo(() => {
    return filteredAccounts.reduce(
      (acc, account) => {
        const restante = account.valor - account.valorPago;
        if (account.status === "pago") {
          acc.pago += account.valor;
        } else if (account.status === "atrasado") {
          acc.atrasado += restante;
        } else {
          acc.pendente += restante;
        }
        acc.total += account.valor;
        return acc;
      },
      { pendente: 0, atrasado: 0, pago: 0, total: 0 }
    );
  }, [filteredAccounts]);

  const handlePrint = () => {
    window.print();
  };

  const openReceiptModal = (account: Account) => {
    setSelectedAccount(account);
    setReceiptModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="stat-card">
          <div className="stat-card-gradient gradient-warning" />
          <div className="relative">
            <p className="text-sm text-muted-foreground">Pendente</p>
            <p className="text-lg font-bold text-warning">
              R$ {summary.pendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-gradient gradient-danger" />
          <div className="relative">
            <p className="text-sm text-muted-foreground">Atrasado</p>
            <p className="text-lg font-bold text-destructive">
              R$ {summary.atrasado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-gradient gradient-success" />
          <div className="relative">
            <p className="text-sm text-muted-foreground">Recebido</p>
            <p className="text-lg font-bold text-success">
              R$ {summary.pago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-gradient gradient-primary" />
          <div className="relative">
            <p className="text-sm text-muted-foreground">Total Geral</p>
            <p className="text-xl font-bold text-primary">
              R$ {summary.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

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
          <SelectTrigger className="w-40 bg-card">
            <SelectValue placeholder="Pagamento" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="promissoria">Promissória</SelectItem>
            <SelectItem value="avista">À Vista</SelectItem>
            <SelectItem value="cartao">Cartão</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-card">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="atrasado">Atrasado</SelectItem>
            <SelectItem value="parcial">Parcial</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Accounts Table */}
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
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma conta encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => {
                  const config = statusConfig[account.status];
                  const StatusIcon = config.icon;
                  const PaymentIcon = paymentIcons[account.formaPagamento];
                  const restante = account.valor - account.valorPago;

                  return (
                    <tr
                      key={account.id}
                      className="border-b border-border transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{account.cliente}</p>
                          <p className="text-xs text-muted-foreground">{account.telefone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                        {account.descricao}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="secondary" className="text-xs">
                          <PaymentIcon className="mr-1 h-3 w-3" />
                          {paymentLabels[account.formaPagamento]}
                          {account.numeroParcelas && ` (${account.numeroParcelas}x)`}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className={config.className}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        R$ {account.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        R$ {restante.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center print:hidden">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openReceiptModal(account)}
                          title="Gerar Comprovante"
                        >
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

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground print:hidden">
        <span>{filteredAccounts.length} contas encontradas</span>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        account={selectedAccount}
      />
    </div>
  );
}
