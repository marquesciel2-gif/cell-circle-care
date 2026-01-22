import { Wrench, CheckCircle2, Package, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

const statusItems = [
  {
    id: 1,
    type: "conserto",
    title: "Consertos Pendentes",
    count: 0,
    icon: Wrench,
    iconColor: "text-warning",
    bgColor: "bg-warning/10"
  },
  {
    id: 2,
    type: "pronto",
    title: "Prontos para Retirada",
    count: 0,
    icon: CheckCircle2,
    iconColor: "text-success",
    bgColor: "bg-success/10"
  },
  {
    id: 3,
    type: "usados",
    title: "Aparelhos Usados",
    count: 0,
    icon: Package,
    iconColor: "text-accent",
    bgColor: "bg-accent/10"
  },
  {
    id: 4,
    type: "novos",
    title: "Aparelhos Novos",
    count: 0,
    icon: Smartphone,
    iconColor: "text-primary",
    bgColor: "bg-primary/10"
  }
];

export function RecentActivity() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="section-title">Resumo do Estoque</h2>
      </div>
      <div className="space-y-4">
        {statusItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  item.bgColor
                )}
              >
                <Icon className={cn("h-5 w-5", item.iconColor)} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{item.title}</p>
              </div>
              <div className="text-2xl font-bold text-foreground">{item.count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
