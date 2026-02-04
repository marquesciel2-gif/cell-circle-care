import { useState, useRef } from "react";
import { Sun, Moon, Monitor, Store, Phone, MapPin, Save, Camera, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AppSettings } from "@/types";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { TeamSection } from "./TeamSection";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const defaultSettings: AppSettings = {
  theme: "system",
  storeName: "CellStore",
  storePhone: "",
  storeAddress: "",
};

export function SettingsSection() {
  const { theme, setTheme } = useTheme();
  const { isAdmin, isTecnico, isVendedor, loading: rolesLoading } = useUserRole();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useLocalStorage<AppSettings>("appSettings", defaultSettings);
  const [storeName, setStoreName] = useState(settings.storeName);
  const [storePhone, setStorePhone] = useState(settings.storePhone);
  const [storeAddress, setStoreAddress] = useState(settings.storeAddress);

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const getRoleBadge = () => {
    if (rolesLoading) return null;
    if (isAdmin) return { label: "Administrador", variant: "default" as const };
    if (isTecnico) return { label: "Técnico", variant: "secondary" as const };
    if (isVendedor) return { label: "Vendedor", variant: "outline" as const };
    return null;
  };

  const roleBadge = getRoleBadge();

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Erro", description: "Por favor, selecione uma imagem válida.", variant: "destructive" });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Erro", description: "A imagem deve ter no máximo 2MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Foto atualizada!", description: "Sua foto de perfil foi alterada com sucesso." });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar a foto.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <h1 className="text-2xl font-bold text-foreground">Configurações</h1>

      {/* Perfil do Usuário */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Meu Perfil
        </h2>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-2 border-border">
              <AvatarImage src={profile?.avatar_url || ""} alt={profile?.nome || "Avatar"} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {profile?.nome ? getInitials(profile.nome) : <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarClick}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="h-6 w-6 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-foreground">
                {profile?.nome || "Usuário"}
              </h3>
              {roleBadge && (
                <Badge variant={roleBadge.variant} className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {roleBadge.label}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {profile?.cpf && (
              <p className="text-sm text-muted-foreground">CPF: {profile.cpf}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Clique na foto para alterá-la
            </p>
          </div>
        </div>
      </div>

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
