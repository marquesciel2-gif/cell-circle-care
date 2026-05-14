import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = request.nextUrl
  
  const dataInicio = searchParams.get('dataInicio')
  const dataFim = searchParams.get('dataFim')
  const status = searchParams.get('status') || 'todos'

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

  let query = supabase
    .from('parcelas')
    .select('*, cliente:clientes(nome)')
    .eq('empresa_id', usuario.empresa_id)
    .gte('data_vencimento', dataInicio)
    .lte('data_vencimento', dataFim)
    .order('data_vencimento', { ascending: true })

  if (status !== 'todos') {
    query = query.eq('status', status)
  }

  const { data: parcelas } = await query

  // Gerar PDF
  const doc = new jsPDF()
  const empresaNome = (usuario.empresa as { nome: string })?.nome || 'Empresa'
  
  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('RELATÓRIO DE CREDIÁRIO', 105, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(empresaNome, 105, 28, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text(`Período: ${formatDate(dataInicio!)} a ${formatDate(dataFim!)}`, 105, 35, { align: 'center' })
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 105, 41, { align: 'center' })

  // Tabela
  const tableData = parcelas?.map(p => [
    p.cliente?.nome || '-',
    `${p.numero_parcela}/${p.total_parcelas}`,
    formatDate(p.data_vencimento),
    p.data_pagamento ? formatDate(p.data_pagamento) : '-',
    formatStatus(p.status),
    p.forma_pagamento || '-',
    formatCurrency(p.valor)
  ]) || []

  const totalPendente = parcelas?.filter(p => p.status === 'pendente').reduce((sum, p) => sum + Number(p.valor), 0) || 0
  const totalPago = parcelas?.filter(p => p.status === 'pago').reduce((sum, p) => sum + Number(p.valor), 0) || 0
  const totalAtrasado = parcelas?.filter(p => p.status === 'atrasado').reduce((sum, p) => sum + Number(p.valor), 0) || 0

  autoTable(doc, {
    startY: 50,
    head: [['Cliente', 'Parcela', 'Vencimento', 'Pagamento', 'Status', 'Forma', 'Valor']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [234, 179, 8], textColor: 0 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 40 },
      6: { halign: 'right' }
    },
    foot: [
      ['', '', '', '', '', 'Total Pago:', formatCurrency(totalPago)],
      ['', '', '', '', '', 'Total Pendente:', formatCurrency(totalPendente)],
      ['', '', '', '', '', 'Total Atrasado:', formatCurrency(totalAtrasado)],
    ],
    footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
  })

  const pdfBuffer = doc.output('arraybuffer')
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=crediario-${dataInicio}-${dataFim}.pdf`
    }
  })
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    pendente: 'Pendente',
    pago: 'Pago',
    atrasado: 'Atrasado',
    cancelado: 'Cancelado'
  }
  return labels[status] || status
}
