import { 
  Plus, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Wrench,
  Receipt,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  { 
    label: "Nova Entrada", 
    icon: ArrowDownCircle, 
    variant: "default" as const,
    className: "gradient-primary text-primary-foreground border-0"
  },
  { 
    label: "Registrar Saída", 
    icon: ArrowUpCircle, 
    variant: "outline" as const,
    className: ""
  },
  { 
    label: "Novo Conserto", 
    icon: Wrench, 
    variant: "outline" as const,
    className: ""
  },
  { 
    label: "Nova Conta", 
    icon: Receipt, 
    variant: "outline" as const,
    className: ""
  },
];

export function QuickActions() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="section-title mb-4">Ações Rápidas</h2>
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant={action.variant}
              className={`w-full justify-start gap-3 ${action.className}`}
            >
              <Icon className="h-5 w-5" />
              {action.label}
            </Button>
          );
        })}
      </div>

      {/* Search Box */}
      <div className="mt-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar aparelho..."
            className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}
