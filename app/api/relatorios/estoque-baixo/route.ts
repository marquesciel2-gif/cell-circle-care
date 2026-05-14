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
    .order('quantidade', { ascending: true })

  // Filtrar itens com estoque baixo
  const estoqueBaixo = estoque?.filter(e => e.quantidade <= e.quantidade_minima) || []

  // Gerar PDF
  const doc = new jsPDF()
  const empresaNome = (usuario.empresa as { nome: string })?.nome || 'Empresa'
  
  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(239, 68, 68)
  doc.text('ALERTA: ESTOQUE BAIXO', 105, 20, { align: 'center' })
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(empresaNome, 105, 28, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 105, 35, { align: 'center' })
  doc.text(`${estoqueBaixo.length} itens abaixo do estoque mínimo`, 105, 41, { align: 'center' })

  // Tabela
  const tableData = estoqueBaixo.map(e => [
    e.codigo || '-',
    e.nome,
    e.categoria || '-',
    e.quantidade.toString(),
    e.quantidade_minima.toString(),
    (e.quantidade_minima - e.quantidade).toString(),
    e.fornecedor || '-'
  ])

  autoTable(doc, {
    startY: 50,
    head: [['Código', 'Produto', 'Categoria', 'Atual', 'Mínimo', 'Faltam', 'Fornecedor']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [239, 68, 68], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 50 },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center', textColor: [239, 68, 68], fontStyle: 'bold' }
    }
  })

  const pdfBuffer = doc.output('arraybuffer')
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=estoque-baixo-${new Date().toISOString().split('T')[0]}.pdf`
    }
  })
}
