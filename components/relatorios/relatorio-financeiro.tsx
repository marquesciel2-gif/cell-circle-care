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
import { Download, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { STATUS_FINANCEIRO_LABELS, STATUS_FINANCEIRO_COLORS } from '@/lib/types'
import type { Receita, Despesa, StatusFinanceiro } from '@/lib/types'

interface RelatorioFinanceiroProps {
  empresaId: string
}

export function RelatorioFinanceiro({ empresaId }: RelatorioFinanceiroProps) {
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
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])

  async function carregarDados() {
    setLoading(true)
    const supabase = createClient()

    const [receitasRes, despesasRes] = await Promise.all([
      supabase
        .from('receitas')
        .select('*')
        .eq('empresa_id', empresaId)
        .gte('created_at', dataInicio)
        .lte('created_at', dataFim + 'T23:59:59')
        .order('created_at', { ascending: false }),
      supabase
        .from('despesas')
        .select('*')
        .eq('empresa_id', empresaId)
        .gte('created_at', dataInicio)
        .lte('created_at', dataFim + 'T23:59:59')
        .order('created_at', { ascending: false })
    ])

    setReceitas(receitasRes.data || [])
    setDespesas(despesasRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  async function gerarPDF() {
    setPdfLoading(true)
    try {
      const response = await fetch(`/api/relatorios/financeiro?dataInicio=${dataInicio}&dataFim=${dataFim}`)
      if (!response.ok) throw new Error('Erro ao gerar PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-financeiro-${dataInicio}-${dataFim}.pdf`
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

  const totalReceitas = receitas.reduce((acc, r) => acc + r.valor, 0)
  const receitasPagas = receitas.filter(r => r.status === 'pago').reduce((acc, r) => acc + r.valor, 0)
  const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0)
  const despesasPagas = despesas.filter(d => d.status === 'pago').reduce((acc, d) => acc + d.valor, 0)
  const lucro = receitasPagas - despesasPagas

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
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Receitas Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{formatCurrency(totalReceitas)}</div>
            <p className="text-xs text-muted-foreground">Pagas: {formatCurrency(receitasPagas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Despesas Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(totalDespesas)}</div>
            <p className="text-xs text-muted-foreground">Pagas: {formatCurrency(despesasPagas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lucro >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {formatCurrency(lucro)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receitas.length + despesas.length}</div>
            <p className="text-xs text-muted-foreground">{receitas.length} receitas, {despesas.length} despesas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabelas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-emerald-500">Receitas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receitas.slice(0, 10).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.descricao}</TableCell>
                    <TableCell className="text-emerald-500">{formatCurrency(r.valor)}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_FINANCEIRO_COLORS[r.status as StatusFinanceiro]}>
                        {STATUS_FINANCEIRO_LABELS[r.status as StatusFinanceiro]}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(r.created_at), 'dd/MM', { locale: ptBR })}</TableCell>
                  </TableRow>
                ))}
                {receitas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhuma receita no período
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-red-500">Despesas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {despesas.slice(0, 10).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.descricao}</TableCell>
                    <TableCell className="text-red-500">{formatCurrency(d.valor)}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_FINANCEIRO_COLORS[d.status as StatusFinanceiro]}>
                        {STATUS_FINANCEIRO_LABELS[d.status as StatusFinanceiro]}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(d.created_at), 'dd/MM', { locale: ptBR })}</TableCell>
                  </TableRow>
                ))}
                {despesas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhuma despesa no período
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
