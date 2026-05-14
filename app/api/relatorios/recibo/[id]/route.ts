import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPDFDocument, addInfoRow, addValueBox, formatCurrency, formatDate, COLORS } from '@/lib/pdf'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  // Buscar usuario e empresa
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*, empresa:empresas(*)')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa) {
    return NextResponse.json({ error: 'Empresa nao encontrada' }, { status: 404 })
  }

  // Buscar receita com cliente
  const { data: receita } = await supabase
    .from('receitas')
    .select('*, cliente:clientes(*)')
    .eq('id', id)
    .single()

  if (!receita) {
    return NextResponse.json({ error: 'Receita nao encontrada' }, { status: 404 })
  }

  const empresa = usuario.empresa as { nome: string; cnpj?: string; telefone?: string; email?: string }

  // Criar PDF
  const doc = createPDFDocument({
    titulo: 'RECIBO DE PAGAMENTO',
    subtitulo: `Recibo N° ${receita.id.slice(0, 8).toUpperCase()}`,
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
  let y = 65

  // Caixa de valor em destaque
  const boxWidth = (pageWidth - margin * 2 - 10) / 2
  addValueBox(doc, 'VALOR TOTAL', formatCurrency(receita.valor), margin, y, boxWidth, COLORS.primary)
  
  const statusColor = receita.status === 'pago' ? COLORS.success : 
                      receita.status === 'pendente' ? COLORS.warning : COLORS.danger
  addValueBox(doc, 'STATUS', receita.status.toUpperCase(), margin + boxWidth + 10, y, boxWidth, statusColor)
  
  y += 35

  // Informacoes do recibo
  doc.setFillColor(...COLORS.background)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 60, 3, 3, 'F')
  y += 8

  y = addInfoRow(doc, 'Descricao', receita.descricao, y)
  y = addInfoRow(doc, 'Categoria', receita.categoria || '-', y)
  y = addInfoRow(doc, 'Forma Pagamento', receita.forma_pagamento || '-', y)
  y = addInfoRow(doc, 'Data Vencimento', formatDate(receita.data_vencimento), y)
  y = addInfoRow(doc, 'Data Pagamento', formatDate(receita.data_pagamento), y)
  
  const clienteData = receita.cliente as { nome?: string; cpf_cnpj?: string; telefone?: string } | null
  if (clienteData) {
    y += 5
    y = addInfoRow(doc, 'Cliente', clienteData.nome || '-', y, { bold: true })
    if (clienteData.cpf_cnpj) {
      y = addInfoRow(doc, 'CPF/CNPJ', clienteData.cpf_cnpj, y)
    }
    if (clienteData.telefone) {
      y = addInfoRow(doc, 'Telefone', clienteData.telefone, y)
    }
  }

  y += 15

  // Observacoes
  if (receita.observacoes) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.text)
    doc.text('Observacoes:', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.textLight)
    const lines = doc.splitTextToSize(receita.observacoes, pageWidth - margin * 2)
    doc.text(lines, margin, y)
    y += lines.length * 5 + 10
  }

  // Assinatura
  y = Math.max(y + 20, 200)
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.5)
  doc.line(margin + 20, y, pageWidth / 2 - 10, y)
  doc.line(pageWidth / 2 + 10, y, pageWidth - margin - 20, y)

  y += 5
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.textLight)
  doc.text('Assinatura do Cliente', (margin + 20 + pageWidth / 2 - 10) / 2, y, { align: 'center' })
  doc.text('Assinatura do Responsavel', (pageWidth / 2 + 10 + pageWidth - margin - 20) / 2, y, { align: 'center' })

  // Gerar PDF
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recibo-${receita.id.slice(0, 8)}.pdf"`,
    },
  })
}
