'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Package, 
  ShoppingCart, 
  RotateCcw, 
  Shield, 
  Settings, 
  AlertTriangle,
  Wrench,
  ArrowLeftRight,
  Clock,
  XCircle,
  Hammer,
  CheckCircle
} from 'lucide-react'
import type { MovimentacaoProduto, TipoMovimentacaoProduto } from '@/lib/types'
import { TIPO_MOVIMENTACAO_PRODUTO_LABELS, TIPO_MOVIMENTACAO_PRODUTO_COLORS } from '@/lib/types'

interface ProdutoTimelineProps {
  movimentacoes: MovimentacaoProduto[]
}

const iconMap: Record<TipoMovimentacaoProduto, React.ReactNode> = {
  entrada: <Package className="h-4 w-4" />,
  venda: <ShoppingCart className="h-4 w-4" />,
  devolucao: <RotateCcw className="h-4 w-4" />,
  garantia: <Shield className="h-4 w-4" />,
  ajuste: <Settings className="h-4 w-4" />,
  perda: <AlertTriangle className="h-4 w-4" />,
  manutencao: <Wrench className="h-4 w-4" />,
  troca: <ArrowLeftRight className="h-4 w-4" />,
  reserva: <Clock className="h-4 w-4" />,
  cancelamento: <XCircle className="h-4 w-4" />,
  uso_conserto: <Hammer className="h-4 w-4" />,
}

export function ProdutoTimeline({ movimentacoes }: ProdutoTimelineProps) {
  if (movimentacoes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Historico do Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            Nenhuma movimentacao registrada para este produto.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Historico do Produto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Linha vertical */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-6">
            {movimentacoes.map((mov, index) => (
              <div key={mov.id} className="relative pl-10">
                {/* Icone do tipo */}
                <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  TIPO_MOVIMENTACAO_PRODUTO_COLORS[mov.tipo].split(' ')[0]
                } border-2 border-background`}>
                  <span className={TIPO_MOVIMENTACAO_PRODUTO_COLORS[mov.tipo].split(' ')[1]}>
                    {iconMap[mov.tipo]}
                  </span>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={TIPO_MOVIMENTACAO_PRODUTO_COLORS[mov.tipo]}>
                          {TIPO_MOVIMENTACAO_PRODUTO_LABELS[mov.tipo]}
                        </Badge>
                        {mov.quantidade > 1 && (
                          <span className="text-sm text-muted-foreground">
                            Qtd: {mov.quantidade}
                          </span>
                        )}
                      </div>
                      
                      {mov.observacao && (
                        <p className="text-sm text-muted-foreground">
                          {mov.observacao}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {mov.usuario && (
                          <span>Por: {mov.usuario.nome}</span>
                        )}
                        {mov.cliente && (
                          <span>Cliente: {mov.cliente.nome}</span>
                        )}
                        {mov.conserto && (
                          <span>OS: {mov.conserto.numero}</span>
                        )}
                        {mov.valor && (
                          <span>Valor: R$ {mov.valor.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(mov.created_at).toLocaleDateString('pt-BR')}
                      <br />
                      {new Date(mov.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                
                {/* Indicador de primeiro/ultimo */}
                {index === 0 && (
                  <div className="absolute -left-1 top-0">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
