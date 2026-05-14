'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ==================== RECEITAS ====================

export async function createReceita(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa_id) return { error: 'Empresa não encontrada' }

  const descricao = formData.get('descricao') as string
  const valor = parseFloat(formData.get('valor') as string)
  const categoria = formData.get('categoria') as string
  const clienteId = formData.get('cliente_id') as string
  const consertoId = formData.get('conserto_id') as string
  const dataVencimento = formData.get('data_vencimento') as string
  const formaPagamento = formData.get('forma_pagamento') as string
  const observacoes = formData.get('observacoes') as string
  const parcelado = formData.get('parcelado') === 'on'
  const numeroParcelas = parseInt(formData.get('numero_parcelas') as string) || 1

  // Se for parcelado, criar as parcelas
  if (parcelado && numeroParcelas > 1) {
    const valorParcela = valor / numeroParcelas
    const dataBase = dataVencimento ? new Date(dataVencimento) : new Date()
    
    // Criar receita principal
    const { data: receita, error: receitaError } = await supabase
      .from('receitas')
      .insert({
        empresa_id: usuario.empresa_id,
        descricao: `${descricao} (${numeroParcelas}x)`,
        valor,
        categoria: categoria || 'servico',
        cliente_id: clienteId || null,
        conserto_id: consertoId || null,
        data_vencimento: dataVencimento || null,
        forma_pagamento: formaPagamento || null,
        observacoes: observacoes || null,
        status: 'pendente',
        parcelado: true,
        numero_parcelas: numeroParcelas,
      })
      .select()
      .single()

    if (receitaError) {
      return { error: receitaError.message }
    }

    // Criar as parcelas
    const parcelas = []
    for (let i = 1; i <= numeroParcelas; i++) {
      const dataVenc = new Date(dataBase)
      dataVenc.setMonth(dataVenc.getMonth() + (i - 1))
      
      parcelas.push({
        empresa_id: usuario.empresa_id,
        receita_id: receita.id,
        cliente_id: clienteId || null,
        conserto_id: consertoId || null,
        numero_parcela: i,
        total_parcelas: numeroParcelas,
        valor: valorParcela,
        data_vencimento: dataVenc.toISOString().split('T')[0],
        status: 'pendente',
        forma_pagamento: formaPagamento || null,
      })
    }

    const { error: parcelasError } = await supabase.from('parcelas').insert(parcelas)
    
    if (parcelasError) {
      return { error: parcelasError.message }
    }
  } else {
    // Receita normal (sem parcelamento)
    const { error } = await supabase.from('receitas').insert({
      empresa_id: usuario.empresa_id,
      descricao,
      valor,
      categoria: categoria || 'servico',
      cliente_id: clienteId || null,
      conserto_id: consertoId || null,
      data_vencimento: dataVencimento || null,
      forma_pagamento: formaPagamento || null,
      observacoes: observacoes || null,
      status: 'pendente',
      parcelado: false,
      numero_parcelas: 1,
    })

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/dashboard/financeiro')
  redirect('/dashboard/financeiro?tab=receitas')
}

export async function updateReceita(id: string, formData: FormData) {
  const supabase = await createClient()

  const descricao = formData.get('descricao') as string
  const valor = parseFloat(formData.get('valor') as string)
  const categoria = formData.get('categoria') as string
  const clienteId = formData.get('cliente_id') as string
  const dataVencimento = formData.get('data_vencimento') as string
  const formaPagamento = formData.get('forma_pagamento') as string
  const status = formData.get('status') as string
  const observacoes = formData.get('observacoes') as string

  const updateData: Record<string, unknown> = {
    descricao,
    valor,
    categoria: categoria || 'servico',
    cliente_id: clienteId || null,
    data_vencimento: dataVencimento || null,
    forma_pagamento: formaPagamento || null,
    status,
    observacoes: observacoes || null,
  }

  if (status === 'pago') {
    updateData.data_pagamento = new Date().toISOString().split('T')[0]
  }

  const { error } = await supabase
    .from('receitas')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/financeiro')
  redirect('/dashboard/financeiro?tab=receitas')
}

export async function deleteReceita(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('receitas').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/financeiro')
  return { success: true }
}

export async function marcarReceitaPaga(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('receitas')
    .update({
      status: 'pago',
      data_pagamento: new Date().toISOString().split('T')[0],
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/financeiro')
  return { success: true }
}

// ==================== DESPESAS ====================

export async function createDespesa(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa_id) return { error: 'Empresa não encontrada' }

  const descricao = formData.get('descricao') as string
  const valor = parseFloat(formData.get('valor') as string)
  const categoria = formData.get('categoria') as string
  const fornecedor = formData.get('fornecedor') as string
  const dataVencimento = formData.get('data_vencimento') as string
  const observacoes = formData.get('observacoes') as string

  const { error } = await supabase.from('despesas').insert({
    empresa_id: usuario.empresa_id,
    descricao,
    valor,
    categoria: categoria || null,
    fornecedor: fornecedor || null,
    data_vencimento: dataVencimento || null,
    observacoes: observacoes || null,
    status: 'pendente',
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/financeiro')
  redirect('/dashboard/financeiro?tab=despesas')
}

export async function updateDespesa(id: string, formData: FormData) {
  const supabase = await createClient()

  const descricao = formData.get('descricao') as string
  const valor = parseFloat(formData.get('valor') as string)
  const categoria = formData.get('categoria') as string
  const fornecedor = formData.get('fornecedor') as string
  const dataVencimento = formData.get('data_vencimento') as string
  const status = formData.get('status') as string
  const observacoes = formData.get('observacoes') as string

  const updateData: Record<string, unknown> = {
    descricao,
    valor,
    categoria: categoria || null,
    fornecedor: fornecedor || null,
    data_vencimento: dataVencimento || null,
    status,
    observacoes: observacoes || null,
  }

  if (status === 'pago') {
    updateData.data_pagamento = new Date().toISOString().split('T')[0]
  }

  const { error } = await supabase
    .from('despesas')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/financeiro')
  redirect('/dashboard/financeiro?tab=despesas')
}

export async function deleteDespesa(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('despesas').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/financeiro')
  return { success: true }
}

export async function marcarDespesaPaga(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('despesas')
    .update({
      status: 'pago',
      data_pagamento: new Date().toISOString().split('T')[0],
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/financeiro')
  return { success: true }
}
