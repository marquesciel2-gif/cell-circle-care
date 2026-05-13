import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Pencil, 
  ArrowLeft, 
  User, 
  Smartphone, 
  Wrench, 
  Calendar,
  DollarSign,
  Phone
} from 'lucide-react'
import { STATUS_CONSERTO_LABELS, STATUS_CONSERTO_COLORS } from '@/lib/types'
import { ConsertoStatusUpdate } from '@/components/consertos/conserto-status-update'

export default async function ConsertoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: conserto } = await supabase
    .from('consertos')
    .select('*, cliente:clientes(*)')
    .eq('id', id)
    .single()

  if (!conserto) {
    notFound()
  }

  const valorTotal = conserto.valor || (conserto.valor_pecas + conserto.valor_mao_obra)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/consertos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{conserto.numero}</h1>
              <Badge 
                variant="secondary" 
                className={STATUS_CONSERTO_COLORS[conserto.status]}
              >
                {STATUS_CONSERTO_LABELS[conserto.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Criado em {format(new Date(conserto.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <ConsertoStatusUpdate conserto={conserto} />
          <Button asChild>
            <Link href={`/dashboard/consertos/${conserto.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conserto.cliente ? (
              <div className="space-y-2">
                <p className="font-medium">{conserto.cliente.nome}</p>
                {conserto.cliente.telefone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {conserto.cliente.telefone}
                  </p>
                )}
                {conserto.cliente.email && (
                  <p className="text-sm text-muted-foreground">{conserto.cliente.email}</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Cliente não informado</p>
            )}
          </CardContent>
        </Card>

        {/* Dispositivo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4" />
              Dispositivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{conserto.dispositivo}</p>
              {(conserto.marca || conserto.modelo) && (
                <p className="text-sm text-muted-foreground">
                  {[conserto.marca, conserto.modelo].filter(Boolean).join(' ')}
                </p>
              )}
              {conserto.cor && (
                <p className="text-sm text-muted-foreground">Cor: {conserto.cor}</p>
              )}
              {conserto.imei && (
                <p className="text-sm text-muted-foreground">IMEI: {conserto.imei}</p>
              )}
              {conserto.acessorios && (
                <p className="text-sm text-muted-foreground">Acessórios: {conserto.acessorios}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Problema e Diagnóstico */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-4 w-4" />
              Problema e Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Problema Relatado</h4>
              <p>{conserto.problema}</p>
            </div>
            
            {conserto.diagnostico && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Diagnóstico</h4>
                <p>{conserto.diagnostico}</p>
              </div>
            )}
            
            {conserto.solucao && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Solução Aplicada</h4>
                <p>{conserto.solucao}</p>
              </div>
            )}

            {conserto.observacoes && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Observações</h4>
                <p className="text-sm">{conserto.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Valores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Peças</span>
                <span>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conserto.valor_pecas)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mão de Obra</span>
                <span>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conserto.valor_mao_obra)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span className="text-emerald-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Datas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entrada</span>
                <span>{format(new Date(conserto.data_entrada), 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
              {conserto.data_previsao && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Previsão</span>
                  <span>{format(new Date(conserto.data_previsao), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
              )}
              {conserto.data_conclusao && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conclusão</span>
                  <span>{format(new Date(conserto.data_conclusao), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
              )}
              {conserto.data_entrega && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entrega</span>
                  <span>{format(new Date(conserto.data_entrega), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
              )}
              {conserto.tecnico_responsavel && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Técnico</span>
                    <span>{conserto.tecnico_responsavel}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
