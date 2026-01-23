import { 
  Plus, 
  Wrench,
  Receipt,
  Smartphone,
  Package,
  Headphones
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onNavigate?: (section: string) => void;
}

const actions = [
  { 
    label: "Novo Aparelho", 
    icon: Smartphone, 
    section: "novos",
    className: "gradient-primary text-primary-foreground border-0"
  },
  { 
    label: "Segunda Mão", 
    icon: Package, 
    section: "usados",
    className: ""
  },
  { 
    label: "Novo Acessório", 
    icon: Headphones, 
    section: "acessorios",
    className: ""
  },
  { 
    label: "Novo Conserto", 
    icon: Wrench, 
    section: "consertos",
    className: ""
  },
  { 
    label: "Nova Conta", 
    icon: Receipt, 
    section: "contas",
    className: ""
  },
];

export function QuickActions({ onNavigate }: QuickActionsProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="section-title mb-4">Ações Rápidas</h2>
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant={action.className ? "default" : "outline"}
              className={`w-full justify-start gap-3 ${action.className}`}
              onClick={() => onNavigate?.(action.section)}
            >
              <Icon className="h-5 w-5" />
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
