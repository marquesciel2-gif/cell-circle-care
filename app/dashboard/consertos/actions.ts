'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { StatusConserto } from '@/lib/types'

export async function createConserto(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa_id) return { error: 'Empresa não encontrada' }

  // Gerar número da OS
  const { data: numeroOS } = await supabase.rpc('gerar_numero_os', {
    p_empresa_id: usuario.empresa_id,
  })

  const clienteId = formData.get('cliente_id') as string
  const dispositivo = formData.get('dispositivo') as string
  const marca = formData.get('marca') as string
  const modelo = formData.get('modelo') as string
  const imei = formData.get('imei') as string
  const cor = formData.get('cor') as string
  const acessorios = formData.get('acessorios') as string
  const senhaDispositivo = formData.get('senha_dispositivo') as string
  const problema = formData.get('problema') as string
  const prioridade = formData.get('prioridade') as string
  const tecnicoResponsavel = formData.get('tecnico_responsavel') as string
  const dataPrevisao = formData.get('data_previsao') as string
  const observacoes = formData.get('observacoes') as string

  const { data: conserto, error } = await supabase
    .from('consertos')
    .insert({
      empresa_id: usuario.empresa_id,
      cliente_id: clienteId || null,
      numero: numeroOS,
      dispositivo,
      marca: marca || null,
      modelo: modelo || null,
      imei: imei || null,
      cor: cor || null,
      acessorios: acessorios || null,
      senha_dispositivo: senhaDispositivo || null,
      problema,
      prioridade: prioridade || 'normal',
      tecnico_responsavel: tecnicoResponsavel || null,
      data_previsao: dataPrevisao || null,
      observacoes: observacoes || null,
      status: 'recebido',
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/consertos')
  redirect(`/dashboard/consertos/${conserto.id}`)
}

export async function updateConserto(id: string, formData: FormData) {
  const supabase = await createClient()

  const clienteId = formData.get('cliente_id') as string
  const dispositivo = formData.get('dispositivo') as string
  const marca = formData.get('marca') as string
  const modelo = formData.get('modelo') as string
  const imei = formData.get('imei') as string
  const cor = formData.get('cor') as string
  const acessorios = formData.get('acessorios') as string
  const senhaDispositivo = formData.get('senha_dispositivo') as string
  const problema = formData.get('problema') as string
  const diagnostico = formData.get('diagnostico') as string
  const solucao = formData.get('solucao') as string
  const valorPecas = parseFloat(formData.get('valor_pecas') as string) || 0
  const valorMaoObra = parseFloat(formData.get('valor_mao_obra') as string) || 0
  const status = formData.get('status') as StatusConserto
  const prioridade = formData.get('prioridade') as string
  const tecnicoResponsavel = formData.get('tecnico_responsavel') as string
  const dataPrevisao = formData.get('data_previsao') as string
  const observacoes = formData.get('observacoes') as string

  const valor = valorPecas + valorMaoObra

  const updateData: Record<string, unknown> = {
    cliente_id: clienteId || null,
    dispositivo,
    marca: marca || null,
    modelo: modelo || null,
    imei: imei || null,
    cor: cor || null,
    acessorios: acessorios || null,
    senha_dispositivo: senhaDispositivo || null,
    problema,
    diagnostico: diagnostico || null,
    solucao: solucao || null,
    valor,
    valor_pecas: valorPecas,
    valor_mao_obra: valorMaoObra,
    status,
    prioridade: prioridade || 'normal',
    tecnico_responsavel: tecnicoResponsavel || null,
    data_previsao: dataPrevisao || null,
    observacoes: observacoes || null,
  }

  // Definir datas de conclusão e entrega baseado no status
  if (status === 'pronto') {
    updateData.data_conclusao = new Date().toISOString()
  } else if (status === 'entregue') {
    updateData.data_entrega = new Date().toISOString()
  }

  const { error } = await supabase
    .from('consertos')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/consertos')
  revalidatePath(`/dashboard/consertos/${id}`)
  redirect(`/dashboard/consertos/${id}`)
}

export async function updateConsertoStatus(id: string, status: StatusConserto) {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = { status }

  if (status === 'pronto') {
    updateData.data_conclusao = new Date().toISOString()
  } else if (status === 'entregue') {
    updateData.data_entrega = new Date().toISOString()
  }

  const { error } = await supabase
    .from('consertos')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/consertos')
  return { success: true }
}

export async function deleteConserto(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('consertos').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/consertos')
  return { success: true }
}
