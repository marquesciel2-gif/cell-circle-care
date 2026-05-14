import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReceitaForm } from '@/components/financeiro/receita-form'

export default async function NovaReceitaPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome')
    .eq('empresa_id', usuario?.empresa_id)
    .order('nome')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova Receita</h1>
        <p className="text-muted-foreground">
          Registre uma nova receita
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Receita</CardTitle>
          <CardDescription>
            Preencha as informações da receita
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReceitaForm clientes={clientes || []} />
        </CardContent>
      </Card>
    </div>
  )
}
