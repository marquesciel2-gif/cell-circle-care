'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createItemEstoque(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa_id) return { error: 'Empresa não encontrada' }

  const nome = formData.get('nome') as string
  const codigo = formData.get('codigo') as string
  const categoria = formData.get('categoria') as string
  const descricao = formData.get('descricao') as string
  const quantidade = parseInt(formData.get('quantidade') as string) || 0
  const quantidadeMinima = parseInt(formData.get('quantidade_minima') as string) || 5
  const precoCusto = parseFloat(formData.get('preco_custo') as string) || 0
  const precoVenda = parseFloat(formData.get('preco_venda') as string) || 0
  const fornecedor = formData.get('fornecedor') as string
  const localizacao = formData.get('localizacao') as string
  // Novos campos de rastreabilidade
  const marca = formData.get('marca') as string
  const modelo = formData.get('modelo') as string
  const numeroSerie = formData.get('numero_serie') as string
  const imei = formData.get('imei') as string
  const codigoBarras = formData.get('codigo_barras') as string
  const garantiaMeses = parseInt(formData.get('garantia_meses') as string) || 0
  const dataEntrada = formData.get('data_entrada') as string

  const { data: item, error } = await supabase.from('estoque').insert({
    empresa_id: usuario.empresa_id,
    nome,
    codigo: codigo || null,
    categoria: categoria || null,
    descricao: descricao || null,
    quantidade,
    quantidade_minima: quantidadeMinima,
    preco_custo: precoCusto,
    preco_venda: precoVenda,
    fornecedor: fornecedor || null,
    localizacao: localizacao || null,
    marca: marca || null,
    modelo: modelo || null,
    numero_serie: numeroSerie || null,
    imei: imei || null,
    codigo_barras: codigoBarras || null,
    garantia_meses: garantiaMeses,
    data_entrada: dataEntrada || null,
    status_produto: 'em_estoque',
  }).select().single()

  if (error) {
    return { error: error.message }
  }

  // Registrar movimentacao de entrada inicial
  if (item && quantidade > 0) {
    await supabase.from('movimentacoes_produto').insert({
      empresa_id: usuario.empresa_id,
      produto_id: item.id,
      usuario_id: user.id,
      tipo: 'entrada',
      quantidade,
      valor: precoCusto * quantidade,
      observacao: 'Entrada inicial no cadastro do produto',
    })
  }

  revalidatePath('/dashboard/estoque')
  redirect('/dashboard/estoque')
}

export async function updateItemEstoque(id: string, formData: FormData) {
  const supabase = await createClient()

  const nome = formData.get('nome') as string
  const codigo = formData.get('codigo') as string
  const categoria = formData.get('categoria') as string
  const descricao = formData.get('descricao') as string
  const quantidadeMinima = parseInt(formData.get('quantidade_minima') as string) || 5
  const precoCusto = parseFloat(formData.get('preco_custo') as string) || 0
  const precoVenda = parseFloat(formData.get('preco_venda') as string) || 0
  const fornecedor = formData.get('fornecedor') as string
  const localizacao = formData.get('localizacao') as string
  // Novos campos de rastreabilidade
  const marca = formData.get('marca') as string
  const modelo = formData.get('modelo') as string
  const numeroSerie = formData.get('numero_serie') as string
  const imei = formData.get('imei') as string
  const codigoBarras = formData.get('codigo_barras') as string
  const garantiaMeses = parseInt(formData.get('garantia_meses') as string) || 0
  const dataEntrada = formData.get('data_entrada') as string
  const statusProduto = formData.get('status_produto') as string

  const { error } = await supabase
    .from('estoque')
    .update({
      nome,
      codigo: codigo || null,
      categoria: categoria || null,
      descricao: descricao || null,
      quantidade_minima: quantidadeMinima,
      preco_custo: precoCusto,
      preco_venda: precoVenda,
      fornecedor: fornecedor || null,
      localizacao: localizacao || null,
      marca: marca || null,
      modelo: modelo || null,
      numero_serie: numeroSerie || null,
      imei: imei || null,
      codigo_barras: codigoBarras || null,
      garantia_meses: garantiaMeses,
      data_entrada: dataEntrada || null,
      status_produto: statusProduto || 'em_estoque',
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/estoque')
  redirect('/dashboard/estoque')
}

export async function deleteItemEstoque(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('estoque').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/estoque')
  return { success: true }
}

export async function movimentarEstoque(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa_id) return { error: 'Empresa não encontrada' }

  const produtoId = formData.get('produto_id') as string
  const tipo = formData.get('tipo') as 'entrada' | 'saida' | 'ajuste'
  const quantidade = parseInt(formData.get('quantidade') as string)
  const motivo = formData.get('motivo') as string

  // Buscar quantidade atual
  const { data: item } = await supabase
    .from('estoque')
    .select('quantidade')
    .eq('id', produtoId)
    .single()

  if (!item) return { error: 'Item não encontrado' }

  // Calcular nova quantidade
  let novaQuantidade = item.quantidade
  if (tipo === 'entrada') {
    novaQuantidade += quantidade
  } else if (tipo === 'saida') {
    novaQuantidade -= quantidade
    if (novaQuantidade < 0) {
      return { error: 'Quantidade insuficiente em estoque' }
    }
  } else {
    novaQuantidade = quantidade
  }

  // Registrar movimentação
  const { error: movError } = await supabase.from('movimentacoes_estoque').insert({
    empresa_id: usuario.empresa_id,
    produto_id: produtoId,
    tipo,
    quantidade,
    motivo: motivo || null,
    usuario_id: user.id,
  })

  if (movError) {
    return { error: movError.message }
  }

  // Atualizar quantidade
  const { error: updateError } = await supabase
    .from('estoque')
    .update({ quantidade: novaQuantidade })
    .eq('id', produtoId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/dashboard/estoque')
  redirect('/dashboard/estoque')
}
