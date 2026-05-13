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

  // 1. Criar o usuário no auth (sem necessidade de confirmação de email)
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

  // Verificar se o email já foi confirmado automaticamente (quando confirmação está desabilitada)
  const emailConfirmed = authData.user.email_confirmed_at !== null

  // 2. Criar empresa e usuário usando função RPC (contorna RLS)
  const { data: rpcResult, error: rpcError } = await supabase.rpc('criar_empresa_e_usuario', {
    p_user_id: authData.user.id,
    p_nome_empresa: nomeEmpresa,
    p_email_empresa: email,
    p_telefone_empresa: telefone,
    p_nome_usuario: nome,
    p_email_usuario: email,
    p_cpf_cnpj: cpfCnpj
  })

  if (rpcError || !rpcResult?.success) {
    console.error('Erro ao criar empresa e usuário:', rpcError || rpcResult?.error)
    return { error: 'Erro ao configurar sua conta. Tente novamente.' }
  }

  // Se o email foi confirmado automaticamente, fazer login direto
  if (emailConfirmed) {
    // Fazer login automático
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (!loginError) {
      redirect('/dashboard')
    }
  }

  return { 
    success: true,
    message: emailConfirmed 
      ? 'Cadastro realizado com sucesso! Redirecionando...'
      : 'Cadastro realizado! Verifique seu e-mail para confirmar a conta.'
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
