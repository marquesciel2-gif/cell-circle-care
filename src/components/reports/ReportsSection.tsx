import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Receipt, FileText, Wallet } from "lucide-react";
import { SalesReport } from "./SalesReport";
import { AccountsReport } from "./AccountsReport";
import { ExpensesReport } from "./ExpensesReport";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { UpgradeNotice } from "@/components/UpgradeNotice";

export function ReportsSection() {
  const { allowed } = useFeatureGate("advanced_reports");
  if (!allowed) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
            <p className="text-sm text-muted-foreground">Visualize vendas e contas</p>
          </div>
        </div>
        <UpgradeNotice
          title="Relatórios avançados"
          message="Relatórios completos de vendas, contas e despesas estão disponíveis nos planos Pro e Business."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">
            Visualize vendas e contas
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="vendas" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="vendas" className="gap-2">
            <Receipt className="h-4 w-4" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="contas" className="gap-2">
            <FileText className="h-4 w-4" />
            Contas a Receber
          </TabsTrigger>
          <TabsTrigger value="despesas" className="gap-2">
            <Wallet className="h-4 w-4" />
            Despesas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="mt-4">
          <SalesReport />
        </TabsContent>

        <TabsContent value="contas" className="mt-4">
          <AccountsReport />
        </TabsContent>

        <TabsContent value="despesas" className="mt-4">
          <ExpensesReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
