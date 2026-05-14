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
    .from('receitas')
    .select('*, cliente:clientes(nome)')
    .eq('empresa_id', usuario.empresa_id)
    .gte('created_at', `${dataInicio}T00:00:00`)
    .lte('created_at', `${dataFim}T23:59:59`)
    .order('created_at', { ascending: false })

  if (status !== 'todos') {
    query = query.eq('status', status)
  }

  const { data: receitas } = await query

  // Gerar PDF
  const doc = new jsPDF()
  const empresaNome = (usuario.empresa as { nome: string })?.nome || 'Empresa'
  
  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('RELATÓRIO DE RECEITAS', 105, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(empresaNome, 105, 28, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text(`Período: ${formatDate(dataInicio!)} a ${formatDate(dataFim!)}`, 105, 35, { align: 'center' })
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 105, 41, { align: 'center' })

  // Tabela
  const tableData = receitas?.map(r => [
    formatDate(r.created_at),
    r.descricao,
    r.cliente?.nome || '-',
    r.categoria || '-',
    formatStatus(r.status),
    r.forma_pagamento || '-',
    formatCurrency(r.valor)
  ]) || []

  autoTable(doc, {
    startY: 50,
    head: [['Data', 'Descrição', 'Cliente', 'Categoria', 'Status', 'Pagamento', 'Valor']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 45 },
      6: { halign: 'right' }
    },
    foot: [[
      '', '', '', '', '', 'TOTAL:',
      formatCurrency(receitas?.reduce((sum, r) => sum + Number(r.valor), 0) || 0)
    ]],
    footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
  })

  const pdfBuffer = doc.output('arraybuffer')
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=receitas-${dataInicio}-${dataFim}.pdf`
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
