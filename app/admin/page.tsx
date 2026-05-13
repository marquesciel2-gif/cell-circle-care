import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, CheckCircle, AlertTriangle, Ban } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Estatísticas
  const [
    { count: totalEmpresas },
    { count: empresasAtivas },
    { count: empresasVencidas },
    { count: empresasBloqueadas },
    { count: totalUsuarios },
  ] = await Promise.all([
    supabase.from('empresas').select('*', { count: 'exact', head: true }),
    supabase.from('empresas').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('empresas').select('*', { count: 'exact', head: true }).eq('status', 'vencido'),
    supabase.from('empresas').select('*', { count: 'exact', head: true }).eq('status', 'bloqueado'),
    supabase.from('usuarios').select('*', { count: 'exact', head: true }),
  ])

  // Empresas recentes
  const { data: empresasRecentes } = await supabase
    .from('empresas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel Administrativo</h1>
        <p className="text-muted-foreground">
          Gerencie todas as empresas e usuários do sistema
        </p>
      </div>

      {/* Cards Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmpresas || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{empresasAtivas || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{empresasVencidas || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bloqueadas</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{empresasBloqueadas || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsuarios || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Empresas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas Recentes</CardTitle>
          <CardDescription>Últimas empresas cadastradas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {empresasRecentes && empresasRecentes.length > 0 ? (
            <div className="space-y-4">
              {empresasRecentes.map((empresa) => (
                <div 
                  key={empresa.id} 
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div>
                    <p className="font-medium">{empresa.nome}</p>
                    <p className="text-sm text-muted-foreground">{empresa.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      empresa.status === 'ativo' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : empresa.status === 'vencido'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {empresa.status}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Plano: {empresa.plano}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma empresa cadastrada ainda.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
