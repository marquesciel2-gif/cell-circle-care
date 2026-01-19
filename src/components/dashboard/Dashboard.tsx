import { Smartphone, Package, Wrench, Receipt, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { StatCard } from "./StatCard";
import { RecentActivity } from "./RecentActivity";
import { QuickActions } from "./QuickActions";
export function Dashboard() {
  return <div className="space-y-6 animate-slide-up">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Estoque Total" value={156} subtitle="Aparelhos em estoque" icon={Smartphone} trend={{
        value: 12,
        isPositive: true
      }} variant="primary" />
        <StatCard title="Consertos Pendentes" value={8} subtitle="Aguardando reparo" icon={Wrench} variant="warning" />
        <StatCard title="Consertos Prontos" value={5} subtitle="Para retirada" icon={CheckCircle2} variant="success" />
        <StatCard title="Contas a Receber" value="R$ 4.580" subtitle="Este mês" icon={Receipt} variant="danger" />
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
              <p className="text-2xl font-bold">0</p>
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
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Acessórios</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>;
}