import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EstoqueForm } from '@/components/estoque/estoque-form'

export default async function EditarEstoquePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('estoque')
    .select('*')
    .eq('id', id)
    .single()

  if (!item) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Item</h1>
        <p className="text-muted-foreground">
          Atualize as informacoes do item
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Item</CardTitle>
          <CardDescription>
            Edite as informacoes de {item.nome}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EstoqueForm item={item} />
        </CardContent>
      </Card>
    </div>
  )
}
