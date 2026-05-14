import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createPDFDocument, addValueBox, formatCurrency, formatDate, getTableStyles, COLORS } from '@/lib/pdf-generator'
import autoTable from 'jspdf-autotable'

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

  // Buscar clientes
  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .eq('empresa_id', usuario.empresa_id)
    .order('nome', { ascending: true })

  // Buscar consertos se houver periodo
  let consertosQuery = supabase
    .from('consertos')
    .select('*')
    .eq('empresa_id', usuario.empresa_id)

  if (dataInicio) {
    consertosQuery = consertosQuery.gte('data_entrada', `${dataInicio}T00:00:00`)
  }
  if (dataFim) {
    consertosQuery = consertosQuery.lte('data_entrada', `${dataFim}T23:59:59`)
  }

  const { data: consertos } = await consertosQuery

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

  // Calcular totais
  const totalClientes = clientesComServicos.length
  const totalServicos = clientesComServicos.reduce((sum, c) => sum + c.totalServicos, 0)
  const valorTotal = clientesComServicos.reduce((sum, c) => sum + c.valorTotal, 0)
  const mediaCliente = totalClientes > 0 ? valorTotal / totalClientes : 0

  // Gerar PDF
  const doc = createPDFDocument({
    titulo: 'RELATORIO POR CLIENTE',
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

  // Resumo em caixas
  const boxWidth = (pageWidth - margin * 2 - 30) / 4
  addValueBox(doc, 'CLIENTES', `${totalClientes}`, margin, y, boxWidth, COLORS.primary)
  addValueBox(doc, 'SERVICOS', `${totalServicos}`, margin + boxWidth + 10, y, boxWidth, COLORS.secondary)
  addValueBox(doc, 'VALOR TOTAL', formatCurrency(valorTotal), margin + (boxWidth + 10) * 2, y, boxWidth, COLORS.success)
  addValueBox(doc, 'MEDIA/CLIENTE', formatCurrency(mediaCliente), margin + (boxWidth + 10) * 3, y, boxWidth, COLORS.primary)
  
  y += 35

  // Tabela
  const tableData = clientesComServicos.map(c => [
    c.nome,
    c.telefone || '-',
    c.email || '-',
    c.totalServicos.toString(),
    formatCurrency(c.valorTotal)
  ])

  autoTable(doc, {
    startY: y,
    head: [['Cliente', 'Telefone', 'E-mail', 'Servicos', 'Valor Total']],
    body: tableData,
    ...getTableStyles(),
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 35 },
      2: { cellWidth: 50 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' }
    },
    foot: [[
      `Total: ${totalClientes} clientes`, '', '',
      totalServicos.toString(),
      formatCurrency(valorTotal)
    ]],
    footStyles: { 
      fillColor: COLORS.secondary, 
      textColor: COLORS.white, 
      fontStyle: 'bold',
      fontSize: 10
    },
    didDrawPage: () => {
      doc.setFontSize(8)
      doc.setTextColor(...COLORS.textLight)
      doc.text(
        `${empresa.nome} - Relatorio gerado pelo Smart Cell`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }
  })

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=clientes-${dataInicio || 'todos'}-${dataFim || ''}.pdf`
    }
  })
}
