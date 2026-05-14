'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Edit, 
  Package, 
  QrCode, 
  History, 
  AlertTriangle,
  Calendar,
  DollarSign,
  MapPin,
  Barcode,
  Smartphone,
  Clock,
  User,
  FileText,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { ProdutoTimeline } from '@/components/rastreabilidade/produto-timeline'
import { QRCodeDisplay } from '@/components/rastreabilidade/qr-code-display'
import { 
  STATUS_PRODUTO_LABELS, 
  STATUS_PRODUTO_COLORS,
  type ItemEstoque,
  type MovimentacaoProduto
} from '@/lib/types'

export default function ProdutoDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const [item, setItem] = useState<ItemEstoque | null>(null)
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoProduto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const id = params.id as string

      const [{ data: itemData }, { data: movData }] = await Promise.all([
        supabase
          .from('estoque')
          .select('*')
          .eq('id', id)
          .single(),
        supabase
          .from('movimentacoes_produto')
          .select('*, usuario:usuarios(nome), cliente:clientes(nome), conserto:consertos(numero)')
          .eq('produto_id', id)
          .order('created_at', { ascending: false })
      ])

      if (itemData) {
        setItem(itemData)
      }
      if (movData) {
        setMovimentacoes(movData)
      }
      setLoading(false)
    }

    loadData()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Package className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Produto nao encontrado</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    )
  }

  const estoqueBaixo = item.quantidade <= item.quantidade_minima

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{item.nome}</h1>
              <Badge className={STATUS_PRODUTO_COLORS[item.status_produto || 'em_estoque']}>
                {STATUS_PRODUTO_LABELS[item.status_produto || 'em_estoque']}
              </Badge>
              {estoqueBaixo && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Estoque Baixo
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {item.codigo || 'Sem codigo'} {item.marca && `• ${item.marca}`} {item.modelo && `• ${item.modelo}`}
            </p>
          </div>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href={`/dashboard/estoque/${item.id}/editar`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informacoes principais */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informacoes</TabsTrigger>
              <TabsTrigger value="historico">Historico</TabsTrigger>
              <TabsTrigger value="qrcode">QR Code</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              {/* Dados do Produto */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Dados do Produto
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="font-medium">{item.categoria || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Fornecedor</p>
                    <p className="font-medium">{item.fornecedor || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Descricao</p>
                    <p className="font-medium">{item.descricao || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Localizacao</p>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{item.localizacao || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Identificadores */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Barcode className="h-4 w-4" />
                    Identificadores
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Codigo Interno</p>
                    <p className="font-mono font-medium">{item.codigo || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Codigo de Barras</p>
                    <p className="font-mono font-medium">{item.codigo_barras || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Numero de Serie</p>
                    <p className="font-mono font-medium">{item.numero_serie || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Smartphone className="h-3 w-3" /> IMEI
                    </p>
                    <p className="font-mono font-medium">{item.imei || '-'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Valores e Estoque */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Valores e Estoque
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Preco de Custo</p>
                    <p className="font-medium text-lg">
                      R$ {item.preco_custo?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Preco de Venda</p>
                    <p className="font-medium text-lg text-emerald-500">
                      R$ {item.preco_venda?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Margem</p>
                    <p className="font-medium text-lg">
                      {item.preco_custo && item.preco_venda 
                        ? ((item.preco_venda - item.preco_custo) / item.preco_custo * 100).toFixed(1) 
                        : 0}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Quantidade</p>
                    <p className={`font-medium text-lg ${estoqueBaixo ? 'text-red-500' : ''}`}>
                      {item.quantidade}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Estoque Minimo</p>
                    <p className="font-medium text-lg">{item.quantidade_minima}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Garantia</p>
                    <p className="font-medium text-lg">
                      {item.garantia_meses ? `${item.garantia_meses} meses` : '-'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Datas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Datas
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Data de Entrada</p>
                    <p className="font-medium">
                      {item.data_entrada 
                        ? new Date(item.data_entrada).toLocaleDateString('pt-BR')
                        : '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Cadastro</p>
                    <p className="font-medium">
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Ultima Atualizacao</p>
                    <p className="font-medium">
                      {new Date(item.updated_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historico" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Historico de Movimentacoes
                  </CardTitle>
                  <CardDescription>
                    Rastreabilidade completa do produto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProdutoTimeline movimentacoes={movimentacoes} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qrcode" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    QR Code do Produto
                  </CardTitle>
                  <CardDescription>
                    Escaneie para acessar informacoes do produto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QRCodeDisplay 
                    produtoId={item.id} 
                    produtoNome={item.nome}
                    codigo={item.codigo || undefined}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar com resumo */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={STATUS_PRODUTO_COLORS[item.status_produto || 'em_estoque']}>
                  {STATUS_PRODUTO_LABELS[item.status_produto || 'em_estoque']}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Quantidade</span>
                <span className={`font-semibold ${estoqueBaixo ? 'text-red-500' : 'text-emerald-500'}`}>
                  {item.quantidade} unid.
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Valor em Estoque</span>
                <span className="font-semibold">
                  R$ {(item.quantidade * (item.preco_custo || 0)).toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Movimentacoes</span>
                <span className="font-semibold">{movimentacoes.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Acoes rapidas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acoes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href={`/dashboard/estoque/${item.id}/editar`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Produto
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href={`/dashboard/estoque/${item.id}/movimentar`}>
                  <History className="mr-2 h-4 w-4" />
                  Registrar Movimentacao
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href={`/api/relatorios/produto/${item.id}`} target="_blank">
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar PDF
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Ultima movimentacao */}
          {movimentacoes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Ultima Movimentacao
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {new Date(movimentacoes[0].created_at).toLocaleString('pt-BR')}
                </p>
                <p className="font-medium">{movimentacoes[0].observacao || 'Sem observacao'}</p>
                {movimentacoes[0].usuario && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    {(movimentacoes[0].usuario as { nome: string }).nome}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
