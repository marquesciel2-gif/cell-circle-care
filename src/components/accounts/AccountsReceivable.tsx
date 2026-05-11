import { useState } from "react";
import { 
  Search, 
  Plus, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Clock,
  DollarSign,
  Edit,
  CreditCard,
  FileText,
  Banknote,
  Printer,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AddAccountModal } from "@/components/modals/AddAccountModal";
import { ReceivePaymentModal } from "@/components/modals/ReceivePaymentModal";
import { EditAccountModal, EditAccountPayload } from "@/components/modals/EditAccountModal";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import { ClientDetailDrawer } from "@/components/clients/ClientDetailDrawer";
import { useAccounts, Account, AccountInput } from "@/hooks/useAccounts";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const paymentIcons: Record<string, any> = {
  promissoria: FileText,
  avista: Banknote,
  cartao: CreditCard,
};

const paymentLabels: Record<string, string> = {
  promissoria: "Promissória",
  avista: "À Vista",
  cartao: "Cartão",
};

export function AccountsReceivable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [clientDrawer, setClientDrawer] = useState<{ id: string | null; name: string } | null>(null);

  const { accounts, loading, addAccount, updateAccount, receivePayment, deleteAccount, totalPendente, totalAtrasado } = useAccounts();
  const { isAdmin, isVendedor } = useUserRole();

  const canEdit = isAdmin || isVendedor;

  const filteredAccounts = accounts.filter(a => 
    a.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddAccount = async (newAccount: any) => {
    const input: AccountInput = {
      client_id: newAccount.client_id || undefined,
      client_name: newAccount.cliente,
      descricao: newAccount.descricao,
      valor_total: newAccount.valor,
      valor_pago: newAccount.valorPago || 0,
      parcelas: newAccount.numeroParcelas || 1,
      forma_pagamento: newAccount.formaPagamento,
      vencimento: newAccount.dataVencimento,
    };
    await addAccount(input);
    setModalOpen(false);
  };

  const handleReceivePayment = async (accountId: number, valorRecebido: number) => {
    if (selectedAccount) {
      await receivePayment(selectedAccount.id, valorRecebido);
      setReceiveModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteAccount(id);
  };

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (id: string, payload: EditAccountPayload) => {
    await updateAccount(id, {
      client_id: payload.client_id || undefined,
      client_name: payload.client_name,
      descricao: payload.descricao,
      valor_total: payload.valor_total,
      valor_pago: payload.valor_pago,
      forma_pagamento: payload.forma_pagamento,
      parcelas: payload.parcelas,
      vencimento: payload.vencimento,
    });
    setEditModalOpen(false);
  };

  const openReceiveModal = (account: Account) => {
    setSelectedAccount(account);
    setReceiveModalOpen(true);
  };

  const openReceiptModal = (account: Account) => {
    setSelectedAccount(account);
    setReceiptModalOpen(true);
  };

  // Convert Account to old format for modals
  const toOldFormat = (account: Account) => ({
    id: parseInt(account.id) || 0,
    cliente: account.client_name,
    telefone: "",
    descricao: account.descricao,
    valor: account.valor_total,
    valorPago: account.valor_pago,
    dataVencimento: account.vencimento ? format(new Date(account.vencimento), "dd/MM/yyyy", { locale: ptBR }) : "",
    formaPagamento: account.forma_pagamento as any,
    numeroParcelas: account.parcelas,
    status: account.status as any,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Contas a Receber</h1>
        {canEdit && (
          <Button 
            className="gradient-primary text-primary-foreground border-0"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        )}
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
            Nenhuma conta encontrada.
          </div>
        ) : (
          filteredAccounts.map((account) => {
            const config = statusConfig[account.status as keyof typeof statusConfig] || statusConfig.pendente;
            const StatusIcon = config.icon;
            const PaymentIcon = paymentIcons[account.forma_pagamento] || Banknote;
            const restante = account.valor_total - account.valor_pago;

            return (
              <div 
                key={account.id}
                className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setClientDrawer({ id: account.client_id, name: account.client_name })}
                        className="font-semibold text-foreground hover:text-primary underline-offset-2 hover:underline"
                      >
                        {account.client_name}
                      </button>
                      <Badge variant="outline" className={cn("text-xs", config.className)}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {config.label}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <PaymentIcon className="mr-1 h-3 w-3" />
                        {paymentLabels[account.forma_pagamento] || account.forma_pagamento}
                        {account.parcelas > 1 && ` (${account.parcelas}x)`}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{account.descricao}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {account.vencimento && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Venc: {format(new Date(account.vencimento), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <p className="text-lg font-bold text-foreground">
                        R$ {account.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      {(account.status === "parcial" || account.status === "pendente") && restante > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Restante: R$ {restante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                    {canEdit && (
                      <>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEdit(account)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => openReceiptModal(account)}
                          title="Gerar Comprovante"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
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
                      </>
                    )}
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
        account={selectedAccount ? toOldFormat(selectedAccount) : null}
        onReceive={handleReceivePayment}
      />
      <EditAccountModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        account={selectedAccount ? toOldFormat(selectedAccount) : null}
        onSave={handleSaveEdit}
      />
      <ReceiptModal
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        account={selectedAccount ? toOldFormat(selectedAccount) : null}
      />
    </div>
  );
}
