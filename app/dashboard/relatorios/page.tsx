'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, FileText, TrendingUp, Download, Calendar, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function RelatoriosPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('todos')

  async function gerarRelatorioPDF(tipo: string) {
    if (!dataInicio || !dataFim) {
      toast.error('Selecione o período do relatório')
      return
    }

    setLoading(tipo)
    
    try {
      const response = await fetch(`/api/relatorios/${tipo}?dataInicio=${dataInicio}&dataFim=${dataFim}&status=${statusFiltro}`)
      
      if (!response.ok) {
        throw new Error('Erro ao gerar relatório')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-${tipo}-${dataInicio}-${dataFim}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Relatório gerado com sucesso!')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao gerar relatório')
    } finally {
      setLoading(null)
    }
  }

  // Definir período padrão como mês atual
  const hoje = new Date()
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]

  if (!dataInicio && !dataFim) {
    setDataInicio(primeiroDiaMes)
    setDataFim(ultimoDiaMes)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Gere relatórios em PDF da sua assistência
        </p>
      </div>

      {/* Filtros de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Período do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status (Financeiro)</Label>
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pago">Pagos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="atrasado">Atrasados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Relatórios */}
      <Tabs defaultValue="financeiro" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="consertos">Consertos</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
        </TabsList>

        {/* Relatórios Financeiros */}
        <TabsContent value="financeiro" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Receitas</CardTitle>
                    <CardDescription>Relatório de receitas recebidas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => gerarRelatorioPDF('receitas')}
                  disabled={loading === 'receitas'}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading === 'receitas' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Gerar PDF de Receitas
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <TrendingUp className="h-6 w-6 text-red-500 rotate-180" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Despesas</CardTitle>
                    <CardDescription>Relatório de despesas pagas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => gerarRelatorioPDF('despesas')}
                  disabled={loading === 'despesas'}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {loading === 'despesas' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Gerar PDF de Despesas
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Resumo Financeiro</CardTitle>
                    <CardDescription>Receitas, despesas e lucro</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => gerarRelatorioPDF('financeiro')}
                  disabled={loading === 'financeiro'}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading === 'financeiro' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Gerar PDF Resumo Financeiro
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <FileText className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Crediário</CardTitle>
                    <CardDescription>Parcelas e pagamentos parcelados</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => gerarRelatorioPDF('crediario')}
                  disabled={loading === 'crediario'}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  {loading === 'crediario' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Gerar PDF de Crediário
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Relatórios de Consertos */}
        <TabsContent value="consertos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <FileText className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Consertos por Período</CardTitle>
                    <CardDescription>Lista de consertos realizados</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => gerarRelatorioPDF('consertos')}
                  disabled={loading === 'consertos'}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading === 'consertos' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Gerar PDF de Consertos
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <BarChart3 className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Serviços por Cliente</CardTitle>
                    <CardDescription>Histórico de serviços por cliente</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => gerarRelatorioPDF('clientes')}
                  disabled={loading === 'clientes'}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading === 'clientes' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Gerar PDF por Cliente
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Relatórios de Estoque */}
        <TabsContent value="estoque" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <FileText className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Inventário Atual</CardTitle>
                    <CardDescription>Lista completa do estoque</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => gerarRelatorioPDF('estoque')}
                  disabled={loading === 'estoque'}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {loading === 'estoque' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Gerar PDF de Estoque
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <FileText className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Estoque Baixo</CardTitle>
                    <CardDescription>Itens abaixo do mínimo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => gerarRelatorioPDF('estoque-baixo')}
                  disabled={loading === 'estoque-baixo'}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {loading === 'estoque-baixo' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Gerar PDF Estoque Baixo
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
