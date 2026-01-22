import { 
  LayoutDashboard, 
  Smartphone, 
  Package, 
  Wrench, 
  ArrowDownUp, 
  Receipt, 
  Settings,
  Headphones,
  BatteryCharging,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "novos", label: "Aparelhos Novos", icon: Smartphone },
  { id: "usados", label: "Segunda Mão", icon: Package },
  { id: "acessorios", label: "Acessórios", icon: Headphones },
  { id: "consertos", label: "Consertos", icon: Wrench },
  { id: "contas", label: "Contas a Receber", icon: Receipt },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-accent">
            <Smartphone className="h-5 w-5 text-sidebar-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">CellStore</h1>
            <p className="text-xs text-sidebar-foreground/60">Sistema de Gestão</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "nav-item w-full",
                  activeSection === item.id && "nav-item-active"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <button className="nav-item w-full">
            <Settings className="h-5 w-5" />
            <span>Configurações</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
