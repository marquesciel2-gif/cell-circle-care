import { useState } from "react";
import { Sun, Moon, Monitor, Store, Phone, MapPin, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AppSettings } from "@/types";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { TeamSection } from "./TeamSection";

const defaultSettings: AppSettings = {
  theme: "system",
  storeName: "CellStore",
  storePhone: "",
  storeAddress: "",
};

export function SettingsSection() {
  const { theme, setTheme } = useTheme();
  const { isAdmin } = useUserRole();
  const [settings, setSettings] = useLocalStorage<AppSettings>("appSettings", defaultSettings);
  const [storeName, setStoreName] = useState(settings.storeName);
  const [storePhone, setStorePhone] = useState(settings.storePhone);
  const [storeAddress, setStoreAddress] = useState(settings.storeAddress);

  const handleSaveSettings = () => {
    setSettings({
      ...settings,
      storeName,
      storePhone,
      storeAddress,
    });
    toast({ title: "Configurações salvas!", description: "Suas preferências foram atualizadas." });
  };

  const themeOptions = [
    { value: "light" as const, label: "Claro", icon: Sun },
    { value: "dark" as const, label: "Escuro", icon: Moon },
    { value: "system" as const, label: "Sistema", icon: Monitor },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <h1 className="text-2xl font-bold text-foreground">Configurações</h1>

      {/* Tema */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Aparência</h2>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Escolha o tema do aplicativo</p>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                    theme === option.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Icon className={cn("h-6 w-6", theme === option.value ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-sm font-medium", theme === option.value ? "text-primary" : "text-foreground")}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dados da Loja */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Dados da Loja</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Store className="h-4 w-4" />
              Nome da Loja
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Nome da sua loja"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefone
            </label>
            <input
              type="tel"
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço
            </label>
            <input
              type="text"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              placeholder="Endereço completo"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button onClick={handleSaveSettings} className="gradient-primary text-primary-foreground border-0">
            <Save className="mr-2 h-4 w-4" />
            Salvar Configurações
          </Button>
        </div>
      </div>

      {/* Equipe - apenas para admins */}
      {isAdmin && <TeamSection />}

      {/* Informações */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Sobre o Sistema</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong>CellStore</strong> - Sistema de Gestão para Lojas de Celulares</p>
          <p>Versão: 1.0.0</p>
          <p>Todos os dados são salvos localmente no seu navegador.</p>
        </div>
      </div>
    </div>
  );
}
