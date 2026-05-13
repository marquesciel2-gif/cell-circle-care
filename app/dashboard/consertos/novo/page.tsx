import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConsertoForm } from '@/components/consertos/conserto-form'

export default async function NovoConsertoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>
}) {
  const { cliente: clienteId } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  // Buscar clientes para o select
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome, telefone')
    .eq('empresa_id', usuario?.empresa_id)
    .order('nome')

  // Buscar cliente pré-selecionado se fornecido
  let clienteSelecionado = null
  if (clienteId) {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', clienteId)
      .single()
    clienteSelecionado = data
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Novo Conserto</h1>
        <p className="text-muted-foreground">
          Registre uma nova ordem de serviço
        </p>
      </div>

      <ConsertoForm 
        clientes={clientes || []} 
        clienteSelecionado={clienteSelecionado}
      />
    </div>
  )
}
