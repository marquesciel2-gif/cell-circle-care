import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { STATUS_PRODUTO_LABELS, TIPO_MOVIMENTACAO_PRODUTO_LABELS } from '@/lib/types'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id, empresa:empresas(nome)')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa_id) {
    return NextResponse.json({ error: 'Empresa nao encontrada' }, { status: 404 })
  }

  // Buscar produto e movimentacoes
  const [{ data: produto }, { data: movimentacoes }] = await Promise.all([
    supabase
      .from('estoque')
      .select('*')
      .eq('id', id)
      .eq('empresa_id', usuario.empresa_id)
      .single(),
    supabase
      .from('movimentacoes_produto')
      .select('*, usuario:usuarios(nome), cliente:clientes(nome)')
      .eq('produto_id', id)
      .order('created_at', { ascending: false })
  ])

  if (!produto) {
    return NextResponse.json({ error: 'Produto nao encontrado' }, { status: 404 })
  }

  // Gerar PDF
  const doc = new jsPDF()
  const empresaNome = (usuario.empresa as { nome: string })?.nome || 'Minha Empresa'

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(empresaNome, 14, 20)

  doc.setFontSize(14)
  doc.text('Ficha do Produto', 14, 30)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, 14, 38)

  // Dados do produto
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Informacoes do Produto', 14, 50)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  const infoY = 58
  doc.text(`Nome: ${produto.nome}`, 14, infoY)
  doc.text(`Codigo: ${produto.codigo || '-'}`, 14, infoY + 6)
  doc.text(`Categoria: ${produto.categoria || '-'}`, 14, infoY + 12)
  doc.text(`Marca: ${produto.marca || '-'}`, 14, infoY + 18)
  doc.text(`Modelo: ${produto.modelo || '-'}`, 14, infoY + 24)
  
  doc.text(`Status: ${STATUS_PRODUTO_LABELS[produto.status_produto as keyof typeof STATUS_PRODUTO_LABELS] || 'Em Estoque'}`, 105, infoY)
  doc.text(`Quantidade: ${produto.quantidade}`, 105, infoY + 6)
  doc.text(`Preco Custo: R$ ${produto.preco_custo?.toFixed(2) || '0.00'}`, 105, infoY + 12)
  doc.text(`Preco Venda: R$ ${produto.preco_venda?.toFixed(2) || '0.00'}`, 105, infoY + 18)
  doc.text(`Garantia: ${produto.garantia_meses ? `${produto.garantia_meses} meses` : '-'}`, 105, infoY + 24)

  // Identificadores
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Identificadores', 14, infoY + 38)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Numero de Serie: ${produto.numero_serie || '-'}`, 14, infoY + 46)
  doc.text(`IMEI: ${produto.imei || '-'}`, 14, infoY + 52)
  doc.text(`Codigo de Barras: ${produto.codigo_barras || '-'}`, 105, infoY + 46)
  doc.text(`Fornecedor: ${produto.fornecedor || '-'}`, 105, infoY + 52)

  // Historico de movimentacoes
  if (movimentacoes && movimentacoes.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Historico de Movimentacoes', 14, infoY + 68)

    autoTable(doc, {
      startY: infoY + 74,
      head: [['Data', 'Tipo', 'Qtd', 'Valor', 'Usuario', 'Observacao']],
      body: movimentacoes.map(mov => [
        new Date(mov.created_at).toLocaleString('pt-BR'),
        TIPO_MOVIMENTACAO_PRODUTO_LABELS[mov.tipo as keyof typeof TIPO_MOVIMENTACAO_PRODUTO_LABELS] || mov.tipo,
        mov.quantidade.toString(),
        mov.valor ? `R$ ${mov.valor.toFixed(2)}` : '-',
        (mov.usuario as { nome: string })?.nome || '-',
        mov.observacao || '-'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8 },
    })
  }

  // Rodape
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Pagina ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  const pdfBuffer = doc.output('arraybuffer')

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="produto-${produto.codigo || produto.id}.pdf"`,
    },
  })
}
