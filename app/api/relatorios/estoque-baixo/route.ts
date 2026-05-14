import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createPDFDocument, addValueBox, getTableStyles, COLORS } from '@/lib/pdf'
import autoTable from 'jspdf-autotable'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

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

  const { data: estoque } = await supabase
    .from('estoque')
    .select('*')
    .eq('empresa_id', usuario.empresa_id)
    .order('quantidade', { ascending: true })

  // Filtrar itens com estoque baixo
  const estoqueBaixo = estoque?.filter(e => e.quantidade <= e.quantidade_minima) || []
  const totalEstoque = estoque?.length || 0
  const itensZerados = estoqueBaixo.filter(e => e.quantidade === 0).length
  const itensCriticos = estoqueBaixo.filter(e => e.quantidade > 0 && e.quantidade <= e.quantidade_minima * 0.5).length

  // Gerar PDF
  const doc = createPDFDocument({
    titulo: 'ALERTA: ESTOQUE BAIXO',
    subtitulo: `${estoqueBaixo.length} itens abaixo do estoque minimo`,
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
  addValueBox(doc, 'TOTAL ESTOQUE', `${totalEstoque}`, margin, y, boxWidth, COLORS.primary)
  addValueBox(doc, 'ESTOQUE BAIXO', `${estoqueBaixo.length}`, margin + boxWidth + 10, y, boxWidth, COLORS.warning)
  addValueBox(doc, 'ZERADOS', `${itensZerados}`, margin + (boxWidth + 10) * 2, y, boxWidth, COLORS.danger)
  addValueBox(doc, 'CRITICOS', `${itensCriticos}`, margin + (boxWidth + 10) * 3, y, boxWidth, COLORS.danger)
  
  y += 35

  // Tabela
  const tableData = estoqueBaixo.map(e => [
    e.codigo || '-',
    e.nome.length > 35 ? e.nome.substring(0, 35) + '...' : e.nome,
    e.categoria || '-',
    e.quantidade.toString(),
    e.quantidade_minima.toString(),
    (e.quantidade_minima - e.quantidade).toString(),
    e.fornecedor || '-'
  ])

  const tableStyles = getTableStyles()
  autoTable(doc, {
    startY: y,
    head: [['Codigo', 'Produto', 'Categoria', 'Atual', 'Min', 'Repor', 'Fornecedor']],
    body: tableData,
    ...tableStyles,
    headStyles: {
      ...tableStyles.headStyles,
      fillColor: COLORS.danger,
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 50 },
      2: { cellWidth: 25 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 40 }
    },
    didParseCell: function(data) {
      if (data.section === 'body') {
        // Quantidade atual
        if (data.column.index === 3) {
          const qtd = parseInt(data.cell.text[0])
          if (qtd === 0) {
            data.cell.styles.textColor = COLORS.danger
            data.cell.styles.fontStyle = 'bold'
          }
        }
        // Quantidade a repor
        if (data.column.index === 5) {
          data.cell.styles.textColor = COLORS.danger
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
    foot: [[
      `Total: ${estoqueBaixo.length} itens`, '', '', '', '', '', ''
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
      'Content-Disposition': `attachment; filename=estoque-baixo-${new Date().toISOString().split('T')[0]}.pdf`
    }
  })
}
