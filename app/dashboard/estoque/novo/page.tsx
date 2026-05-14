import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EstoqueForm } from '@/components/estoque/estoque-form'

export default function NovoEstoquePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Novo Item</h1>
        <p className="text-muted-foreground">
          Cadastre um novo item no estoque
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Item</CardTitle>
          <CardDescription>
            Preencha as informações do item
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EstoqueForm />
        </CardContent>
      </Card>
    </div>
  )
}
