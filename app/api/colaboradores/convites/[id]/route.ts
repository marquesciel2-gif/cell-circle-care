import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
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

  const { error } = await supabase
    .from('convites_colaborador')
    .delete()
    .eq('id', id)
    .eq('empresa_id', currentUser.empresa_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
