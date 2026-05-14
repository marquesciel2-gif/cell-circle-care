import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClienteForm } from '@/components/clientes/cliente-form'

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single()

  if (!cliente) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Cliente</h1>
        <p className="text-muted-foreground">
          Atualize as informações do cliente
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Cliente</CardTitle>
          <CardDescription>
            Edite as informações do cliente {cliente.nome}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClienteForm cliente={cliente} />
        </CardContent>
      </Card>
    </div>
  )
}
