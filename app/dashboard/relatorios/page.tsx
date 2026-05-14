import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users,
  Wrench,
  Package,
  CreditCard
} from 'lucide-react'
import { RelatorioFinanceiro } from '@/components/relatorios/relatorio-financeiro'
import { RelatorioConsertos } from '@/components/relatorios/relatorio-consertos'
import { RelatorioEstoque } from '@/components/relatorios/relatorio-estoque'
import { RelatorioClientes } from '@/components/relatorios/relatorio-clientes'
import { RelatorioCrediario } from '@/components/relatorios/relatorio-crediario'

export default async function RelatoriosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  const empresaId = usuario?.empresa_id
  if (!empresaId) return null

  // Buscar resumo geral
  const mesAtual = new Date()
  const primeiroDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).toISOString()
  const ultimoDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).toISOString()

  const [
    { data: receitasMes },
    { data: despesasMes },
    { count: totalConsertos },
    { count: totalClientes },
    { data: parcelasPendentes }
  ] = await Promise.all([
    supabase.from('receitas').select('valor').eq('empresa_id', empresaId).eq('status', 'pago').gte('data_pagamento', primeiroDiaMes).lte('data_pagamento', ultimoDiaMes),
    supabase.from('despesas').select('valor').eq('empresa_id', empresaId).eq('status', 'pago').gte('data_pagamento', primeiroDiaMes).lte('data_pagamento', ultimoDiaMes),
    supabase.from('consertos').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId).gte('created_at', primeiroDiaMes),
    supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId),
    supabase.from('parcelas').select('valor').eq('empresa_id', empresaId).eq('status', 'pendente')
  ])

  const totalReceitas = receitasMes?.reduce((acc, r) => acc + r.valor, 0) || 0
  const totalDespesas = despesasMes?.reduce((acc, d) => acc + d.valor, 0) || 0
  const lucro = totalReceitas - totalDespesas
  const totalCrediario = parcelasPendentes?.reduce((acc, p) => acc + p.valor, 0) || 0

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Visualize e exporte relatórios do seu negócio
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas (Mês)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{formatCurrency(totalReceitas)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas (Mês)</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(totalDespesas)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro (Mês)</CardTitle>
            <DollarSign className={`h-4 w-4 ${lucro >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lucro >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {formatCurrency(lucro)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crediário Pendente</CardTitle>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{formatCurrency(totalCrediario)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consertos (Mês)</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConsertos || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Relatórios */}
      <Tabs defaultValue="financeiro" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="financeiro" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Financeiro</span>
          </TabsTrigger>
          <TabsTrigger value="crediario" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Crediário</span>
          </TabsTrigger>
          <TabsTrigger value="consertos" className="gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Consertos</span>
          </TabsTrigger>
          <TabsTrigger value="estoque" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Estoque</span>
          </TabsTrigger>
          <TabsTrigger value="clientes" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Clientes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financeiro">
          <RelatorioFinanceiro empresaId={empresaId} />
        </TabsContent>

        <TabsContent value="crediario">
          <RelatorioCrediario empresaId={empresaId} />
        </TabsContent>

        <TabsContent value="consertos">
          <RelatorioConsertos empresaId={empresaId} />
        </TabsContent>

        <TabsContent value="estoque">
          <RelatorioEstoque empresaId={empresaId} />
        </TabsContent>

        <TabsContent value="clientes">
          <RelatorioClientes empresaId={empresaId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
