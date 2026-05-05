import { useState } from "react";
import { 
  Search, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Wrench,
  Phone,
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
import { AddRepairModal } from "@/components/modals/AddRepairModal";
import { EditRepairModal } from "@/components/modals/EditRepairModal";
import { FinishRepairModal } from "@/components/modals/FinishRepairModal";
import { useRepairs, Repair } from "@/hooks/useRepairs";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  pendente: { 
    label: "Pendente", 
    icon: Clock, 
    className: "bg-warning/10 text-warning border-warning/20" 
  },
  em_andamento: { 
    label: "Em Andamento", 
    icon: Wrench, 
    className: "bg-accent/10 text-accent border-accent/20" 
  },
  pronto: { 
    label: "Pronto", 
    icon: CheckCircle2, 
    className: "bg-success/10 text-success border-success/20" 
  },
  entregue: { 
    label: "Entregue", 
    icon: CheckCircle2, 
    className: "bg-muted text-muted-foreground border-muted" 
  },
};

interface RepairCardProps {
  repair: Repair;
  onStart: (id: string) => void;
  onFinish: (repair: Repair) => void;
  onDeliver: (id: string) => void;
  onEdit: (repair: Repair) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}

function RepairCard({ repair, onStart, onFinish, onDeliver, onEdit, onDelete, canEdit }: RepairCardProps) {
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
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{repair.client_name}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Entrada: {format(new Date(repair.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-lg font-bold text-foreground">
          {repair.value ? `R$ ${Number(repair.value).toLocaleString('pt-BR')}` : "Valor a definir"}
        </span>
        <div className="flex gap-2">
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
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  
  const { repairs, loading, addRepair, startRepair, finishRepair, deliverRepair, updateRepair, deleteRepair } = useRepairs();
  const { isAdmin, isTecnico } = useUserRole();

  const canEdit = isAdmin || isTecnico;

  const filteredRepairs = repairs.filter(r =>
    r.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const pendentes = filteredRepairs.filter(r => r.status === "pendente" || r.status === "em_andamento");
  const prontos = filteredRepairs.filter(r => r.status === "pronto");
  const entregues = filteredRepairs.filter(r => r.status === "entregue");

  const handleAddRepair = async (data: { client_name: string; device: string; problem: string }) => {
    await addRepair({
      client_name: data.client_name,
      device: data.device,
      problem: data.problem,
    });
    setModalOpen(false);
  };

  const handleStart = async (id: string) => {
    await startRepair(id);
  };

  const handleOpenFinish = (repair: Repair) => {
    setSelectedRepair(repair);
    setFinishModalOpen(true);
  };

  const handleFinish = async (id: string, valor: number) => {
    await finishRepair(id, valor);
    setFinishModalOpen(false);
  };

  const handleDeliver = async (id: string) => {
    await deliverRepair(id);
  };

  const handleEdit = (repair: Repair) => {
    setSelectedRepair(repair);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedRepair: any) => {
    if (selectedRepair) {
      await updateRepair(selectedRepair.id, {
        device: updatedRepair.aparelho || updatedRepair.device,
        client_name: updatedRepair.cliente || updatedRepair.client_name,
        problem: updatedRepair.problema || updatedRepair.problem,
      });
      setEditModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteRepair(id);
  };

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
        <h1 className="text-2xl font-bold text-foreground">Consertos</h1>
        {canEdit && (
          <Button 
            className="gradient-primary text-primary-foreground border-0"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Conserto
          </Button>
        )}
      </div>

      {/* Search */}
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

      {/* Tabs */}
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

        <TabsContent value="pendentes" className="mt-4">
          {pendentes.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              Nenhum conserto pendente.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendentes.map((repair) => (
                <RepairCard 
                  key={repair.id} 
                  repair={repair} 
                  onStart={handleStart}
                  onFinish={handleOpenFinish}
                  onDeliver={handleDeliver}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  canEdit={canEdit}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="prontos" className="mt-4">
          {prontos.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              Nenhum conserto pronto para entrega.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {prontos.map((repair) => (
                <RepairCard 
                  key={repair.id} 
                  repair={repair}
                  onStart={handleStart}
                  onFinish={handleOpenFinish}
                  onDeliver={handleDeliver}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  canEdit={canEdit}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="entregues" className="mt-4">
          {entregues.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              Nenhum conserto entregue.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {entregues.map((repair) => (
                <RepairCard 
                  key={repair.id} 
                  repair={repair}
                  onStart={handleStart}
                  onFinish={handleOpenFinish}
                  onDeliver={handleDeliver}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  canEdit={canEdit}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddRepairModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddRepair}
      />
      <EditRepairModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        repair={selectedRepair ? {
          id: parseInt(selectedRepair.id) || 0,
          aparelho: selectedRepair.device,
          cliente: selectedRepair.client_name,
          telefone: "",
          problema: selectedRepair.problem,
          dataEntrada: format(new Date(selectedRepair.created_at), "dd/MM/yyyy", { locale: ptBR }),
          previsao: "",
          valor: selectedRepair.value ? Number(selectedRepair.value) : undefined,
          status: selectedRepair.status as any,
        } : null}
        onSave={handleSaveEdit}
      />
      <FinishRepairModal
        open={finishModalOpen}
        onClose={() => setFinishModalOpen(false)}
        repair={selectedRepair ? {
          id: parseInt(selectedRepair.id) || 0,
          aparelho: selectedRepair.device,
          cliente: selectedRepair.client_name,
          telefone: "",
          problema: selectedRepair.problem,
          dataEntrada: format(new Date(selectedRepair.created_at), "dd/MM/yyyy", { locale: ptBR }),
          previsao: "",
          valor: selectedRepair.value ? Number(selectedRepair.value) : undefined,
          status: selectedRepair.status as any,
        } : null}
        onFinish={(id, valor) => selectedRepair && handleFinish(selectedRepair.id, valor)}
      />
    </div>
  );
}
