import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus } from 'lucide-react'
import Link from 'next/link'
import { ColaboradoresTable } from '@/components/colaboradores/colaboradores-table'

export default async function ColaboradoresPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: currentUser } = await supabase
    .from('usuarios')
    .select('empresa_id, is_admin')
    .eq('id', user.id)
    .single()

  if (!currentUser?.empresa_id) return null

  // Buscar colaboradores da empresa
  const { data: colaboradores } = await supabase
    .from('usuarios')
    .select('*')
    .eq('empresa_id', currentUser.empresa_id)
    .order('nome', { ascending: true })

  // Buscar convites pendentes
  const { data: convites } = await supabase
    .from('convites_colaborador')
    .select('*')
    .eq('empresa_id', currentUser.empresa_id)
    .eq('usado', false)
    .gte('expira_em', new Date().toISOString())

  // Buscar limites do plano
  const { data: empresa } = await supabase
    .from('empresas')
    .select('plano')
    .eq('id', currentUser.empresa_id)
    .single()

  const { data: limites } = await supabase
    .from('plano_limites')
    .select('max_usuarios')
    .eq('plano', empresa?.plano || 'basico')
    .single()

  const totalColaboradores = colaboradores?.length || 0
  const maxColaboradores = limites?.max_usuarios || 2
  const podeAdicionar = totalColaboradores < maxColaboradores

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Colaboradores</h1>
          <p className="text-muted-foreground">
            Gerencie a equipe da sua assistência
          </p>
        </div>
        {currentUser.is_admin && (
          <Button asChild disabled={!podeAdicionar} className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/dashboard/colaboradores/convidar">
              <Plus className="mr-2 h-4 w-4" />
              Convidar Colaborador
            </Link>
          </Button>
        )}
      </div>

      {/* Info do Plano */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Users className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-base">Equipe</CardTitle>
                <CardDescription>
                  {totalColaboradores} de {maxColaboradores} colaboradores
                </CardDescription>
              </div>
            </div>
            {!podeAdicionar && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/configuracoes/plano">
                  Fazer Upgrade
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all" 
              style={{ width: `${Math.min((totalColaboradores / maxColaboradores) * 100, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Colaboradores */}
      <ColaboradoresTable 
        colaboradores={colaboradores || []} 
        convites={convites || []}
        isAdmin={currentUser.is_admin}
        currentUserId={user.id}
      />
    </div>
  )
}
