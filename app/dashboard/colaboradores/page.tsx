import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, Crown } from 'lucide-react'
import Link from 'next/link'
import { ColaboradoresTable } from '@/components/colaboradores/colaboradores-table'

export default async function ColaboradoresPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: currentUser } = await supabase
    .from('usuarios')
    .select('empresa_id, is_admin, is_master')
    .eq('id', user.id)
    .single()

  if (!currentUser?.empresa_id) return null

  // Buscar todos os usuarios da empresa
  const { data: todosUsuarios } = await supabase
    .from('usuarios')
    .select('*')
    .eq('empresa_id', currentUser.empresa_id)
    .order('created_at', { ascending: true })

  // O primeiro usuario (mais antigo) é o dono/CEO
  const dono = todosUsuarios?.[0] || null
  
  // Colaboradores são todos os outros (exceto o dono)
  const colaboradores = todosUsuarios?.slice(1) || []

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

  // Total de colaboradores (sem contar o dono)
  const totalColaboradores = colaboradores.length
  // O limite de usuarios inclui o dono, entao colaboradores = limite - 1
  const maxColaboradores = (limites?.max_usuarios || 2) - 1
  const podeAdicionar = totalColaboradores < maxColaboradores

  const isOwner = dono?.id === user.id

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Colaboradores</h1>
          <p className="text-muted-foreground">
            Gerencie a equipe da sua assistencia
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

      {/* Card do Dono/CEO */}
      {dono && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Crown className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{dono.nome}</CardTitle>
                  <Badge className="bg-amber-500/20 text-amber-400">
                    Proprietario
                  </Badge>
                  {isOwner && (
                    <Badge variant="outline" className="text-xs">Voce</Badge>
                  )}
                </div>
                <CardDescription>{dono.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Info do Plano - Colaboradores */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Users className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-base">Colaboradores</CardTitle>
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
              style={{ width: `${maxColaboradores > 0 ? Math.min((totalColaboradores / maxColaboradores) * 100, 100) : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Colaboradores */}
      <ColaboradoresTable 
        colaboradores={colaboradores} 
        convites={convites || []}
        isAdmin={currentUser.is_admin}
        currentUserId={user.id}
      />
    </div>
  )
}
