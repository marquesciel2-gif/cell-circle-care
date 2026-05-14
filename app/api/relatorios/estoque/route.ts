import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

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

  const { data: estoque } = await supabase
    .from('estoque')
    .select('*')
    .eq('empresa_id', usuario.empresa_id)
    .order('nome', { ascending: true })

  // Gerar PDF
  const doc = new jsPDF()
  const empresaNome = (usuario.empresa as { nome: string })?.nome || 'Empresa'
  
  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('INVENTÁRIO DE ESTOQUE', 105, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(empresaNome, 105, 28, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 105, 35, { align: 'center' })

  // Tabela
  const tableData = estoque?.map(e => [
    e.codigo || '-',
    e.nome,
    e.categoria || '-',
    e.quantidade.toString(),
    e.quantidade_minima.toString(),
    formatCurrency(e.preco_custo),
    formatCurrency(e.preco_venda),
    formatCurrency(e.quantidade * e.preco_custo)
  ]) || []

  const valorTotalEstoque = estoque?.reduce((sum, e) => sum + (e.quantidade * e.preco_custo), 0) || 0

  autoTable(doc, {
    startY: 45,
    head: [['Código', 'Produto', 'Categoria', 'Qtd', 'Mín', 'Custo', 'Venda', 'Valor Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [249, 115, 22], textColor: 255 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 50 },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 3) {
        const qtd = parseInt(data.cell.text[0])
        const min = parseInt(tableData[data.row.index][4])
        if (qtd <= min) {
          data.cell.styles.textColor = [239, 68, 68]
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
    foot: [[
      '', '', '', '', '', '', 'VALOR TOTAL:', formatCurrency(valorTotalEstoque)
    ]],
    footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
  })

  const pdfBuffer = doc.output('arraybuffer')
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=estoque-${new Date().toISOString().split('T')[0]}.pdf`
    }
  })
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
