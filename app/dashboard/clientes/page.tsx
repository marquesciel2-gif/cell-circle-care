import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Users } from 'lucide-react'
import Link from 'next/link'
import { ClientesTable } from '@/components/clientes/clientes-table'

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('clientes')
    .select('*')
    .eq('empresa_id', usuario?.empresa_id)
    .order('nome', { ascending: true })

  if (q) {
    query = query.or(`nome.ilike.%${q}%,telefone.ilike.%${q}%,email.ilike.%${q}%,cpf.ilike.%${q}%`)
  }

  const { data: clientes } = await query

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie os clientes da sua assistência
          </p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/clientes/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Link>
        </Button>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buscar Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Buscar por nome, telefone, e-mail ou CPF..."
                defaultValue={q}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="secondary">
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabela */}
      {clientes && clientes.length > 0 ? (
        <ClientesTable clientes={clientes} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">
              {q ? 'Tente uma busca diferente ou cadastre um novo cliente.' : 'Comece cadastrando seu primeiro cliente.'}
            </p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/dashboard/clientes/novo">
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Cliente
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
