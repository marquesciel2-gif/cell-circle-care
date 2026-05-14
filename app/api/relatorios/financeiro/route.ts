import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = request.nextUrl
  
  const dataInicio = searchParams.get('dataInicio')
  const dataFim = searchParams.get('dataFim')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id, empresa:empresas(nome)')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa_id) {
    return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
  }

  // Buscar receitas e despesas
  const [{ data: receitas }, { data: despesas }] = await Promise.all([
    supabase
      .from('receitas')
      .select('*')
      .eq('empresa_id', usuario.empresa_id)
      .gte('created_at', `${dataInicio}T00:00:00`)
      .lte('created_at', `${dataFim}T23:59:59`),
    supabase
      .from('despesas')
      .select('*')
      .eq('empresa_id', usuario.empresa_id)
      .gte('created_at', `${dataInicio}T00:00:00`)
      .lte('created_at', `${dataFim}T23:59:59`)
  ])

  const totalReceitas = receitas?.reduce((sum, r) => sum + Number(r.valor), 0) || 0
  const receitasPagas = receitas?.filter(r => r.status === 'pago').reduce((sum, r) => sum + Number(r.valor), 0) || 0
  const receitasPendentes = receitas?.filter(r => r.status === 'pendente').reduce((sum, r) => sum + Number(r.valor), 0) || 0
  
  const totalDespesas = despesas?.reduce((sum, d) => sum + Number(d.valor), 0) || 0
  const despesasPagas = despesas?.filter(d => d.status === 'pago').reduce((sum, d) => sum + Number(d.valor), 0) || 0
  const despesasPendentes = despesas?.filter(d => d.status === 'pendente').reduce((sum, d) => sum + Number(d.valor), 0) || 0
  
  const lucroRealizado = receitasPagas - despesasPagas
  const lucroPrevisto = totalReceitas - totalDespesas

  // Gerar PDF
  const doc = new jsPDF()
  const empresaNome = (usuario.empresa as { nome: string })?.nome || 'Empresa'
  
  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMO FINANCEIRO', 105, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(empresaNome, 105, 28, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text(`Período: ${formatDate(dataInicio!)} a ${formatDate(dataFim!)}`, 105, 35, { align: 'center' })
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 105, 41, { align: 'center' })

  // Resumo
  autoTable(doc, {
    startY: 50,
    head: [['Descrição', 'Valor']],
    body: [
      ['RECEITAS', ''],
      ['   Total de Receitas', formatCurrency(totalReceitas)],
      ['   Receitas Recebidas', formatCurrency(receitasPagas)],
      ['   Receitas Pendentes', formatCurrency(receitasPendentes)],
      ['', ''],
      ['DESPESAS', ''],
      ['   Total de Despesas', formatCurrency(totalDespesas)],
      ['   Despesas Pagas', formatCurrency(despesasPagas)],
      ['   Despesas Pendentes', formatCurrency(despesasPendentes)],
      ['', ''],
      ['RESULTADO', ''],
      ['   Lucro Realizado (Recebido - Pago)', formatCurrency(lucroRealizado)],
      ['   Lucro Previsto (Total - Total)', formatCurrency(lucroPrevisto)],
    ],
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { halign: 'right', cellWidth: 50 }
    },
    didParseCell: function(data) {
      if (data.row.index === 0 || data.row.index === 5 || data.row.index === 10) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [240, 240, 240]
      }
      if (data.row.index === 11) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.textColor = lucroRealizado >= 0 ? [16, 185, 129] : [239, 68, 68]
      }
    }
  })

  const pdfBuffer = doc.output('arraybuffer')
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=resumo-financeiro-${dataInicio}-${dataFim}.pdf`
    }
  })
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
