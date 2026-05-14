'use server'

import { createClient } from '@/lib/supabase/server'
import type { TipoMovimentacaoProduto, TipoAcaoLog } from '@/lib/types'

export async function registrarMovimentacaoProduto({
  produtoId,
  tipo,
  quantidade = 1,
  valor,
  clienteId,
  consertoId,
  observacao,
}: {
  produtoId: string
  tipo: TipoMovimentacaoProduto
  quantidade?: number
  valor?: number
  clienteId?: string
  consertoId?: string
  observacao?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nao autorizado')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa_id) throw new Error('Empresa nao encontrada')

  const { error } = await supabase.from('movimentacoes_produto').insert({
    empresa_id: usuario.empresa_id,
    produto_id: produtoId,
    usuario_id: user.id,
    tipo,
    quantidade,
    valor: valor || null,
    cliente_id: clienteId || null,
    conserto_id: consertoId || null,
    observacao: observacao || null,
  })

  if (error) throw error

  return { success: true }
}

export async function registrarLog({
  acao,
  tabela,
  registroId,
  descricao,
  dadosAnteriores,
  dadosNovos,
}: {
  acao: TipoAcaoLog
  tabela: string
  registroId?: string
  descricao: string
  dadosAnteriores?: Record<string, unknown>
  dadosNovos?: Record<string, unknown>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa_id) return

  await supabase.from('logs').insert({
    empresa_id: usuario.empresa_id,
    usuario_id: user.id,
    acao,
    tabela,
    registro_id: registroId || null,
    descricao,
    dados_anteriores: dadosAnteriores || null,
    dados_novos: dadosNovos || null,
  })
}

export async function buscarMovimentacoesProduto(produtoId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('movimentacoes_produto')
    .select(`
      *,
      usuario:usuarios(id, nome),
      cliente:clientes(id, nome),
      conserto:consertos(id, numero)
    `)
    .eq('produto_id', produtoId)
    .order('created_at', { ascending: false })

  return data || []
}

export async function buscarLogs(filtros?: {
  tabela?: string
  registroId?: string
  dataInicio?: string
  dataFim?: string
  limit?: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from('logs')
    .select(`
      *,
      usuario:usuarios(id, nome)
    `)
    .order('created_at', { ascending: false })

  if (filtros?.tabela) {
    query = query.eq('tabela', filtros.tabela)
  }
  if (filtros?.registroId) {
    query = query.eq('registro_id', filtros.registroId)
  }
  if (filtros?.dataInicio) {
    query = query.gte('created_at', filtros.dataInicio)
  }
  if (filtros?.dataFim) {
    query = query.lte('created_at', filtros.dataFim)
  }
  if (filtros?.limit) {
    query = query.limit(filtros.limit)
  }

  const { data } = await query

  return data || []
}

export async function gerarCodigoProduto() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nao autorizado')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa_id) throw new Error('Empresa nao encontrada')

  const { data } = await supabase.rpc('gerar_codigo_produto', {
    p_empresa_id: usuario.empresa_id
  })

  return data as string
}
