import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  createPDFDocument,
  addValueBox,
  addSectionTitle,
  addInfoRow,
  formatCurrency,
  formatDate,
  COLORS
} from '@/lib/pdf-generator'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = request.nextUrl
  
  const dataInicio = searchParams.get('dataInicio')
  const dataFim = searchParams.get('dataFim')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*, empresa:empresas(*)')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa) {
    return NextResponse.json({ error: 'Empresa nao encontrada' }, { status: 404 })
  }

  const empresa = usuario.empresa as { nome: string; cnpj?: string; telefone?: string; email?: string }

  // Buscar receitas e despesas
  let receitasQuery = supabase.from('receitas').select('*').eq('empresa_id', usuario.empresa_id)
  let despesasQuery = supabase.from('despesas').select('*').eq('empresa_id', usuario.empresa_id)

  if (dataInicio) {
    receitasQuery = receitasQuery.gte('created_at', `${dataInicio}T00:00:00`)
    despesasQuery = despesasQuery.gte('created_at', `${dataInicio}T00:00:00`)
  }
  if (dataFim) {
    receitasQuery = receitasQuery.lte('created_at', `${dataFim}T23:59:59`)
    despesasQuery = despesasQuery.lte('created_at', `${dataFim}T23:59:59`)
  }

  const [{ data: receitas }, { data: despesas }] = await Promise.all([receitasQuery, despesasQuery])

  // Calculos
  const totalReceitas = receitas?.reduce((sum, r) => sum + Number(r.valor), 0) || 0
  const receitasPagas = receitas?.filter(r => r.status === 'pago').reduce((sum, r) => sum + Number(r.valor), 0) || 0
  const receitasPendentes = receitas?.filter(r => r.status === 'pendente').reduce((sum, r) => sum + Number(r.valor), 0) || 0
  
  const totalDespesas = despesas?.reduce((sum, d) => sum + Number(d.valor), 0) || 0
  const despesasPagas = despesas?.filter(d => d.status === 'pago').reduce((sum, d) => sum + Number(d.valor), 0) || 0
  const despesasPendentes = despesas?.filter(d => d.status === 'pendente').reduce((sum, d) => sum + Number(d.valor), 0) || 0
  
  const lucroRealizado = receitasPagas - despesasPagas
  const lucroPrevisto = totalReceitas - totalDespesas

  // Gerar PDF
  const doc = createPDFDocument({
    titulo: 'RESUMO FINANCEIRO',
    subtitulo: dataInicio && dataFim ? `Periodo: ${formatDate(dataInicio)} a ${formatDate(dataFim)}` : 'Periodo completo',
    empresa: {
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      telefone: empresa.telefone,
      email: empresa.email,
    },
    usuario: {
      nome: usuario.nome,
      email: usuario.email,
    },
  })

  const margin = 15
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 62

  // Caixas de resumo principal
  const boxWidth = (pageWidth - margin * 2 - 10) / 2
  const lucroColor = lucroRealizado >= 0 ? COLORS.success : COLORS.danger
  addValueBox(doc, 'LUCRO REALIZADO', formatCurrency(lucroRealizado), margin, y, boxWidth, lucroColor)
  addValueBox(doc, 'LUCRO PREVISTO', formatCurrency(lucroPrevisto), margin + boxWidth + 10, y, boxWidth, COLORS.primary)
  
  y += 35

  // Secao Receitas
  y = addSectionTitle(doc, 'RECEITAS', y)
  y = addInfoRow(doc, 'Total de Receitas', formatCurrency(totalReceitas), y, { bold: true })
  y = addInfoRow(doc, 'Receitas Recebidas', formatCurrency(receitasPagas), y, { color: COLORS.success })
  y = addInfoRow(doc, 'Receitas Pendentes', formatCurrency(receitasPendentes), y, { color: COLORS.warning })
  y = addInfoRow(doc, 'Quantidade', `${receitas?.length || 0} registros`, y)
  
  y += 10

  // Secao Despesas
  y = addSectionTitle(doc, 'DESPESAS', y)
  y = addInfoRow(doc, 'Total de Despesas', formatCurrency(totalDespesas), y, { bold: true })
  y = addInfoRow(doc, 'Despesas Pagas', formatCurrency(despesasPagas), y, { color: COLORS.danger })
  y = addInfoRow(doc, 'Despesas Pendentes', formatCurrency(despesasPendentes), y, { color: COLORS.warning })
  y = addInfoRow(doc, 'Quantidade', `${despesas?.length || 0} registros`, y)
  
  y += 10

  // Secao Resultado
  y = addSectionTitle(doc, 'RESULTADO', y)
  
  // Barra visual de lucro vs despesa
  y += 5
  const barWidth = pageWidth - margin * 2
  const receitaPercent = totalReceitas > 0 ? (receitasPagas / totalReceitas) * 100 : 0
  const despesaPercent = totalDespesas > 0 ? (despesasPagas / totalDespesas) * 100 : 0

  // Barra de receitas
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.text)
  doc.text('Receitas Recebidas', margin, y)
  doc.text(`${receitaPercent.toFixed(1)}%`, pageWidth - margin, y, { align: 'right' })
  y += 4
  doc.setFillColor(...COLORS.border)
  doc.roundedRect(margin, y, barWidth, 6, 2, 2, 'F')
  doc.setFillColor(...COLORS.success)
  doc.roundedRect(margin, y, barWidth * (receitaPercent / 100), 6, 2, 2, 'F')
  y += 12

  // Barra de despesas
  doc.setTextColor(...COLORS.text)
  doc.text('Despesas Pagas', margin, y)
  doc.text(`${despesaPercent.toFixed(1)}%`, pageWidth - margin, y, { align: 'right' })
  y += 4
  doc.setFillColor(...COLORS.border)
  doc.roundedRect(margin, y, barWidth, 6, 2, 2, 'F')
  doc.setFillColor(...COLORS.danger)
  doc.roundedRect(margin, y, barWidth * (despesaPercent / 100), 6, 2, 2, 'F')

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=resumo-financeiro-${dataInicio || 'completo'}-${dataFim || ''}.pdf`
    }
  })
}
