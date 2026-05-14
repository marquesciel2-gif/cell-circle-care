import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Package, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { EstoqueTable } from '@/components/estoque/estoque-table'

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; baixo?: string }>
}) {
  const { q, baixo } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('estoque')
    .select('*')
    .eq('empresa_id', usuario?.empresa_id)
    .order('nome', { ascending: true })

  if (q) {
    query = query.or(`nome.ilike.%${q}%,codigo.ilike.%${q}%,categoria.ilike.%${q}%`)
  }

  const { data: itens } = await query

  // Filtrar estoque baixo no cliente (pois a query do Supabase não suporta comparação entre colunas diretamente)
  const itensFiltrados = baixo === 'true' 
    ? itens?.filter(item => item.quantidade <= item.quantidade_minima) 
    : itens
  
  // Contar itens com estoque baixo
  const itensEstoqueBaixo = itens?.filter(item => item.quantidade <= item.quantidade_minima).length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estoque</h1>
          <p className="text-muted-foreground">
            Gerencie as peças e produtos do seu estoque
          </p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/estoque/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Item
          </Link>
        </Button>
      </div>

      {/* Alerta de Estoque Baixo */}
      {itensEstoqueBaixo && itensEstoqueBaixo > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div className="flex-1">
              <p className="font-medium text-yellow-500">
                {itensEstoqueBaixo} {itensEstoqueBaixo === 1 ? 'item' : 'itens'} com estoque baixo
              </p>
              <p className="text-sm text-muted-foreground">
                Alguns itens estão abaixo da quantidade mínima
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/estoque?baixo=true">
                Ver Itens
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Busca */}
      <Card>
        <CardContent className="py-4">
          <form className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Buscar por nome, código ou categoria..."
                defaultValue={q}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="secondary">
              Buscar
            </Button>
            {(q || baixo) && (
              <Button variant="ghost" asChild>
                <Link href="/dashboard/estoque">Limpar</Link>
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Tabela */}
      {itensFiltrados && itensFiltrados.length > 0 ? (
        <EstoqueTable itens={itensFiltrados} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum item encontrado</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">
              {q ? 'Tente uma busca diferente.' : 'Comece cadastrando itens no estoque.'}
            </p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/dashboard/estoque/novo">
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Item
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
