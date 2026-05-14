import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createPDFDocument, addValueBox, formatCurrency, getTableStyles, COLORS } from '@/lib/pdf-generator'
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
    .order('nome', { ascending: true })

  // Calcular estatisticas
  const totalItens = estoque?.length || 0
  const totalPecas = estoque?.reduce((sum, e) => sum + e.quantidade, 0) || 0
  const valorTotalEstoque = estoque?.reduce((sum, e) => sum + (e.quantidade * e.preco_custo), 0) || 0
  const itensEstoqueBaixo = estoque?.filter(e => e.quantidade <= e.quantidade_minima).length || 0

  // Gerar PDF
  const doc = createPDFDocument({
    titulo: 'INVENTARIO DE ESTOQUE',
    subtitulo: `${totalItens} produtos cadastrados`,
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
  addValueBox(doc, 'PRODUTOS', `${totalItens}`, margin, y, boxWidth, COLORS.primary)
  addValueBox(doc, 'PECAS', `${totalPecas}`, margin + boxWidth + 10, y, boxWidth, COLORS.secondary)
  addValueBox(doc, 'VALOR TOTAL', formatCurrency(valorTotalEstoque), margin + (boxWidth + 10) * 2, y, boxWidth, COLORS.success)
  addValueBox(doc, 'ESTOQUE BAIXO', `${itensEstoqueBaixo}`, margin + (boxWidth + 10) * 3, y, boxWidth, itensEstoqueBaixo > 0 ? COLORS.danger : COLORS.success)
  
  y += 35

  // Tabela
  const tableData = estoque?.map(e => [
    e.codigo || '-',
    e.nome.length > 30 ? e.nome.substring(0, 30) + '...' : e.nome,
    e.categoria || '-',
    e.quantidade.toString(),
    e.quantidade_minima.toString(),
    formatCurrency(e.preco_custo),
    formatCurrency(e.preco_venda),
    formatCurrency(e.quantidade * e.preco_custo)
  ]) || []

  const tableStyles = getTableStyles()
  autoTable(doc, {
    startY: y,
    head: [['Codigo', 'Produto', 'Categoria', 'Qtd', 'Min', 'Custo', 'Venda', 'Valor Total']],
    body: tableData,
    ...tableStyles,
    headStyles: {
      ...tableStyles.headStyles,
      fillColor: [249, 115, 22] as [number, number, number], // orange
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 45 },
      2: { cellWidth: 25 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 25, halign: 'right' }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 3) {
        const qtd = parseInt(data.cell.text[0])
        const min = parseInt(tableData[data.row.index][4])
        if (qtd <= min) {
          data.cell.styles.textColor = COLORS.danger
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
    foot: [[
      '', '', '', '', '', '', 'VALOR TOTAL:', formatCurrency(valorTotalEstoque)
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
      'Content-Disposition': `attachment; filename=estoque-${new Date().toISOString().split('T')[0]}.pdf`
    }
  })
}
