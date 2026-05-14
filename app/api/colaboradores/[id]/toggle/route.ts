import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  const { ativo } = await request.json()

  // Verificar se o colaborador pertence à mesma empresa
  const { data: colaborador } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', id)
    .single()

  if (!colaborador || colaborador.empresa_id !== currentUser.empresa_id) {
    return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })
  }

  const { error } = await supabase
    .from('usuarios')
    .update({ ativo })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
