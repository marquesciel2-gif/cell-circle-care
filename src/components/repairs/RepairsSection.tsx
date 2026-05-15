import { useState } from "react";
import { 
  Search, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Wrench,
  User,
  Calendar,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { AddRepairModal } from "@/components/modals/AddRepairModal";
import { EditRepairModal, EditRepairPayload } from "@/components/modals/EditRepairModal";
import { FinishRepairModal, FinishRepairPayload } from "@/components/modals/FinishRepairModal";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import { ClientDetailDrawer } from "@/components/clients/ClientDetailDrawer";
import { useRepairs, Repair } from "@/hooks/useRepairs";
import { useAccounts } from "@/hooks/useAccounts";
import { useInventory } from "@/hooks/useInventory";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Receipt } from "lucide-react";

const statusConfig = {
  pendente: { label: "Pendente", icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
  em_andamento: { label: "Em Andamento", icon: Wrench, className: "bg-accent/10 text-accent border-accent/20" },
  pronto: { label: "Pronto", icon: CheckCircle2, className: "bg-success/10 text-success border-success/20" },
  entregue: { label: "Entregue", icon: CheckCircle2, className: "bg-muted text-muted-foreground border-muted" },
};

interface RepairCardProps {
  repair: Repair;
  onStart: (id: string) => void;
  onFinish: (repair: Repair) => void;
  onDeliver: (id: string) => void;
  onEdit: (repair: Repair) => void;
  onDelete: (id: string) => void;
  onChangeDeliveredAt?: (id: string, date: Date) => void;
  onOpenClient: (clientId: string | null, name: string) => void;
  onReceipt: (repair: Repair) => void;
  canEdit: boolean;
}

function RepairCard({ repair, onStart, onFinish, onDeliver, onEdit, onDelete, onChangeDeliveredAt, onOpenClient, onReceipt, canEdit }: RepairCardProps) {
  const config = statusConfig[repair.status as keyof typeof statusConfig] || statusConfig.pendente;
  const StatusIcon = config.icon;

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">{repair.device}</h3>
          <p className="text-sm text-muted-foreground">{repair.problem}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs", config.className)}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
          {canEdit && (
            <>
              <Button size="sm" variant="ghost" onClick={() => onEdit(repair)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(repair.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        <button
          type="button"
          onClick={() => onOpenClient(repair.client_id, repair.client_name)}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-left"
        >
          <User className="h-4 w-4" />
          <span className="underline-offset-2 hover:underline">{repair.client_name}</span>
        </button>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {repair.status === "entregue" && repair.delivered_at ? (
            canEdit && onChangeDeliveredAt ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-left underline-offset-2 hover:underline">
                    Entregue em: {format(new Date(repair.delivered_at), "dd/MM/yyyy", { locale: ptBR })}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    mode="single"
                    selected={new Date(repair.delivered_at)}
                    onSelect={(d) => d && onChangeDeliveredAt(repair.id, d)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <span>Entregue em: {format(new Date(repair.delivered_at), "dd/MM/yyyy", { locale: ptBR })}</span>
            )
          ) : (
            <span>Entrada: {format(new Date(repair.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-lg font-bold text-foreground">
          {repair.value ? `R$ ${Number(repair.value).toLocaleString('pt-BR')}` : "Valor a definir"}
        </span>
        <div className="flex gap-2">
          {(repair.status === "pronto" || repair.status === "entregue") && repair.value && (
            <Button size="sm" variant="outline" onClick={() => onReceipt(repair)} title="Gerar recibo">
              <Receipt className="h-4 w-4 mr-1" /> Recibo
            </Button>
          )}
          {repair.status === "pendente" && canEdit && (
            <Button size="sm" variant="outline" onClick={() => onStart(repair.id)}>
              Iniciar Reparo
            </Button>
          )}
          {repair.status === "em_andamento" && canEdit && (
            <Button size="sm" className="gradient-success text-success-foreground border-0" onClick={() => onFinish(repair)}>
              Finalizar
            </Button>
          )}
          {repair.status === "pronto" && canEdit && (
            <Button size="sm" className="gradient-primary text-primary-foreground border-0" onClick={() => onDeliver(repair.id)}>
              Entregar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function RepairsSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptRepair, setReceiptRepair] = useState<Repair | null>(null);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [clientDrawer, setClientDrawer] = useState<{ id: string | null; name: string } | null>(null);

  const { repairs, loading, addRepair, startRepair, finishRepair, deliverRepair, updateRepair, deleteRepair } = useRepairs();
  const { addAccount } = useAccounts();
  const { items, updateItem } = useInventory();
  const { isAdmin, isTecnico } = useUserRole();

  const canEdit = isAdmin || isTecnico;

  const filteredRepairs = repairs.filter(r =>
    r.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendentes = filteredRepairs.filter(r => r.status === "pendente" || r.status === "em_andamento");
  const prontos = filteredRepairs.filter(r => r.status === "pronto");
  const entregues = filteredRepairs.filter(r => r.status === "entregue");

  const handleAddRepair = async (data: { client_id?: string; client_name: string; device: string; problem: string }) => {
    await addRepair({
      client_id: data.client_id,
      client_name: data.client_name,
      device: data.device,
      problem: data.problem,
    });
    setModalOpen(false);
  };

  const handleOpenFinish = (repair: Repair) => {
    setSelectedRepair(repair);
    setFinishModalOpen(true);
  };

  const handleFinish = async (id: string, payload: FinishRepairPayload) => {
    const repair = repairs.find((r) => r.id === id);
    await finishRepair(id, payload.valor);

    // Baixa peças do estoque
    for (const peca of payload.pecas) {
      const item = items.find((i) => i.id === peca.id);
      if (item) {
        await updateItem(item.id, {
          quantidade: Math.max(0, item.quantidade - peca.quantidade),
        });
      }
    }

    // Cria conta vinculada
    if (repair) {
      const isPaid = payload.formaPagamento !== "promissoria";
      const pecasDesc = payload.pecas.length
        ? ` [${payload.pecas.map((p) => `${p.nome}${p.quantidade > 1 ? ` ${p.quantidade}x` : ""}`).join(", ")}]`
        : "";
      await addAccount({
        client_id: repair.client_id || undefined,
        client_name: repair.client_name,
        descricao: `Conserto: ${repair.device} – ${repair.problem}${pecasDesc}`,
        valor_total: payload.valor,
        valor_pago: isPaid ? payload.valor : 0,
        parcelas: payload.parcelas || 1,
        forma_pagamento: payload.formaPagamento,
        vencimento: payload.vencimento || undefined,
        origem: "conserto",
      });
    }

    setFinishModalOpen(false);
  };

  const handleReceipt = (repair: Repair) => {
    setReceiptRepair(repair);
    setReceiptOpen(true);
  };

  const handleEdit = (repair: Repair) => {
    setSelectedRepair(repair);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (id: string, payload: EditRepairPayload) => {
    await updateRepair(id, {
      device: payload.device,
      client_name: payload.client_name,
      client_id: payload.client_id || null,
      problem: payload.problem,
      notes: payload.notes || null,
      value: payload.value ?? null,
    });
    setEditModalOpen(false);
  };

  const handleChangeDeliveredAt = async (id: string, date: Date) => {
    await updateRepair(id, { delivered_at: date.toISOString() });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderGrid = (list: Repair[], emptyMsg: string) =>
    list.length === 0 ? (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        {emptyMsg}
      </div>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((repair) => (
          <RepairCard
            key={repair.id}
            repair={repair}
            onStart={startRepair}
            onFinish={handleOpenFinish}
            onDeliver={deliverRepair}
            onEdit={handleEdit}
            onDelete={deleteRepair}
            onChangeDeliveredAt={repair.status === "entregue" ? handleChangeDeliveredAt : undefined}
            onOpenClient={(id, name) => setClientDrawer({ id, name })}
            onReceipt={handleReceipt}
            canEdit={canEdit}
          />
        ))}
      </div>
    );

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Consertos</h1>
        {canEdit && (
          <Button className="gradient-primary text-primary-foreground border-0" onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Conserto
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por aparelho ou cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-input bg-card py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <Tabs defaultValue="pendentes" className="w-full">
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="pendentes" className="gap-2">
            <Clock className="h-4 w-4" />
            Pendentes ({pendentes.length})
          </TabsTrigger>
          <TabsTrigger value="prontos" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Prontos ({prontos.length})
          </TabsTrigger>
          <TabsTrigger value="entregues" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Entregues ({entregues.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="mt-4">{renderGrid(pendentes, "Nenhum conserto pendente.")}</TabsContent>
        <TabsContent value="prontos" className="mt-4">{renderGrid(prontos, "Nenhum conserto pronto para entrega.")}</TabsContent>
        <TabsContent value="entregues" className="mt-4">{renderGrid(entregues, "Nenhum conserto entregue.")}</TabsContent>
      </Tabs>

      <AddRepairModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAddRepair} />
      <EditRepairModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        repair={selectedRepair}
        onSave={handleSaveEdit}
      />
      <FinishRepairModal
        open={finishModalOpen}
        onClose={() => setFinishModalOpen(false)}
        repair={selectedRepair}
        onFinish={handleFinish}
      />
      <ClientDetailDrawer
        open={!!clientDrawer}
        onClose={() => setClientDrawer(null)}
        clientId={clientDrawer?.id ?? null}
        fallbackName={clientDrawer?.name ?? ""}
      />
      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        account={
          receiptRepair
            ? {
                id: 0,
                cliente: receiptRepair.client_name,
                telefone: "",
                descricao: `Conserto: ${receiptRepair.device} – ${receiptRepair.problem}`,
                valor: Number(receiptRepair.value || 0),
                valorPago: Number(receiptRepair.value || 0),
                dataVencimento: format(new Date(receiptRepair.finished_at || receiptRepair.created_at), "dd/MM/yyyy", { locale: ptBR }),
                formaPagamento: "avista" as any,
                numeroParcelas: 1,
                status: "pago" as any,
              }
            : null
        }
      />
    </div>
  );
}
