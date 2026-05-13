import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Wrench } from 'lucide-react'
import Link from 'next/link'
import { ConsertosTable } from '@/components/consertos/consertos-table'
import { ConsertosFilters } from '@/components/consertos/consertos-filters'
import type { StatusConserto } from '@/lib/types'

export default async function ConsertosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: StatusConserto }>
}) {
  const { q, status } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('consertos')
    .select('*, cliente:clientes(id, nome, telefone)')
    .eq('empresa_id', usuario?.empresa_id)
    .order('created_at', { ascending: false })

  if (q) {
    query = query.or(`numero.ilike.%${q}%,dispositivo.ilike.%${q}%,marca.ilike.%${q}%,modelo.ilike.%${q}%`)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data: consertos } = await query

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Consertos</h1>
          <p className="text-muted-foreground">
            Gerencie as ordens de serviço
          </p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/consertos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Conserto
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <ConsertosFilters searchQuery={q} statusFilter={status} />

      {/* Tabela */}
      {consertos && consertos.length > 0 ? (
        <ConsertosTable consertos={consertos} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum conserto encontrado</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">
              {q || status ? 'Tente uma busca diferente ou remova os filtros.' : 'Comece cadastrando seu primeiro conserto.'}
            </p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/dashboard/consertos/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo Conserto
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
