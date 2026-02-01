import { useState } from "react";
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

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveSection} />;
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
        return <Dashboard />;
    }
  };

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
          onSectionChange={(section) => {
            setActiveSection(section);
            setSidebarOpen(false);
          }} 
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
