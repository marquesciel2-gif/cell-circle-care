'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function cadastrar(formData: FormData) {
  const supabase = await createClient()

  const nome = formData.get('nome') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const cpfCnpj = formData.get('cpfCnpj') as string
  const nomeEmpresa = formData.get('nomeEmpresa') as string
  const telefone = formData.get('telefone') as string

  // 1. Criar o usuário no auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      data: {
        nome,
        email,
      },
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Erro ao criar usuário' }
  }

  // 2. Criar a empresa primeiro (usando service role ou trigger)
  // Por enquanto, vamos usar uma abordagem que funciona com RLS
  // O admin master criará empresas, ou vamos ajustar a política
  
  // Para permitir que usuários criem suas próprias empresas no cadastro,
  // precisamos de uma função RPC ou ajustar temporariamente
  
  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .insert({
      nome: nomeEmpresa,
      email,
      telefone,
    })
    .select()
    .single()

  if (empresaError) {
    // Se falhar ao criar empresa, ainda deixamos o usuário criado
    // Ele poderá ser vinculado depois por um admin
    console.error('Erro ao criar empresa:', empresaError)
  }

  // 3. Criar o registro do usuário na tabela usuarios
  const { error: usuarioError } = await supabase.from('usuarios').insert({
    id: authData.user.id,
    empresa_id: empresa?.id || null,
    nome,
    email,
    cpf_cnpj: cpfCnpj,
    is_admin: true, // Primeiro usuário da empresa é admin
    is_master: false,
  })

  if (usuarioError) {
    console.error('Erro ao criar perfil de usuário:', usuarioError)
  }

  return { 
    success: true,
    message: 'Cadastro realizado! Verifique seu e-mail para confirmar a conta.'
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export async function getUsuarioAtual() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*, empresa:empresas(*)')
    .eq('id', user.id)
    .single()
  
  return usuario
}
