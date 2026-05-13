import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Building2 } from 'lucide-react'
import Link from 'next/link'
import { EmpresasTable } from '@/components/admin/empresas-table'

export default async function AdminEmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q, status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('empresas')
    .select('*')
    .order('created_at', { ascending: false })

  if (q) {
    query = query.or(`nome.ilike.%${q}%,email.ilike.%${q}%,cnpj.ilike.%${q}%`)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data: empresas } = await query

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as empresas cadastradas
          </p>
        </div>
        <Button asChild className="bg-purple-600 hover:bg-purple-700">
          <Link href="/admin/empresas/novo">
            <Plus className="mr-2 h-4 w-4" />
            Nova Empresa
          </Link>
        </Button>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="py-4">
          <form className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Buscar por nome, e-mail ou CNPJ..."
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
      {empresas && empresas.length > 0 ? (
        <EmpresasTable empresas={empresas} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma empresa encontrada</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">
              {q ? 'Tente uma busca diferente.' : 'Cadastre a primeira empresa.'}
            </p>
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link href="/admin/empresas/novo">
                <Plus className="mr-2 h-4 w-4" />
                Nova Empresa
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
