'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, Loader2, CreditCard, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { STATUS_FINANCEIRO_LABELS, STATUS_FINANCEIRO_COLORS } from '@/lib/types'
import type { Parcela, StatusFinanceiro } from '@/lib/types'

interface RelatorioCrediarioProps {
  empresaId: string
}

type ParcelaComCliente = Parcela & { cliente: { nome: string } | null }

export function RelatorioCrediario({ empresaId }: RelatorioCrediarioProps) {
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [parcelas, setParcelas] = useState<ParcelaComCliente[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedParcela, setSelectedParcela] = useState<ParcelaComCliente | null>(null)
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function carregarDados() {
    setLoading(true)
    const supabase = createClient()

    const { data } = await supabase
      .from('parcelas')
      .select('*, cliente:clientes(nome)')
      .eq('empresa_id', empresaId)
      .order('data_vencimento', { ascending: true })

    setParcelas(data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  async function marcarPaga(parcela: ParcelaComCliente) {
    setSelectedParcela(parcela)
    setDataPagamento(format(new Date(), 'yyyy-MM-dd'))
    setDialogOpen(true)
  }

  async function confirmarPagamento() {
    if (!selectedParcela) return
    
    setActionLoading(selectedParcela.id)
    setDialogOpen(false)
    
    const supabase = createClient()
    const { error } = await supabase
      .from('parcelas')
      .update({
        status: 'pago',
        data_pagamento: dataPagamento
      })
      .eq('id', selectedParcela.id)

    setActionLoading(null)
    
    if (error) {
      toast.error('Erro ao marcar parcela como paga')
    } else {
      toast.success('Parcela marcada como paga!')
      carregarDados()
    }
    
    setSelectedParcela(null)
  }

  async function gerarReciboPDF(parcela: ParcelaComCliente) {
    setPdfLoading(true)
    try {
      const response = await fetch(`/api/relatorios/recibo-parcela/${parcela.id}`)
      if (!response.ok) throw new Error('Erro ao gerar PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recibo-parcela-${parcela.numero_parcela}-${parcela.id.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Recibo gerado!')
    } catch {
      toast.error('Erro ao gerar recibo')
    }
    setPdfLoading(false)
  }

  async function gerarPDFCompleto() {
    setPdfLoading(true)
    try {
      const response = await fetch(`/api/relatorios/crediario?dataInicio=2020-01-01&dataFim=2030-12-31`)
      if (!response.ok) throw new Error('Erro ao gerar PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-crediario.pdf`
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

  const parcelasPendentes = parcelas.filter(p => p.status === 'pendente')
  const parcelasAtrasadas = parcelas.filter(p => p.status === 'pendente' && new Date(p.data_vencimento) < new Date())
  const parcelasPagas = parcelas.filter(p => p.status === 'pago')
  
  const totalPendente = parcelasPendentes.reduce((acc, p) => acc + p.valor, 0)
  const totalAtrasado = parcelasAtrasadas.reduce((acc, p) => acc + p.valor, 0)
  const totalRecebido = parcelasPagas.reduce((acc, p) => acc + p.valor, 0)

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-amber-500" />
              Parcelas Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{formatCurrency(totalPendente)}</div>
            <p className="text-xs text-muted-foreground">{parcelasPendentes.length} parcelas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-500">Atrasadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(totalAtrasado)}</div>
            <p className="text-xs text-muted-foreground">{parcelasAtrasadas.length} parcelas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-500">Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{formatCurrency(totalRecebido)}</div>
            <p className="text-xs text-muted-foreground">{parcelasPagas.length} parcelas</p>
          </CardContent>
        </Card>
        <Card className="flex items-center justify-center">
          <Button onClick={gerarPDFCompleto} disabled={pdfLoading} variant="outline">
            {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            Exportar PDF
          </Button>
        </Card>
      </div>

      {/* Tabela de Parcelas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parcelas do Crediário</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Pago</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parcelas.map((parcela) => {
                const isAtrasada = parcela.status === 'pendente' && new Date(parcela.data_vencimento) < new Date()
                return (
                  <TableRow key={parcela.id} className={isAtrasada ? 'bg-red-500/5' : ''}>
                    <TableCell className="font-medium">
                      {parcela.cliente?.nome || 'Não informado'}
                    </TableCell>
                    <TableCell>
                      {parcela.numero_parcela}/{parcela.total_parcelas}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(parcela.valor)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(parcela.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge className={isAtrasada ? 'bg-red-500/20 text-red-400' : STATUS_FINANCEIRO_COLORS[parcela.status as StatusFinanceiro]}>
                        {isAtrasada ? 'Atrasada' : STATUS_FINANCEIRO_LABELS[parcela.status as StatusFinanceiro]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {actionLoading === parcela.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      ) : (
                        <Switch
                          checked={parcela.status === 'pago'}
                          onCheckedChange={() => marcarPaga(parcela)}
                          disabled={parcela.status === 'pago'}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {parcela.status === 'pago' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => gerarReciboPDF(parcela)}
                          title="Gerar Recibo"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {parcelas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma parcela cadastrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Pagamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Parcela {selectedParcela?.numero_parcela}/{selectedParcela?.total_parcelas} - {formatCurrency(selectedParcela?.valor || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="data_pagamento">Data do Pagamento</Label>
            <Input
              id="data_pagamento"
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarPagamento} className="bg-emerald-600 hover:bg-emerald-700">
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
