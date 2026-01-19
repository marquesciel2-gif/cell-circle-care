import { ArrowDownCircle, ArrowUpCircle, Wrench, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
const activities = [{
  id: 1,
  type: "entrada",
  description: "iPhone 13 Pro Max - Entrada em estoque",
  time: "Há 10 minutos",
  icon: ArrowDownCircle,
  iconColor: "text-success",
  bgColor: "bg-success/10"
}, {
  id: 2,
  type: "saida",
  description: "Samsung Galaxy S23 - Vendido",
  time: "Há 25 minutos",
  icon: ArrowUpCircle,
  iconColor: "text-accent",
  bgColor: "bg-accent/10"
}, {
  id: 3,
  type: "conserto",
  description: "Motorola G52 - Enviado para reparo",
  time: "Há 1 hora",
  icon: Wrench,
  iconColor: "text-warning",
  bgColor: "bg-warning/10"
}, {
  id: 4,
  type: "pronto",
  description: "iPhone 12 - Conserto finalizado",
  time: "Há 2 horas",
  icon: CheckCircle2,
  iconColor: "text-success",
  bgColor: "bg-success/10"
}, {
  id: 5,
  type: "entrada",
  description: "Carregador Turbo 30W (5 unidades)",
  time: "Há 3 horas",
  icon: ArrowDownCircle,
  iconColor: "text-success",
  bgColor: "bg-success/10"
}];
export function RecentActivity() {
  return <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="section-title">Atividade Recente</h2>
        <button className="text-sm font-medium text-primary hover:underline">
          Ver tudo
        </button>
      </div>
      <div className="space-y-4">
        {activities.map(activity => {
        const Icon = activity.icon;
        return <div key={activity.id} className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", activity.bgColor)}>
                
              </div>
              
            </div>;
      })}
      </div>
    </div>;
}