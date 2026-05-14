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
    .from('receitas')
    .select('*, cliente:clientes(nome)')
    .eq('empresa_id', usuario.empresa_id)

  if (dataInicio) {
    query = query.gte('created_at', `${dataInicio}T00:00:00`)
  }
  if (dataFim) {
    query = query.lte('created_at', `${dataFim}T23:59:59`)
  }
  if (status !== 'todos') {
    query = query.eq('status', status)
  }

  const { data: receitas } = await query.order('created_at', { ascending: false })

  // Calcular totais
  const totalReceitas = receitas?.reduce((sum, r) => sum + Number(r.valor), 0) || 0
  const totalPagas = receitas?.filter(r => r.status === 'pago').reduce((sum, r) => sum + Number(r.valor), 0) || 0
  const totalPendentes = receitas?.filter(r => r.status === 'pendente').reduce((sum, r) => sum + Number(r.valor), 0) || 0

  // Gerar PDF
  const doc = createPDFDocument({
    titulo: 'RELATORIO DE RECEITAS',
    subtitulo: dataInicio && dataFim ? `Periodo: ${formatDate(dataInicio)} a ${formatDate(dataFim)}` : 'Todas as receitas',
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

  // Resumo em caixas coloridas
  const boxWidth = (pageWidth - margin * 2 - 20) / 3
  addValueBox(doc, 'TOTAL', formatCurrency(totalReceitas), margin, y, boxWidth, COLORS.primary)
  addValueBox(doc, 'PAGAS', formatCurrency(totalPagas), margin + boxWidth + 10, y, boxWidth, COLORS.success)
  addValueBox(doc, 'PENDENTES', formatCurrency(totalPendentes), margin + (boxWidth + 10) * 2, y, boxWidth, COLORS.warning)
  
  y += 35

  // Tabela
  const tableData = receitas?.map(r => {
    const cliente = r.cliente as { nome?: string } | null
    return [
      formatDate(r.created_at),
      r.descricao.length > 35 ? r.descricao.substring(0, 35) + '...' : r.descricao,
      cliente?.nome || '-',
      formatStatus(r.status),
      r.forma_pagamento || '-',
      formatCurrency(r.valor)
    ]
  }) || []

  autoTable(doc, {
    startY: y,
    head: [['Data', 'Descricao', 'Cliente', 'Status', 'Pagamento', 'Valor']],
    body: tableData,
    ...getTableStyles(),
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 50 },
      2: { cellWidth: 35 },
      3: { cellWidth: 22 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25, halign: 'right' }
    },
    foot: [[
      '', '', '', '', 'TOTAL:',
      formatCurrency(totalReceitas)
    ]],
    footStyles: { 
      fillColor: COLORS.secondary, 
      textColor: COLORS.white, 
      fontStyle: 'bold',
      fontSize: 10
    },
    didDrawPage: () => {
      // Rodape em cada pagina
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
      'Content-Disposition': `attachment; filename=receitas-${dataInicio || 'todas'}-${dataFim || 'datas'}.pdf`
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
