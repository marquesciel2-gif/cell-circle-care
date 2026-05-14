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

  const { data: consertos } = await supabase
    .from('consertos')
    .select('*, cliente:clientes(nome)')
    .eq('empresa_id', usuario.empresa_id)
    .gte('data_entrada', `${dataInicio}T00:00:00`)
    .lte('data_entrada', `${dataFim}T23:59:59`)
    .order('data_entrada', { ascending: false })

  // Gerar PDF
  const doc = new jsPDF('landscape')
  const empresaNome = (usuario.empresa as { nome: string })?.nome || 'Empresa'
  
  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('RELATÓRIO DE CONSERTOS', 148, 15, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(empresaNome, 148, 22, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text(`Período: ${formatDate(dataInicio!)} a ${formatDate(dataFim!)}`, 148, 28, { align: 'center' })

  // Tabela
  const tableData = consertos?.map(c => [
    c.numero,
    formatDate(c.data_entrada),
    c.cliente?.nome || '-',
    `${c.marca || ''} ${c.modelo || ''}`.trim() || c.dispositivo,
    c.problema.substring(0, 40) + (c.problema.length > 40 ? '...' : ''),
    formatStatus(c.status),
    c.tecnico_responsavel || '-',
    formatCurrency(c.valor)
  ]) || []

  autoTable(doc, {
    startY: 35,
    head: [['OS', 'Entrada', 'Cliente', 'Dispositivo', 'Problema', 'Status', 'Técnico', 'Valor']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [139, 92, 246], textColor: 255 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 20 },
      7: { halign: 'right' }
    },
    foot: [[
      `Total: ${consertos?.length || 0} consertos`, '', '', '', '', '', 'TOTAL:',
      formatCurrency(consertos?.reduce((sum, c) => sum + Number(c.valor), 0) || 0)
    ]],
    footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
  })

  const pdfBuffer = doc.output('arraybuffer')
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=consertos-${dataInicio}-${dataFim}.pdf`
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
    recebido: 'Recebido',
    diagnostico: 'Diagnóstico',
    aguardando_aprovacao: 'Aguard. Aprov.',
    em_reparo: 'Em Reparo',
    pronto: 'Pronto',
    entregue: 'Entregue',
    cancelado: 'Cancelado'
  }
  return labels[status] || status
}
