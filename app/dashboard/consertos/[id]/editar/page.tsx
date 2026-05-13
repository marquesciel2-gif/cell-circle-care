import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ConsertoForm } from '@/components/consertos/conserto-form'

export default async function EditarConsertoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  const { data: conserto } = await supabase
    .from('consertos')
    .select('*')
    .eq('id', id)
    .single()

  if (!conserto) {
    notFound()
  }

  // Buscar clientes para o select
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome, telefone')
    .eq('empresa_id', usuario?.empresa_id)
    .order('nome')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Conserto</h1>
        <p className="text-muted-foreground">
          Atualize as informações da OS {conserto.numero}
        </p>
      </div>

      <ConsertoForm 
        conserto={conserto} 
        clientes={clientes || []} 
      />
    </div>
  )
}
