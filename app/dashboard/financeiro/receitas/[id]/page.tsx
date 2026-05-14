'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Receita, Cliente, StatusFinanceiro } from '@/lib/types'
import { STATUS_FINANCEIRO_LABELS } from '@/lib/types'

export default function EditarReceitaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [receita, setReceita] = useState<Receita | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState('servico')
  const [clienteId, setClienteId] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')
  const [dataPagamento, setDataPagamento] = useState('')
  const [status, setStatus] = useState<StatusFinanceiro>('pendente')
  const [formaPagamento, setFormaPagamento] = useState('')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      // Carregar receita
      const { data: receitaData } = await supabase
        .from('receitas')
        .select('*')
        .eq('id', id)
        .single()
      
      if (receitaData) {
        setReceita(receitaData)
        setDescricao(receitaData.descricao)
        setValor(receitaData.valor.toString())
        setCategoria(receitaData.categoria || 'servico')
        setClienteId(receitaData.cliente_id || '')
        setDataVencimento(receitaData.data_vencimento || '')
        setDataPagamento(receitaData.data_pagamento || '')
        setStatus(receitaData.status)
        setFormaPagamento(receitaData.forma_pagamento || '')
        setObservacoes(receitaData.observacoes || '')
      }
      
      // Carregar clientes
      const { data: clientesData } = await supabase
        .from('clientes')
        .select('id, nome')
        .order('nome')
      
      setClientes(clientesData || [])
      setLoading(false)
    }
    
    loadData()
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    
    const supabase = createClient()
    
    const { error } = await supabase
      .from('receitas')
      .update({
        descricao,
        valor: parseFloat(valor),
        categoria,
        cliente_id: clienteId || null,
        data_vencimento: dataVencimento || null,
        data_pagamento: dataPagamento || null,
        status,
        forma_pagamento: formaPagamento || null,
        observacoes: observacoes || null,
      })
      .eq('id', id)
    
    setSaving(false)
    
    if (error) {
      toast.error('Erro ao salvar receita')
      return
    }
    
    toast.success('Receita atualizada com sucesso!')
    router.push('/dashboard/financeiro?tab=receitas')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!receita) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Receita nao encontrada</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/financeiro?tab=receitas">Voltar</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/financeiro?tab=receitas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Receita</h1>
          <p className="text-muted-foreground">Atualize os dados da receita</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Receita</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descricao">Descricao *</Label>
                <Input
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="servico">Servico</SelectItem>
                    <SelectItem value="venda">Venda de Produto</SelectItem>
                    <SelectItem value="acessorio">Acessorio</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as StatusFinanceiro)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_FINANCEIRO_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_pagamento">Data de Pagamento</Label>
                <Input
                  id="data_pagamento"
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nao informado</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="credito">Cartao de Credito</SelectItem>
                    <SelectItem value="debito">Cartao de Debito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="observacoes">Observacoes</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/financeiro?tab=receitas">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
