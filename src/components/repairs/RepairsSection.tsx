import { useState } from "react";
import { 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Wrench,
  Phone,
  User,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Repair {
  id: number;
  aparelho: string;
  cliente: string;
  telefone: string;
  problema: string;
  dataEntrada: string;
  previsao: string;
  valor: number;
  status: "pendente" | "em_andamento" | "pronto" | "entregue";
}

const mockRepairs: Repair[] = [
  { id: 1, aparelho: "iPhone 12 - Tela quebrada", cliente: "João Silva", telefone: "(11) 99999-1234", problema: "Troca de tela", dataEntrada: "15/01/2025", previsao: "18/01/2025", valor: 450, status: "pendente" },
  { id: 2, aparelho: "Galaxy S21 - Bateria", cliente: "Maria Santos", telefone: "(11) 98888-5678", problema: "Troca de bateria", dataEntrada: "14/01/2025", previsao: "16/01/2025", valor: 180, status: "em_andamento" },
  { id: 3, aparelho: "Moto G52 - Conector", cliente: "Carlos Oliveira", telefone: "(11) 97777-9012", problema: "Troca de conector de carga", dataEntrada: "13/01/2025", previsao: "15/01/2025", valor: 120, status: "pronto" },
  { id: 4, aparelho: "iPhone 11 - Câmera", cliente: "Ana Costa", telefone: "(11) 96666-3456", problema: "Câmera não funciona", dataEntrada: "12/01/2025", previsao: "17/01/2025", valor: 350, status: "pendente" },
  { id: 5, aparelho: "Redmi Note 12 - Display", cliente: "Pedro Lima", telefone: "(11) 95555-7890", problema: "Display com manchas", dataEntrada: "10/01/2025", previsao: "14/01/2025", valor: 280, status: "pronto" },
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

function RepairCard({ repair }: { repair: Repair }) {
  const config = statusConfig[repair.status];
  const StatusIcon = config.icon;

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">{repair.aparelho}</h3>
          <p className="text-sm text-muted-foreground">{repair.problema}</p>
        </div>
        <Badge variant="outline" className={cn("text-xs", config.className)}>
          <StatusIcon className="mr-1 h-3 w-3" />
          {config.label}
        </Badge>
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
          R$ {repair.valor.toLocaleString('pt-BR')}
        </span>
        <div className="flex gap-2">
          {repair.status === "pendente" && (
            <Button size="sm" variant="outline">
              Iniciar Reparo
            </Button>
          )}
          {repair.status === "em_andamento" && (
            <Button size="sm" className="gradient-success text-success-foreground border-0">
              Finalizar
            </Button>
          )}
          {repair.status === "pronto" && (
            <Button size="sm" className="gradient-primary text-primary-foreground border-0">
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
  
  const pendentes = mockRepairs.filter(r => r.status === "pendente" || r.status === "em_andamento");
  const prontos = mockRepairs.filter(r => r.status === "pronto");

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Consertos</h1>
        <Button className="gradient-primary text-primary-foreground border-0">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendentes.map((repair) => (
              <RepairCard key={repair.id} repair={repair} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="prontos" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {prontos.map((repair) => (
              <RepairCard key={repair.id} repair={repair} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
