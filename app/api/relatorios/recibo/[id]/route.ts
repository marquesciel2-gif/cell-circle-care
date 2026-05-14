import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import jsPDF from 'jspdf'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Buscar dados do usuário e empresa
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id, empresa:empresas(nome, cnpj, telefone, endereco)')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa_id) {
    return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
  }

  // Buscar a receita
  const { data: receita, error } = await supabase
    .from('receitas')
    .select('*, cliente:clientes(nome, cpf, telefone), conserto:consertos(numero)')
    .eq('id', id)
    .eq('empresa_id', usuario.empresa_id)
    .single()

  if (error || !receita) {
    return NextResponse.json({ error: 'Receita não encontrada' }, { status: 404 })
  }

  // Gerar PDF
  const doc = new jsPDF()
  const empresa = usuario.empresa as { nome: string; cnpj: string | null; telefone: string | null; endereco: string | null }
  
  // Cabeçalho da empresa
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
  if (empresa.endereco) {
    doc.text(empresa.endereco, 105, 40, { align: 'center' })
  }

  // Linha separadora
  doc.setLineWidth(0.5)
  doc.line(20, 48, 190, 48)

  // Título do recibo
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('RECIBO DE PAGAMENTO', 105, 60, { align: 'center' })

  // Número do recibo
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Recibo Nº: ${id.slice(0, 8).toUpperCase()}`, 20, 70)
  doc.text(`Data: ${receita.data_pagamento ? new Date(receita.data_pagamento).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}`, 150, 70)

  // Dados do cliente
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE:', 20, 85)
  doc.setFont('helvetica', 'normal')
  doc.text(receita.cliente?.nome || 'Não informado', 50, 85)
  
  if (receita.cliente?.cpf) {
    doc.text(`CPF: ${receita.cliente.cpf}`, 20, 92)
  }

  // Descrição do serviço
  doc.setFont('helvetica', 'bold')
  doc.text('DESCRIÇÃO:', 20, 107)
  doc.setFont('helvetica', 'normal')
  
  const descricaoLines = doc.splitTextToSize(receita.descricao, 170)
  doc.text(descricaoLines, 20, 115)

  if (receita.conserto?.numero) {
    doc.text(`Ordem de Serviço: ${receita.conserto.numero}`, 20, 115 + (descricaoLines.length * 7))
  }

  // Valor
  const valorY = 140 + (descricaoLines.length * 7)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('VALOR RECEBIDO:', 20, valorY)
  
  const valorFormatado = new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(receita.valor)
  
  doc.setFontSize(18)
  doc.text(valorFormatado, 20, valorY + 10)

  // Forma de pagamento
  if (receita.forma_pagamento) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Forma de Pagamento: ${receita.forma_pagamento}`, 20, valorY + 22)
  }

  // Linha separadora
  doc.setLineWidth(0.3)
  doc.line(20, valorY + 35, 190, valorY + 35)

  // Assinatura
  doc.setFontSize(10)
  doc.text('_______________________________________', 105, valorY + 55, { align: 'center' })
  doc.text('Assinatura do Responsável', 105, valorY + 62, { align: 'center' })

  // Rodapé
  doc.setFontSize(8)
  doc.text('Este documento é válido como comprovante de pagamento.', 105, 280, { align: 'center' })
  doc.text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, 105, 285, { align: 'center' })

  // Retornar PDF
  const pdfBuffer = doc.output('arraybuffer')
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recibo-${id.slice(0, 8)}.pdf"`,
    },
  })
}
