import { 
  LayoutDashboard, 
  Smartphone, 
  Package, 
  Wrench, 
  Receipt, 
  Headphones,
  BarChart3,
  Tv,
  Users,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useUserRole } from "@/hooks/useUserRole";
import type { AppSettings } from "@/types";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  roles: ("admin" | "tecnico" | "vendedor")[];
}

const menuItems: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "tecnico", "vendedor"] },
  { id: "novos", label: "Aparelhos Novos", icon: Smartphone, roles: ["admin", "vendedor"] },
  { id: "usados", label: "Segunda Mão", icon: Package, roles: ["admin", "vendedor"] },
  { id: "acessorios", label: "Acessórios", icon: Headphones, roles: ["admin", "vendedor"] },
  { id: "eletros", label: "Móveis e Eletros", icon: Tv, roles: ["admin", "vendedor"] },
  { id: "clientes", label: "Clientes", icon: Users, roles: ["admin", "tecnico", "vendedor"] },
  { id: "consertos", label: "Consertos", icon: Wrench, roles: ["admin", "tecnico"] },
  { id: "contas", label: "Contas a Receber", icon: Receipt, roles: ["admin", "vendedor"] },
  { id: "relatorios", label: "Relatórios", icon: BarChart3, roles: ["admin"] },
  { id: "despesas", label: "Despesas", icon: Wallet, roles: ["admin", "vendedor"] },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [settings] = useLocalStorage<AppSettings>("appSettings", {
    theme: "dark",
    storeName: "CellStore",
    storePhone: "",
    storeAddress: "",
  });

  const { isAdmin, isTecnico, isVendedor, loading } = useUserRole();

  const hasAccess = (roles: ("admin" | "tecnico" | "vendedor")[]) => {
    if (isAdmin) return true;
    if (isTecnico && roles.includes("tecnico")) return true;
    if (isVendedor && roles.includes("vendedor")) return true;
    return false;
  };

  const visibleItems = menuItems.filter(item => hasAccess(item.roles));

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-accent">
            <Smartphone className="h-5 w-5 text-sidebar-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">{settings.storeName || "CellStore"}</h1>
            <p className="text-xs text-sidebar-foreground/60">Sistema de Gestão</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {visibleItems.map((item) => {
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

      </div>
    </aside>
  );
}
