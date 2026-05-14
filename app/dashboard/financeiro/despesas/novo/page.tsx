import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DespesaForm } from '@/components/financeiro/despesa-form'

export default function NovaDespesaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova Despesa</h1>
        <p className="text-muted-foreground">
          Registre uma nova despesa
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Despesa</CardTitle>
          <CardDescription>
            Preencha as informações da despesa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DespesaForm />
        </CardContent>
      </Card>
    </div>
  )
}
