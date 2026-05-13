'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { PlanoTipo, StatusEmpresa } from '@/lib/types'

export async function createEmpresa(formData: FormData) {
  const supabase = await createClient()

  const nome = formData.get('nome') as string
  const email = formData.get('email') as string
  const cnpj = formData.get('cnpj') as string
  const telefone = formData.get('telefone') as string
  const endereco = formData.get('endereco') as string
  const plano = formData.get('plano') as PlanoTipo
  const status = formData.get('status') as StatusEmpresa
  const dataVencimento = formData.get('data_vencimento') as string

  const { error } = await supabase.from('empresas').insert({
    nome,
    email,
    cnpj: cnpj || null,
    telefone: telefone || null,
    endereco: endereco || null,
    plano: plano || 'basico',
    status: status || 'ativo',
    data_vencimento: dataVencimento || null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/empresas')
  redirect('/admin/empresas')
}

export async function updateEmpresa(id: string, formData: FormData) {
  const supabase = await createClient()

  const nome = formData.get('nome') as string
  const email = formData.get('email') as string
  const cnpj = formData.get('cnpj') as string
  const telefone = formData.get('telefone') as string
  const endereco = formData.get('endereco') as string
  const plano = formData.get('plano') as PlanoTipo
  const status = formData.get('status') as StatusEmpresa
  const dataVencimento = formData.get('data_vencimento') as string

  const { error } = await supabase
    .from('empresas')
    .update({
      nome,
      email,
      cnpj: cnpj || null,
      telefone: telefone || null,
      endereco: endereco || null,
      plano,
      status,
      data_vencimento: dataVencimento || null,
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/empresas')
  redirect('/admin/empresas')
}

export async function updateEmpresaStatus(id: string, status: StatusEmpresa) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('empresas')
    .update({ status })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/empresas')
  return { success: true }
}

export async function deleteEmpresa(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('empresas').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/empresas')
  return { success: true }
}
