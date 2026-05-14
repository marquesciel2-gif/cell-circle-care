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

  // Buscar clientes com seus consertos
  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .eq('empresa_id', usuario.empresa_id)
    .order('nome', { ascending: true })

  const { data: consertos } = await supabase
    .from('consertos')
    .select('*')
    .eq('empresa_id', usuario.empresa_id)
    .gte('data_entrada', `${dataInicio}T00:00:00`)
    .lte('data_entrada', `${dataFim}T23:59:59`)

  // Agregar dados por cliente
  const clientesComServicos = clientes?.map(cliente => {
    const consertosCliente = consertos?.filter(c => c.cliente_id === cliente.id) || []
    const totalServicos = consertosCliente.length
    const valorTotal = consertosCliente.reduce((sum, c) => sum + Number(c.valor), 0)
    return {
      ...cliente,
      totalServicos,
      valorTotal
    }
  }).filter(c => c.totalServicos > 0).sort((a, b) => b.valorTotal - a.valorTotal) || []

  // Gerar PDF
  const doc = new jsPDF()
  const empresaNome = (usuario.empresa as { nome: string })?.nome || 'Empresa'
  
  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('RELATÓRIO POR CLIENTE', 105, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(empresaNome, 105, 28, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text(`Período: ${formatDate(dataInicio!)} a ${formatDate(dataFim!)}`, 105, 35, { align: 'center' })
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 105, 41, { align: 'center' })

  // Tabela
  const tableData = clientesComServicos.map(c => [
    c.nome,
    c.telefone || '-',
    c.email || '-',
    c.totalServicos.toString(),
    formatCurrency(c.valorTotal)
  ])

  autoTable(doc, {
    startY: 50,
    head: [['Cliente', 'Telefone', 'E-mail', 'Serviços', 'Valor Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 50 },
      3: { halign: 'center' },
      4: { halign: 'right' }
    },
    foot: [[
      `Total: ${clientesComServicos.length} clientes`, '', '',
      clientesComServicos.reduce((sum, c) => sum + c.totalServicos, 0).toString(),
      formatCurrency(clientesComServicos.reduce((sum, c) => sum + c.valorTotal, 0))
    ]],
    footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
  })

  const pdfBuffer = doc.output('arraybuffer')
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=clientes-${dataInicio}-${dataFim}.pdf`
    }
  })
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
