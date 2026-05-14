import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { ReceitasTable } from '@/components/financeiro/receitas-table'
import { DespesasTable } from '@/components/financeiro/despesas-table'

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'receitas' } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  const empresaId = usuario?.empresa_id

  // Buscar receitas
  const { data: receitas } = await supabase
    .from('receitas')
    .select('*, cliente:clientes(nome), conserto:consertos(numero)')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })

  // Buscar despesas
  const { data: despesas } = await supabase
    .from('despesas')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })

  // Calcular totais do mês
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  
  const { data: receitasMes } = await supabase
    .from('receitas')
    .select('valor, status')
    .eq('empresa_id', empresaId)
    .gte('created_at', inicioMes)

  const { data: despesasMes } = await supabase
    .from('despesas')
    .select('valor, status')
    .eq('empresa_id', empresaId)
    .gte('created_at', inicioMes)

  const totalReceitasMes = receitasMes?.filter(r => r.status === 'pago').reduce((acc, r) => acc + Number(r.valor), 0) || 0
  const totalDespesasMes = despesasMes?.filter(d => d.status === 'pago').reduce((acc, d) => acc + Number(d.valor), 0) || 0
  const receitasPendentes = receitasMes?.filter(r => r.status === 'pendente').reduce((acc, r) => acc + Number(r.valor), 0) || 0
  const despesasPendentes = despesasMes?.filter(d => d.status === 'pendente').reduce((acc, d) => acc + Number(d.valor), 0) || 0
  const lucroMes = totalReceitasMes - totalDespesasMes

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie receitas e despesas da sua assistência
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/financeiro/despesas/novo">
              <TrendingDown className="mr-2 h-4 w-4 text-red-500" />
              Nova Despesa
            </Link>
          </Button>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/dashboard/financeiro/receitas/novo">
              <TrendingUp className="mr-2 h-4 w-4" />
              Nova Receita
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receitas (Mês)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceitasMes)}
            </div>
            {receitasPendentes > 0 && (
              <p className="text-xs text-muted-foreground">
                + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitasPendentes)} pendente
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Despesas (Mês)</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesasMes)}
            </div>
            {despesasPendentes > 0 && (
              <p className="text-xs text-muted-foreground">
                + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesasPendentes)} pendente
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro (Mês)</CardTitle>
            <DollarSign className={`h-4 w-4 ${lucroMes >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lucroMes >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lucroMes)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Margem</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalReceitasMes > 0 
                ? `${((lucroMes / totalReceitasMes) * 100).toFixed(1)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Margem de lucro
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={tab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="receitas" asChild>
            <Link href="/dashboard/financeiro?tab=receitas">Receitas</Link>
          </TabsTrigger>
          <TabsTrigger value="despesas" asChild>
            <Link href="/dashboard/financeiro?tab=despesas">Despesas</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receitas">
          <ReceitasTable receitas={receitas || []} />
        </TabsContent>

        <TabsContent value="despesas">
          <DespesasTable despesas={despesas || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
