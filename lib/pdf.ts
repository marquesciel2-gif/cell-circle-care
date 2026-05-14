import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Utilitarios para geracao de PDFs profissionais
// Cores do tema Smart Cell
const COLORS = {
  primary: [16, 185, 129] as [number, number, number], // emerald-500
  primaryDark: [5, 150, 105] as [number, number, number], // emerald-600
  secondary: [39, 39, 42] as [number, number, number], // zinc-800
  text: [24, 24, 27] as [number, number, number], // zinc-900
  textLight: [113, 113, 122] as [number, number, number], // zinc-500
  border: [228, 228, 231] as [number, number, number], // zinc-200
  background: [250, 250, 250] as [number, number, number], // zinc-50
  white: [255, 255, 255] as [number, number, number],
  success: [34, 197, 94] as [number, number, number], // green-500
  warning: [234, 179, 8] as [number, number, number], // yellow-500
  danger: [239, 68, 68] as [number, number, number], // red-500
}

interface EmpresaInfo {
  nome: string
  cnpj?: string | null
  telefone?: string | null
  email?: string | null
  endereco?: string | null
}

interface UsuarioInfo {
  nome: string
  email?: string
}

interface PDFConfig {
  titulo: string
  subtitulo?: string
  empresa: EmpresaInfo
  usuario: UsuarioInfo
  orientation?: 'portrait' | 'landscape'
}

// Funcao para criar documento PDF com header profissional
const createPDFDocument = (config: PDFConfig): jsPDF => {
  const doc = new jsPDF({
    orientation: config.orientation || 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15

  // Header com fundo colorido
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 35, 'F')

  // Logo/Nome da empresa
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text(config.empresa.nome.toUpperCase(), margin, 15)

  // Subtitulo "Smart Cell" ou slogan
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistema de Gestao para Assistencias Tecnicas', margin, 22)

  // Informacoes da empresa no header (direita)
  doc.setFontSize(8)
  let headerY = 12
  if (config.empresa.telefone) {
    doc.text(`Tel: ${config.empresa.telefone}`, pageWidth - margin, headerY, { align: 'right' })
    headerY += 4
  }
  if (config.empresa.email) {
    doc.text(config.empresa.email, pageWidth - margin, headerY, { align: 'right' })
    headerY += 4
  }
  if (config.empresa.cnpj) {
    doc.text(`CNPJ: ${config.empresa.cnpj}`, pageWidth - margin, headerY, { align: 'right' })
  }

  // Linha decorativa abaixo do header
  doc.setFillColor(...COLORS.primaryDark)
  doc.rect(0, 35, pageWidth, 2, 'F')

  // Titulo do documento
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(config.titulo, margin, 48)

  // Subtitulo se houver
  if (config.subtitulo) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.textLight)
    doc.text(config.subtitulo, margin, 54)
  }

  // Data e hora de geracao
  const dataGeracao = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.textLight)
  doc.text(`Gerado em: ${dataGeracao}`, pageWidth - margin, 48, { align: 'right' })
  doc.text(`Por: ${config.usuario.nome}`, pageWidth - margin, 53, { align: 'right' })

  // Footer
  addFooter(doc, config.empresa.nome)

  return doc
}

// Funcao para adicionar footer
const addFooter = (doc: jsPDF, empresaNome: string): void => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15

  // Linha separadora
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.5)
  doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20)

  // Texto do rodape
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textLight)
  doc.text(
    `${empresaNome} - Documento gerado pelo Smart Cell`,
    pageWidth / 2,
    pageHeight - 14,
    { align: 'center' }
  )
  doc.text(
    'www.smartcell.com.br',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  // Numero da pagina
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.textLight)
    doc.text(
      `Pagina ${i} de ${pageCount}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    )
  }
}

// Funcao para adicionar titulo de secao
const addSectionTitle = (doc: jsPDF, title: string, y: number): number => {
  const margin = 15

  doc.setFillColor(...COLORS.background)
  doc.rect(margin, y - 4, doc.internal.pageSize.getWidth() - margin * 2, 8, 'F')
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text(title, margin + 2, y + 1)

  return y + 10
}

// Funcao para adicionar linha de informacao
const addInfoRow = (
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
  options?: { bold?: boolean; color?: [number, number, number] }
): number => {
  const margin = 15

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textLight)
  doc.text(`${label}:`, margin, y)

  doc.setFont('helvetica', options?.bold ? 'bold' : 'normal')
  doc.setTextColor(...(options?.color || COLORS.text))
  doc.text(value, margin + 45, y)

  return y + 6
}

// Funcao para adicionar caixa de valor
const addValueBox = (
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  color: [number, number, number] = COLORS.primary
): number => {
  // Caixa de fundo
  doc.setFillColor(...color)
  doc.roundedRect(x, y, width, 25, 3, 3, 'F')

  // Label
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.text(label, x + width / 2, y + 8, { align: 'center' })

  // Valor
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(value, x + width / 2, y + 18, { align: 'center' })

  return y + 30
}

// Funcao para formatar moeda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Funcao para formatar data
const formatDate = (date: string | Date | null): string => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR')
}

// Funcao para obter estilos da tabela
const getTableStyles = () => {
  return {
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold' as const,
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: {
      textColor: COLORS.text,
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: COLORS.background,
    },
    styles: {
      lineColor: COLORS.border,
      lineWidth: 0.1,
    },
    margin: { left: 15, right: 15 },
  }
}

export {
  COLORS,
  createPDFDocument,
  addFooter,
  addSectionTitle,
  addInfoRow,
  addValueBox,
  formatCurrency,
  formatDate,
  getTableStyles,
}
