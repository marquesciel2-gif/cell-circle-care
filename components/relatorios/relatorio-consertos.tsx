'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, Loader2, Wrench, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { STATUS_CONSERTO_LABELS, STATUS_CONSERTO_COLORS } from '@/lib/types'
import type { Conserto, StatusConserto } from '@/lib/types'

interface RelatorioConsertosProps {
  empresaId: string
}

type ConsertoComCliente = Conserto & { cliente: { nome: string } | null }

export function RelatorioConsertos({ empresaId }: RelatorioConsertosProps) {
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
  })
  const [dataFim, setDataFim] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
  })
  const [consertos, setConsertos] = useState<ConsertoComCliente[]>([])

  async function carregarDados() {
    setLoading(true)
    const supabase = createClient()

    const { data } = await supabase
      .from('consertos')
      .select('*, cliente:clientes(nome)')
      .eq('empresa_id', empresaId)
      .gte('created_at', dataInicio)
      .lte('created_at', dataFim + 'T23:59:59')
      .order('created_at', { ascending: false })

    setConsertos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  async function gerarPDF() {
    setPdfLoading(true)
    try {
      const response = await fetch(`/api/relatorios/consertos?dataInicio=${dataInicio}&dataFim=${dataFim}`)
      if (!response.ok) throw new Error('Erro ao gerar PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-consertos-${dataInicio}-${dataFim}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('PDF gerado com sucesso!')
    } catch {
      toast.error('Erro ao gerar PDF')
    }
    setPdfLoading(false)
  }

  const concluidos = consertos.filter(c => c.status === 'entregue')
  const emAndamento = consertos.filter(c => ['recebido', 'diagnostico', 'aguardando_aprovacao', 'em_reparo', 'pronto'].includes(c.status))
  const cancelados = consertos.filter(c => c.status === 'cancelado')
  const faturamento = concluidos.reduce((acc, c) => acc + c.valor, 0)

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <Button onClick={carregarDados} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Filtrar
            </Button>
            <Button onClick={gerarPDF} disabled={pdfLoading} variant="outline">
              {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consertos.length}</div>
            <p className="text-xs text-muted-foreground">consertos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{concluidos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{emAndamento.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{formatCurrency(faturamento)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consertos no Período</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>OS</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consertos.map((conserto) => (
                <TableRow key={conserto.id}>
                  <TableCell className="font-medium">{conserto.numero}</TableCell>
                  <TableCell>{conserto.cliente?.nome || '-'}</TableCell>
                  <TableCell>
                    {conserto.marca} {conserto.modelo}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_CONSERTO_COLORS[conserto.status as StatusConserto]}>
                      {STATUS_CONSERTO_LABELS[conserto.status as StatusConserto]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(conserto.valor)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(conserto.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))}
              {consertos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum conserto no período
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
