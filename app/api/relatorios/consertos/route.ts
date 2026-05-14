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

  let query = supabase
    .from('consertos')
    .select('*, cliente:clientes(nome)')
    .eq('empresa_id', usuario.empresa_id)

  if (dataInicio) {
    query = query.gte('data_entrada', `${dataInicio}T00:00:00`)
  }
  if (dataFim) {
    query = query.lte('data_entrada', `${dataFim}T23:59:59`)
  }

  const { data: consertos } = await query.order('data_entrada', { ascending: false })

  // Calcular estatisticas
  const totalConsertos = consertos?.length || 0
  const totalValor = consertos?.reduce((sum, c) => sum + Number(c.valor), 0) || 0
  const finalizados = consertos?.filter(c => c.status === 'entregue').length || 0
  const emAndamento = consertos?.filter(c => ['recebido', 'diagnostico', 'aguardando_aprovacao', 'em_reparo', 'pronto'].includes(c.status)).length || 0

  // Gerar PDF (paisagem para mais colunas)
  const doc = createPDFDocument({
    titulo: 'RELATORIO DE CONSERTOS',
    subtitulo: dataInicio && dataFim ? `Periodo: ${formatDate(dataInicio)} a ${formatDate(dataFim)}` : 'Todos os consertos',
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
    orientation: 'landscape',
  })

  const margin = 15
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 62

  // Resumo em caixas
  const boxWidth = (pageWidth - margin * 2 - 30) / 4
  addValueBox(doc, 'TOTAL', `${totalConsertos}`, margin, y, boxWidth, COLORS.primary)
  addValueBox(doc, 'EM ANDAMENTO', `${emAndamento}`, margin + boxWidth + 10, y, boxWidth, COLORS.warning)
  addValueBox(doc, 'FINALIZADOS', `${finalizados}`, margin + (boxWidth + 10) * 2, y, boxWidth, COLORS.success)
  addValueBox(doc, 'VALOR TOTAL', formatCurrency(totalValor), margin + (boxWidth + 10) * 3, y, boxWidth, COLORS.secondary)
  
  y += 35

  // Tabela
  const tableData = consertos?.map(c => {
    const cliente = c.cliente as { nome?: string } | null
    return [
      c.numero,
      formatDate(c.data_entrada),
      cliente?.nome || '-',
      `${c.marca || ''} ${c.modelo || ''}`.trim() || c.dispositivo,
      c.problema.length > 30 ? c.problema.substring(0, 30) + '...' : c.problema,
      formatStatus(c.status),
      c.tecnico_responsavel || '-',
      formatCurrency(c.valor)
    ]
  }) || []

  const tableStyles = getTableStyles()
  autoTable(doc, {
    startY: y,
    head: [['OS', 'Entrada', 'Cliente', 'Dispositivo', 'Problema', 'Status', 'Tecnico', 'Valor']],
    body: tableData,
    ...tableStyles,
    headStyles: {
      ...tableStyles.headStyles,
      fillColor: [139, 92, 246] as [number, number, number], // purple
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 22 },
      2: { cellWidth: 35 },
      3: { cellWidth: 40 },
      4: { cellWidth: 50 },
      5: { cellWidth: 28 },
      6: { cellWidth: 30 },
      7: { cellWidth: 25, halign: 'right' }
    },
    foot: [[
      `Total: ${totalConsertos}`, '', '', '', '', '', 'TOTAL:',
      formatCurrency(totalValor)
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
      'Content-Disposition': `attachment; filename=consertos-${dataInicio || 'todos'}-${dataFim || ''}.pdf`
    }
  })
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    recebido: 'Recebido',
    diagnostico: 'Diagnostico',
    aguardando_aprovacao: 'Aguard. Aprov.',
    em_reparo: 'Em Reparo',
    pronto: 'Pronto',
    entregue: 'Entregue',
    cancelado: 'Cancelado'
  }
  return labels[status] || status
}
