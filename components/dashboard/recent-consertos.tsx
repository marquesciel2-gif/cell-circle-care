import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Smartphone } from 'lucide-react'
import type { Conserto, Cliente } from '@/lib/types'
import { STATUS_CONSERTO_LABELS, STATUS_CONSERTO_COLORS } from '@/lib/types'

interface RecentConsertosProps {
  consertos: (Conserto & { cliente: Pick<Cliente, 'nome'> | null })[]
}

export function RecentConsertos({ consertos }: RecentConsertosProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Consertos Recentes</CardTitle>
          <CardDescription>Últimas ordens de serviço</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/consertos">
            Ver todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {consertos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Nenhum conserto cadastrado ainda.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/consertos/novo">
                Criar primeiro conserto
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {consertos.map((conserto) => (
              <Link 
                key={conserto.id} 
                href={`/dashboard/consertos/${conserto.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{conserto.numero}</span>
                    <Badge 
                      variant="secondary" 
                      className={STATUS_CONSERTO_COLORS[conserto.status]}
                    >
                      {STATUS_CONSERTO_LABELS[conserto.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {conserto.cliente?.nome || 'Cliente não informado'} - {conserto.dispositivo}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
