import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import jsPDF from 'jspdf'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id, empresa:empresas(nome, cnpj, telefone, endereco)')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa_id) {
    return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
  }

  // Buscar a parcela
  const { data: parcela, error } = await supabase
    .from('parcelas')
    .select('*, cliente:clientes(nome, cpf, telefone)')
    .eq('id', id)
    .eq('empresa_id', usuario.empresa_id)
    .single()

  if (error || !parcela) {
    return NextResponse.json({ error: 'Parcela não encontrada' }, { status: 404 })
  }

  // Gerar PDF
  const doc = new jsPDF()
  const empresa = usuario.empresa as { nome: string; cnpj: string | null; telefone: string | null; endereco: string | null }
  
  // Cabeçalho
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(empresa.nome || 'Smart Cell', 105, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  if (empresa.cnpj) {
    doc.text(`CNPJ: ${empresa.cnpj}`, 105, 28, { align: 'center' })
  }
  if (empresa.telefone) {
    doc.text(`Tel: ${empresa.telefone}`, 105, 34, { align: 'center' })
  }

  doc.setLineWidth(0.5)
  doc.line(20, 45, 190, 45)

  // Título
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('RECIBO DE PAGAMENTO - PARCELA', 105, 58, { align: 'center' })

  // Info
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Recibo Nº: ${id.slice(0, 8).toUpperCase()}`, 20, 70)
  doc.text(`Data: ${parcela.data_pagamento ? new Date(parcela.data_pagamento).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}`, 150, 70)

  // Cliente
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE:', 20, 85)
  doc.setFont('helvetica', 'normal')
  doc.text(parcela.cliente?.nome || 'Não informado', 50, 85)
  
  if (parcela.cliente?.cpf) {
    doc.text(`CPF: ${parcela.cliente.cpf}`, 20, 92)
  }

  // Parcela
  doc.setFont('helvetica', 'bold')
  doc.text('PARCELA:', 20, 107)
  doc.setFont('helvetica', 'normal')
  doc.text(`${parcela.numero_parcela} de ${parcela.total_parcelas}`, 55, 107)

  doc.text(`Vencimento: ${new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}`, 20, 117)

  // Valor
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('VALOR RECEBIDO:', 20, 135)
  
  const valorFormatado = new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(parcela.valor)
  
  doc.setFontSize(18)
  doc.text(valorFormatado, 20, 148)

  // Forma de pagamento
  if (parcela.forma_pagamento) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Forma de Pagamento: ${parcela.forma_pagamento}`, 20, 160)
  }

  // Assinatura
  doc.line(20, 195, 190, 195)
  doc.setFontSize(10)
  doc.text('_______________________________________', 105, 220, { align: 'center' })
  doc.text('Assinatura do Responsável', 105, 227, { align: 'center' })

  // Rodapé
  doc.setFontSize(8)
  doc.text('Este documento é válido como comprovante de pagamento de parcela.', 105, 280, { align: 'center' })
  doc.text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, 105, 285, { align: 'center' })

  const pdfBuffer = doc.output('arraybuffer')
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recibo-parcela-${parcela.numero_parcela}-${id.slice(0, 8)}.pdf"`,
    },
  })
}
