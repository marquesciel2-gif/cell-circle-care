import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createPDFDocument, addValueBox, formatCurrency, formatDate, getTableStyles, COLORS } from '@/lib/pdf'
import autoTable from 'jspdf-autotable'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = request.nextUrl
  
  const dataInicio = searchParams.get('dataInicio')
  const dataFim = searchParams.get('dataFim')
  const status = searchParams.get('status') || 'todos'

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

  let query = supabase
    .from('parcelas')
    .select('*, cliente:clientes(nome)')
    .eq('empresa_id', usuario.empresa_id)
    .order('data_vencimento', { ascending: true })

  if (dataInicio) {
    query = query.gte('data_vencimento', dataInicio)
  }
  if (dataFim) {
    query = query.lte('data_vencimento', dataFim)
  }
  if (status !== 'todos') {
    query = query.eq('status', status)
  }

  const { data: parcelas } = await query

  // Calcular totais
  const totalPago = parcelas?.filter(p => p.status === 'pago').reduce((sum, p) => sum + Number(p.valor), 0) || 0
  const totalPendente = parcelas?.filter(p => p.status === 'pendente').reduce((sum, p) => sum + Number(p.valor), 0) || 0
  const totalAtrasado = parcelas?.filter(p => p.status === 'atrasado').reduce((sum, p) => sum + Number(p.valor), 0) || 0
  const totalGeral = parcelas?.reduce((sum, p) => sum + Number(p.valor), 0) || 0

  // Gerar PDF
  const doc = createPDFDocument({
    titulo: 'RELATORIO DE CREDIARIO',
    subtitulo: dataInicio && dataFim ? `Vencimento: ${formatDate(dataInicio)} a ${formatDate(dataFim)}` : 'Todas as parcelas',
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
  addValueBox(doc, 'TOTAL', formatCurrency(totalGeral), margin, y, boxWidth, COLORS.primary)
  addValueBox(doc, 'PAGO', formatCurrency(totalPago), margin + boxWidth + 10, y, boxWidth, COLORS.success)
  addValueBox(doc, 'PENDENTE', formatCurrency(totalPendente), margin + (boxWidth + 10) * 2, y, boxWidth, COLORS.warning)
  addValueBox(doc, 'ATRASADO', formatCurrency(totalAtrasado), margin + (boxWidth + 10) * 3, y, boxWidth, totalAtrasado > 0 ? COLORS.danger : COLORS.success)
  
  y += 35

  // Tabela
  const tableData = parcelas?.map(p => {
    const cliente = p.cliente as { nome?: string } | null
    return [
      cliente?.nome || '-',
      `${p.numero_parcela}/${p.total_parcelas}`,
      formatDate(p.data_vencimento),
      p.data_pagamento ? formatDate(p.data_pagamento) : '-',
      formatStatus(p.status),
      p.forma_pagamento || '-',
      formatCurrency(p.valor)
    ]
  }) || []

  const tableStyles = getTableStyles()
  autoTable(doc, {
    startY: y,
    head: [['Cliente', 'Parcela', 'Vencimento', 'Pagamento', 'Status', 'Forma', 'Valor']],
    body: tableData,
    ...tableStyles,
    headStyles: {
      ...tableStyles.headStyles,
      fillColor: [234, 179, 8] as [number, number, number], // yellow/amber
      textColor: [0, 0, 0] as [number, number, number],
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 22 },
      5: { cellWidth: 25 },
      6: { cellWidth: 25, halign: 'right' }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 4) {
        const statusText = data.cell.text[0]
        if (statusText === 'Atrasado') {
          data.cell.styles.textColor = COLORS.danger
          data.cell.styles.fontStyle = 'bold'
        } else if (statusText === 'Pago') {
          data.cell.styles.textColor = COLORS.success
        }
      }
    },
    foot: [[
      `Total: ${parcelas?.length || 0} parcelas`, '', '', '', '', 'TOTAL:',
      formatCurrency(totalGeral)
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
      'Content-Disposition': `attachment; filename=crediario-${dataInicio || 'todas'}-${dataFim || ''}.pdf`
    }
  })
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
