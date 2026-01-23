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
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddRepairModal } from "@/components/modals/AddRepairModal";
import { EditRepairModal } from "@/components/modals/EditRepairModal";
import { FinishRepairModal } from "@/components/modals/FinishRepairModal";
import { Repair } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "@/hooks/use-toast";

const initialRepairs: Repair[] = [
  { id: 1, aparelho: "iPhone 12 - Tela quebrada", cliente: "João Silva", telefone: "(11) 99999-1234", problema: "Troca de tela", dataEntrada: "15/01/2025", previsao: "18/01/2025", status: "pendente" },
  { id: 2, aparelho: "Galaxy S21 - Bateria", cliente: "Maria Santos", telefone: "(11) 98888-5678", problema: "Troca de bateria", dataEntrada: "14/01/2025", previsao: "16/01/2025", valor: 180, status: "em_andamento" },
];

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
  onStart: (id: number) => void;
  onFinish: (repair: Repair) => void;
  onDeliver: (id: number) => void;
  onEdit: (repair: Repair) => void;
  onDelete: (id: number) => void;
}

function RepairCard({ repair, onStart, onFinish, onDeliver, onEdit, onDelete }: RepairCardProps) {
  const config = statusConfig[repair.status];
  const StatusIcon = config.icon;

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">{repair.aparelho}</h3>
          <p className="text-sm text-muted-foreground">{repair.problema}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs", config.className)}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
          <Button size="sm" variant="ghost" onClick={() => onEdit(repair)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(repair.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{repair.cliente}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{repair.telefone}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Entrada: {repair.dataEntrada} | Previsão: {repair.previsao}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-lg font-bold text-foreground">
          {repair.valor ? `R$ ${repair.valor.toLocaleString('pt-BR')}` : "Valor a definir"}
        </span>
        <div className="flex gap-2">
          {repair.status === "pendente" && (
            <Button size="sm" variant="outline" onClick={() => onStart(repair.id)}>
              Iniciar Reparo
            </Button>
          )}
          {repair.status === "em_andamento" && (
            <Button size="sm" className="gradient-success text-success-foreground border-0" onClick={() => onFinish(repair)}>
              Finalizar
            </Button>
          )}
          {repair.status === "pronto" && (
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
  const [repairs, setRepairs] = useLocalStorage<Repair[]>("repairs", initialRepairs);

  const filteredRepairs = repairs.filter(r =>
    r.aparelho.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const pendentes = filteredRepairs.filter(r => r.status === "pendente" || r.status === "em_andamento");
  const prontos = filteredRepairs.filter(r => r.status === "pronto");

  const handleAddRepair = (newRepair: Omit<Repair, "id" | "status">) => {
    const id = Date.now();
    setRepairs([...repairs, { ...newRepair, id, status: "pendente" }]);
    toast({
      title: "Conserto registrado!",
      description: `Conserto para ${newRepair.cliente} foi registrado.`,
    });
  };

  const handleStart = (id: number) => {
    setRepairs(repairs.map(r => r.id === id ? { ...r, status: "em_andamento" as const } : r));
    toast({ title: "Reparo iniciado!" });
  };

  const handleOpenFinish = (repair: Repair) => {
    setSelectedRepair(repair);
    setFinishModalOpen(true);
  };

  const handleFinish = (id: number, valor: number) => {
    setRepairs(repairs.map(r => r.id === id ? { ...r, status: "pronto" as const, valor } : r));
    toast({ title: "Reparo finalizado!", description: "Aparelho pronto para entrega." });
  };

  const handleDeliver = (id: number) => {
    setRepairs(repairs.filter(r => r.id !== id));
    toast({ title: "Aparelho entregue!", description: "Conserto concluído com sucesso." });
  };

  const handleEdit = (repair: Repair) => {
    setSelectedRepair(repair);
    setEditModalOpen(true);
  };

  const handleSaveEdit = (updatedRepair: Repair) => {
    setRepairs(repairs.map(r => r.id === updatedRepair.id ? updatedRepair : r));
    toast({ title: "Conserto atualizado!" });
  };

  const handleDelete = (id: number) => {
    setRepairs(repairs.filter(r => r.id !== id));
    toast({ title: "Conserto removido" });
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Consertos</h1>
        <Button 
          className="gradient-primary text-primary-foreground border-0"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Conserto
        </Button>
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
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pendentes" className="gap-2">
            <Clock className="h-4 w-4" />
            Pendentes ({pendentes.length})
          </TabsTrigger>
          <TabsTrigger value="prontos" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Prontos ({prontos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="mt-4">
          {pendentes.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              Nenhum conserto pendente. Clique em "Novo Conserto" para registrar.
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
        repair={selectedRepair}
        onSave={handleSaveEdit}
      />
      <FinishRepairModal
        open={finishModalOpen}
        onClose={() => setFinishModalOpen(false)}
        repair={selectedRepair}
        onFinish={handleFinish}
      />
    </div>
  );
}
