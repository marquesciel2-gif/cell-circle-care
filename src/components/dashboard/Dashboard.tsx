import { Smartphone, Package, Wrench, Receipt, Headphones } from "lucide-react";
import { StatCard } from "./StatCard";
import { QuickActions } from "./QuickActions";
import { InventoryItem, Repair, Account } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface DashboardProps {
  onNavigate?: (section: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [novos] = useLocalStorage<InventoryItem[]>("inventory_novos", []);
  const [usados] = useLocalStorage<InventoryItem[]>("inventory_usados", []);
  const [acessorios] = useLocalStorage<InventoryItem[]>("inventory_acessorios", []);
  const [repairs] = useLocalStorage<Repair[]>("repairs", []);
  const [accounts] = useLocalStorage<Account[]>("accounts", []);

  const totalNovos = novos.reduce((sum, item) => sum + item.quantidade, 0);
  const totalUsados = usados.reduce((sum, item) => sum + item.quantidade, 0);
  const totalAcessorios = acessorios.reduce((sum, item) => sum + item.quantidade, 0);
  const totalEstoque = totalNovos + totalUsados + totalAcessorios;

  const consertosPendentes = repairs.filter(r => r.status === "pendente" || r.status === "em_andamento").length;
  const consertosProntos = repairs.filter(r => r.status === "pronto").length;

  const totalContasReceber = accounts
    .filter(a => a.status !== "pago")
    .reduce((sum, a) => sum + (a.valor - a.valorPago), 0);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Estoque Total" 
          value={totalEstoque} 
          subtitle="Aparelhos em estoque" 
          icon={Smartphone} 
          variant="primary" 
        />
        <StatCard 
          title="Consertos Pendentes" 
          value={consertosPendentes} 
          subtitle="Aguardando reparo" 
          icon={Wrench} 
          variant="warning" 
        />
        <StatCard 
          title="Consertos Prontos" 
          value={consertosProntos} 
          subtitle="Para retirada" 
          icon={Wrench} 
          variant="success" 
        />
        <StatCard 
          title="Contas a Receber" 
          value={`R$ ${totalContasReceber.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} 
          subtitle="Total pendente" 
          icon={Receipt} 
          variant="danger" 
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Novos</p>
              <p className="text-2xl font-bold">{totalNovos}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <Package className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Usados</p>
              <p className="text-2xl font-bold">{totalUsados}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <Headphones className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Acessórios</p>
              <p className="text-2xl font-bold">{totalAcessorios}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-md">
        <QuickActions onNavigate={onNavigate} />
      </div>
    </div>
  );
}
