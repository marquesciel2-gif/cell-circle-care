'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, Loader2, Package, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ItemEstoque } from '@/lib/types'

interface RelatorioEstoqueProps {
  empresaId: string
}

export function RelatorioEstoque({ empresaId }: RelatorioEstoqueProps) {
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [itens, setItens] = useState<ItemEstoque[]>([])

  async function carregarDados() {
    setLoading(true)
    const supabase = createClient()

    const { data } = await supabase
      .from('estoque')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true })

    setItens(data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  async function gerarPDF(tipo: 'completo' | 'baixo') {
    setPdfLoading(true)
    try {
      const endpoint = tipo === 'baixo' ? 'estoque-baixo' : 'estoque'
      const response = await fetch(`/api/relatorios/${endpoint}`)
      if (!response.ok) throw new Error('Erro ao gerar PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-${endpoint}.pdf`
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

  const itensBaixoEstoque = itens.filter(i => i.quantidade <= i.quantidade_minima)
  const valorTotalEstoque = itens.reduce((acc, i) => acc + (i.quantidade * i.preco_custo), 0)
  const valorVendaEstoque = itens.reduce((acc, i) => acc + (i.quantidade * i.preco_venda), 0)

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
              <Package className="h-4 w-4" />
              Total de Itens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itens.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{itensBaixoEstoque.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor em Estoque (Custo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorTotalEstoque)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor em Estoque (Venda)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{formatCurrency(valorVendaEstoque)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Botões PDF */}
      <div className="flex gap-2">
        <Button onClick={() => gerarPDF('completo')} disabled={pdfLoading} variant="outline">
          {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
          PDF Completo
        </Button>
        <Button onClick={() => gerarPDF('baixo')} disabled={pdfLoading} variant="outline" className="text-red-500">
          {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
          PDF Estoque Baixo
        </Button>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inventário</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead className="text-center">Mínimo</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Venda</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((item) => {
                const baixoEstoque = item.quantidade <= item.quantidade_minima
                return (
                  <TableRow key={item.id} className={baixoEstoque ? 'bg-red-500/5' : ''}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>{item.categoria || '-'}</TableCell>
                    <TableCell className="text-center font-medium">{item.quantidade}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{item.quantidade_minima}</TableCell>
                    <TableCell>{formatCurrency(item.preco_custo)}</TableCell>
                    <TableCell className="text-emerald-500">{formatCurrency(item.preco_venda)}</TableCell>
                    <TableCell>
                      {baixoEstoque ? (
                        <Badge className="bg-red-500/20 text-red-400">Baixo</Badge>
                      ) : (
                        <Badge className="bg-emerald-500/20 text-emerald-400">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {itens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum item no estoque
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
