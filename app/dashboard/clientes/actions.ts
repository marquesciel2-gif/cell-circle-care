'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCliente(formData: FormData) {
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
  const telefone = formData.get('telefone') as string
  const email = formData.get('email') as string
  const cpf = formData.get('cpf') as string
  const endereco = formData.get('endereco') as string
  const observacoes = formData.get('observacoes') as string

  const { error } = await supabase.from('clientes').insert({
    empresa_id: usuario.empresa_id,
    nome,
    telefone: telefone || null,
    email: email || null,
    cpf: cpf || null,
    endereco: endereco || null,
    observacoes: observacoes || null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/clientes')
  redirect('/dashboard/clientes')
}

export async function updateCliente(id: string, formData: FormData) {
  const supabase = await createClient()

  const nome = formData.get('nome') as string
  const telefone = formData.get('telefone') as string
  const email = formData.get('email') as string
  const cpf = formData.get('cpf') as string
  const endereco = formData.get('endereco') as string
  const observacoes = formData.get('observacoes') as string

  const { error } = await supabase
    .from('clientes')
    .update({
      nome,
      telefone: telefone || null,
      email: email || null,
      cpf: cpf || null,
      endereco: endereco || null,
      observacoes: observacoes || null,
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/clientes')
  redirect('/dashboard/clientes')
}

export async function deleteCliente(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('clientes').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/clientes')
  return { success: true }
}
