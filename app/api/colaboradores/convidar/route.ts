import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: currentUser } = await supabase
    .from('usuarios')
    .select('empresa_id, is_admin')
    .eq('id', user.id)
    .single()

  if (!currentUser?.empresa_id || !currentUser.is_admin) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { email, cargo_tipo } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
  }

  // Verificar se já existe um usuário com esse email
  const { data: existingUser } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .single()

  if (existingUser) {
    return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 400 })
  }

  // Verificar se já existe um convite pendente
  const { data: existingInvite } = await supabase
    .from('convites_colaborador')
    .select('id')
    .eq('email', email)
    .eq('empresa_id', currentUser.empresa_id)
    .eq('usado', false)
    .gte('expira_em', new Date().toISOString())
    .single()

  if (existingInvite) {
    return NextResponse.json({ error: 'Já existe um convite pendente para este email' }, { status: 400 })
  }

  // Verificar limite de usuários do plano
  const { data: empresa } = await supabase
    .from('empresas')
    .select('plano')
    .eq('id', currentUser.empresa_id)
    .single()

  const { data: limites } = await supabase
    .from('plano_limites')
    .select('max_usuarios')
    .eq('plano', empresa?.plano || 'basico')
    .single()

  const { count: totalUsuarios } = await supabase
    .from('usuarios')
    .select('*', { count: 'exact', head: true })
    .eq('empresa_id', currentUser.empresa_id)

  if ((totalUsuarios || 0) >= (limites?.max_usuarios || 2)) {
    return NextResponse.json({ error: 'Limite de colaboradores atingido. Faça upgrade do plano.' }, { status: 400 })
  }

  // Criar convite
  const { data: convite, error } = await supabase
    .from('convites_colaborador')
    .insert({
      empresa_id: currentUser.empresa_id,
      email,
      cargo_tipo: cargo_tipo || 'tecnico',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // TODO: Enviar email com link de convite
  // Por enquanto, apenas retornamos o convite criado

  return NextResponse.json({ 
    success: true, 
    convite,
    message: 'Convite criado. O colaborador precisa se cadastrar usando este email.' 
  })
}
