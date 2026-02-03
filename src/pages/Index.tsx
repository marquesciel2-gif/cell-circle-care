import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { RepairsSection } from "@/components/repairs/RepairsSection";
import { AccountsReceivable } from "@/components/accounts/AccountsReceivable";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { ReportsSection } from "@/components/reports/ReportsSection";
import { ClientsSection } from "@/components/clients/ClientsSection";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isTecnico, isVendedor, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const hasAccess = (section: string): boolean => {
    if (isAdmin) return true;

    const accessMap: Record<string, ("admin" | "tecnico" | "vendedor")[]> = {
      dashboard: ["admin", "tecnico", "vendedor"],
      novos: ["admin", "vendedor"],
      usados: ["admin", "vendedor"],
      acessorios: ["admin", "vendedor"],
      eletros: ["admin", "vendedor"],
      clientes: ["admin", "tecnico", "vendedor"],
      consertos: ["admin", "tecnico"],
      contas: ["admin", "vendedor"],
      relatorios: ["admin"],
      configuracoes: ["admin", "tecnico", "vendedor"],
    };

    const allowedRoles = accessMap[section] || [];
    if (isTecnico && allowedRoles.includes("tecnico")) return true;
    if (isVendedor && allowedRoles.includes("vendedor")) return true;
    return false;
  };

  const handleSectionChange = (section: string) => {
    if (hasAccess(section)) {
      setActiveSection(section);
      setSidebarOpen(false);
    }
  };

  const renderContent = () => {
    if (!hasAccess(activeSection)) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            Você não tem permissão para acessar esta seção.
          </p>
        </div>
      );
    }

    switch (activeSection) {
      case "dashboard":
        return <Dashboard onNavigate={handleSectionChange} />;
      case "novos":
        return <InventoryTable title="Aparelhos Novos" type="novos" />;
      case "usados":
        return <InventoryTable title="Segunda Mão" type="usados" />;
      case "acessorios":
        return <InventoryTable title="Acessórios" type="acessorios" />;
      case "eletros":
        return <InventoryTable title="Móveis e Eletros" type="eletros" />;
      case "clientes":
        return <ClientsSection />;
      case "consertos":
        return <RepairsSection />;
      case "contas":
        return <AccountsReceivable />;
      case "relatorios":
        return <ReportsSection />;
      case "configuracoes":
        return <SettingsSection />;
      default:
        return <Dashboard onNavigate={handleSectionChange} />;
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={handleSectionChange}
        />
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
