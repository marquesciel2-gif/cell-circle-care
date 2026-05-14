'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Package } from 'lucide-react'
import { toast } from 'sonner'
import { TIPO_MOVIMENTACAO_PRODUTO_LABELS, type TipoMovimentacaoProduto, type ItemEstoque, type Cliente } from '@/lib/types'

export default function MovimentarProdutoPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [item, setItem] = useState<ItemEstoque | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  
  const [tipo, setTipo] = useState<TipoMovimentacaoProduto>('entrada')
  const [quantidade, setQuantidade] = useState(1)
  const [valor, setValor] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [observacao, setObservacao] = useState('')

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const id = params.id as string

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', user.id)
        .single()

      const [{ data: itemData }, { data: clientesData }] = await Promise.all([
        supabase.from('estoque').select('*').eq('id', id).single(),
        supabase.from('clientes').select('id, nome').eq('empresa_id', usuario?.empresa_id).order('nome')
      ])

      if (itemData) setItem(itemData)
      if (clientesData) setClientes(clientesData)
      setLoadingData(false)
    }

    loadData()
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !item) {
        toast.error('Erro ao registrar movimentacao')
        return
      }

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', user.id)
        .single()

      // Registrar movimentacao
      const { error: movError } = await supabase.from('movimentacoes_produto').insert({
        empresa_id: usuario?.empresa_id,
        produto_id: item.id,
        usuario_id: user.id,
        tipo,
        quantidade,
        valor: valor ? parseFloat(valor) : null,
        cliente_id: clienteId || null,
        observacao: observacao || null,
      })

      if (movError) throw movError

      // Atualizar quantidade do estoque
      let novaQuantidade = item.quantidade
      if (['entrada', 'devolucao'].includes(tipo)) {
        novaQuantidade += quantidade
      } else if (['venda', 'perda', 'uso_conserto'].includes(tipo)) {
        novaQuantidade -= quantidade
      }

      // Atualizar status se necessario
      let novoStatus = item.status_produto
      if (tipo === 'venda') novoStatus = 'vendido'
      else if (tipo === 'reserva') novoStatus = 'reservado'
      else if (tipo === 'manutencao') novoStatus = 'em_manutencao'
      else if (tipo === 'devolucao') novoStatus = 'em_estoque'
      else if (tipo === 'cancelamento') novoStatus = 'cancelado'

      const { error: updateError } = await supabase
        .from('estoque')
        .update({ 
          quantidade: novaQuantidade,
          status_produto: novoStatus
        })
        .eq('id', item.id)

      if (updateError) throw updateError

      toast.success('Movimentacao registrada com sucesso!')
      router.push(`/dashboard/estoque/${item.id}`)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao registrar movimentacao')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registrar Movimentacao</h1>
          <p className="text-muted-foreground">{item.nome}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova Movimentacao</CardTitle>
          <CardDescription>
            Registre entrada, saida ou outras movimentacoes do produto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Movimentacao</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as TipoMovimentacaoProduto)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_MOVIMENTACAO_PRODUTO_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantidade}
                  onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label>Valor (opcional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Cliente (opcional)</Label>
                <Select value={clienteId || "none"} onValueChange={(v) => setClienteId(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Observacao</Label>
                <Textarea
                  placeholder="Descreva o motivo da movimentacao..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Movimentacao
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
