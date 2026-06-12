import { Bell, Menu, User, Settings, LogOut, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import type { AppSettings } from "@/types";
import { StoreSwitcher } from "./StoreSwitcher";

interface HeaderProps {
  onMenuClick: () => void;
  onNavigate?: (section: string) => void;
}

export function Header({ onMenuClick, onNavigate }: HeaderProps) {
  const [settings] = useLocalStorage<AppSettings>("appSettings", {
    theme: "dark",
    storeName: "CellStore",
    storePhone: "",
    storeAddress: "",
  });
  const { user, signOut } = useAuth();
  const { isSuperAdmin } = useTenant();
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    if (onNavigate) {
      onNavigate("configuracoes");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">Bem-vindo de volta!</p>
          <h2 className="font-semibold text-foreground">{settings.storeName || "CellStore"}</h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <StoreSwitcher />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Minha Conta</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || "Usuário"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            {isSuperAdmin && (
              <DropdownMenuItem onClick={() => navigate("/app/ceo")} className="cursor-pointer">
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Painel CEO</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
