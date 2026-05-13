import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Wrench, 
  Package, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react'
import { DashboardCharts } from '@/components/dashboard/charts'
import { RecentConsertos } from '@/components/dashboard/recent-consertos'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Buscar estatísticas
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()
  
  const empresaId = usuario?.empresa_id

  // Se não tem empresa, mostrar tela de boas-vindas
  if (!empresaId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Bem-vindo ao Smart Cell!</h1>
          <p className="text-muted-foreground">
            Sua conta foi criada, mas ainda não está vinculada a uma empresa.
          </p>
          <p className="text-muted-foreground text-sm">
            Entre em contato com o administrador ou aguarde a configuração da sua conta.
          </p>
        </div>
      </div>
    )
  }

  // Buscar contagens
  const [
    { count: totalClientes },
    { count: totalConsertos },
    { count: consertosAbertos },
    { count: consertosFinalizados },
    { count: itensEstoqueBaixo },
    { data: receitasMes },
    { data: despesasMes },
    { data: recentConsertos }
  ] = await Promise.all([
    supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId),
    supabase.from('consertos').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId),
    supabase.from('consertos').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId).in('status', ['recebido', 'diagnostico', 'aguardando_aprovacao', 'em_reparo']),
    supabase.from('consertos').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId).eq('status', 'entregue'),
    supabase.from('estoque').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId).filter('quantidade', 'lte', 'quantidade_minima'),
    supabase.from('receitas').select('valor').eq('empresa_id', empresaId).eq('status', 'pago').gte('data_pagamento', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from('despesas').select('valor').eq('empresa_id', empresaId).eq('status', 'pago').gte('data_pagamento', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from('consertos').select('*, cliente:clientes(nome)').eq('empresa_id', empresaId).order('created_at', { ascending: false }).limit(5)
  ])

  const totalReceitasMes = receitasMes?.reduce((acc, r) => acc + Number(r.valor), 0) || 0
  const totalDespesasMes = despesasMes?.reduce((acc, d) => acc + Number(d.valor), 0) || 0
  const lucroMes = totalReceitasMes - totalDespesasMes

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da sua assistência técnica
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClientes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total de clientes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Consertos Abertos</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consertosAbertos || 0}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando conclusão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consertosFinalizados || 0}</div>
            <p className="text-xs text-muted-foreground">
              Consertos entregues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itensEstoqueBaixo || 0}</div>
            <p className="text-xs text-muted-foreground">
              Itens abaixo do mínimo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards Financeiros */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceitasMes)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesasMes)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro do Mês</CardTitle>
            <DollarSign className={`h-4 w-4 ${lucroMes >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lucroMes >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lucroMes)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Lista Recente */}
      <div className="grid gap-4 md:grid-cols-2">
        <DashboardCharts />
        <RecentConsertos consertos={recentConsertos || []} />
      </div>
    </div>
  )
}
