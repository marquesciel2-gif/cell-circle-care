import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, FileText, TrendingUp, Package } from 'lucide-react'

export default function RelatoriosPage() {
  const relatorios = [
    {
      title: 'Consertos por Período',
      description: 'Visualize a quantidade de consertos realizados em determinado período',
      icon: BarChart3,
      available: false,
    },
    {
      title: 'Faturamento',
      description: 'Relatório de faturamento com receitas e despesas',
      icon: TrendingUp,
      available: false,
    },
    {
      title: 'Estoque',
      description: 'Relatório de movimentação e níveis de estoque',
      icon: Package,
      available: false,
    },
    {
      title: 'Clientes',
      description: 'Relatório de clientes e histórico de serviços',
      icon: FileText,
      available: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Analise os dados da sua assistência
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {relatorios.map((relatorio) => (
          <Card 
            key={relatorio.title} 
            className={relatorio.available ? 'cursor-pointer hover:bg-accent transition-colors' : 'opacity-60'}
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <relatorio.icon className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">{relatorio.title}</CardTitle>
                <CardDescription>{relatorio.description}</CardDescription>
              </div>
            </CardHeader>
            {!relatorio.available && (
              <CardContent>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                  Em breve
                </span>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
