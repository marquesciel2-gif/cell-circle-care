// Database Types for Smart Cell

export type PlanoTipo = 'basico' | 'profissional' | 'premium'
export type StatusEmpresa = 'ativo' | 'vencido' | 'bloqueado'
export type StatusConserto = 'recebido' | 'diagnostico' | 'aguardando_aprovacao' | 'em_reparo' | 'pronto' | 'entregue' | 'cancelado'
export type TipoMovimentacao = 'entrada' | 'saida' | 'ajuste'
export type StatusFinanceiro = 'pendente' | 'pago' | 'atrasado' | 'cancelado'
export type CargoColaborador = 'tecnico' | 'atendente' | 'gerente' | 'financeiro' | 'admin'
export type StatusProduto = 'em_estoque' | 'reservado' | 'vendido' | 'entregue' | 'em_manutencao' | 'devolvido' | 'cancelado' | 'em_uso'
export type TipoMovimentacaoProduto = 'entrada' | 'venda' | 'devolucao' | 'garantia' | 'ajuste' | 'perda' | 'manutencao' | 'troca' | 'reserva' | 'cancelamento' | 'uso_conserto'
export type TipoAcaoLog = 'criacao' | 'edicao' | 'exclusao' | 'venda' | 'cancelamento' | 'alteracao_valor' | 'alteracao_estoque' | 'login' | 'logout' | 'visualizacao'

export interface Empresa {
  id: string
  nome: string
  cnpj: string | null
  email: string
  telefone: string | null
  endereco: string | null
  plano: PlanoTipo
  status: StatusEmpresa
  data_vencimento: string | null
  created_at: string
  updated_at: string
}

export interface Usuario {
  id: string
  empresa_id: string | null
  nome: string
  email: string
  cpf_cnpj: string | null
  cargo: string | null
  cargo_tipo: CargoColaborador | null
  is_admin: boolean
  is_master: boolean
  ativo: boolean
  telefone: string | null
  comissao_percentual: number | null
  data_admissao: string | null
  created_at: string
  updated_at: string
  empresa?: Empresa
}

export interface Cliente {
  id: string
  empresa_id: string
  nome: string
  cpf: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface Conserto {
  id: string
  empresa_id: string
  cliente_id: string | null
  numero: string
  dispositivo: string
  marca: string | null
  modelo: string | null
  imei: string | null
  cor: string | null
  acessorios: string | null
  senha_dispositivo: string | null
  problema: string
  diagnostico: string | null
  solucao: string | null
  valor: number
  valor_pecas: number
  valor_mao_obra: number
  status: StatusConserto
  prioridade: string
  tecnico_responsavel: string | null
  data_entrada: string
  data_previsao: string | null
  data_conclusao: string | null
  data_entrega: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
  cliente?: Cliente
}

export interface ItemEstoque {
  id: string
  empresa_id: string
  nome: string
  codigo: string | null
  categoria: string | null
  descricao: string | null
  quantidade: number
  quantidade_minima: number
  preco_custo: number
  preco_venda: number
  fornecedor: string | null
  localizacao: string | null
  numero_serie: string | null
  imei: string | null
  codigo_barras: string | null
  qr_code: string | null
  status_produto: StatusProduto
  data_entrada: string | null
  garantia_meses: number
  marca: string | null
  modelo: string | null
  created_at: string
  updated_at: string
}

export interface MovimentacaoEstoque {
  id: string
  empresa_id: string
  produto_id: string | null
  tipo: TipoMovimentacao
  quantidade: number
  motivo: string | null
  conserto_id: string | null
  usuario_id: string | null
  created_at: string
  produto?: ItemEstoque
}

export interface Receita {
  id: string
  empresa_id: string
  conserto_id: string | null
  cliente_id: string | null
  descricao: string
  valor: number
  categoria: string
  data_vencimento: string | null
  data_pagamento: string | null
  status: StatusFinanceiro
  forma_pagamento: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
  cliente?: Cliente
  conserto?: Conserto
}

export interface Despesa {
  id: string
  empresa_id: string
  descricao: string
  categoria: string | null
  valor: number
  data_vencimento: string | null
  data_pagamento: string | null
  status: StatusFinanceiro
  fornecedor: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface Parcela {
  id: string
  empresa_id: string
  receita_id: string | null
  cliente_id: string | null
  conserto_id: string | null
  numero_parcela: number
  total_parcelas: number
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  status: StatusFinanceiro
  forma_pagamento: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
  cliente?: Cliente
}

export interface LogAuditoria {
  id: string
  empresa_id: string
  usuario_id: string | null
  acao: TipoAcaoLog
  tabela: string
  registro_id: string | null
  descricao: string
  dados_anteriores: Record<string, unknown> | null
  dados_novos: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  usuario?: Usuario
}

export interface MovimentacaoProduto {
  id: string
  empresa_id: string
  produto_id: string
  usuario_id: string | null
  tipo: TipoMovimentacaoProduto
  quantidade: number
  valor: number | null
  cliente_id: string | null
  conserto_id: string | null
  observacao: string | null
  created_at: string
  produto?: ItemEstoque
  usuario?: Usuario
  cliente?: Cliente
  conserto?: Conserto
}

// Helper types
export const STATUS_CONSERTO_LABELS: Record<StatusConserto, string> = {
  recebido: 'Recebido',
  diagnostico: 'Em Diagnóstico',
  aguardando_aprovacao: 'Aguardando Aprovação',
  em_reparo: 'Em Reparo',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

export const STATUS_CONSERTO_COLORS: Record<StatusConserto, string> = {
  recebido: 'bg-blue-500/20 text-blue-400',
  diagnostico: 'bg-yellow-500/20 text-yellow-400',
  aguardando_aprovacao: 'bg-orange-500/20 text-orange-400',
  em_reparo: 'bg-purple-500/20 text-purple-400',
  pronto: 'bg-green-500/20 text-green-400',
  entregue: 'bg-emerald-500/20 text-emerald-400',
  cancelado: 'bg-red-500/20 text-red-400',
}

export const STATUS_FINANCEIRO_LABELS: Record<StatusFinanceiro, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
}

export const STATUS_FINANCEIRO_COLORS: Record<StatusFinanceiro, string> = {
  pendente: 'bg-yellow-500/20 text-yellow-400',
  pago: 'bg-green-500/20 text-green-400',
  atrasado: 'bg-red-500/20 text-red-400',
  cancelado: 'bg-zinc-500/20 text-zinc-400',
}

export const PLANO_LABELS: Record<PlanoTipo, string> = {
  basico: 'Básico',
  profissional: 'Profissional',
  premium: 'Premium',
}

export const STATUS_EMPRESA_LABELS: Record<StatusEmpresa, string> = {
  ativo: 'Ativo',
  vencido: 'Vencido',
  bloqueado: 'Bloqueado',
}

export const STATUS_EMPRESA_COLORS: Record<StatusEmpresa, string> = {
  ativo: 'bg-green-500/20 text-green-400',
  vencido: 'bg-yellow-500/20 text-yellow-400',
  bloqueado: 'bg-red-500/20 text-red-400',
}

export const CARGO_COLABORADOR_LABELS: Record<CargoColaborador, string> = {
  tecnico: 'Técnico',
  atendente: 'Atendente',
  gerente: 'Gerente',
  financeiro: 'Financeiro',
  admin: 'Administrador',
}

export const CARGO_COLABORADOR_COLORS: Record<CargoColaborador, string> = {
  tecnico: 'bg-blue-500/20 text-blue-400',
  atendente: 'bg-purple-500/20 text-purple-400',
  gerente: 'bg-amber-500/20 text-amber-400',
  financeiro: 'bg-emerald-500/20 text-emerald-400',
  admin: 'bg-red-500/20 text-red-400',
}

export const STATUS_PRODUTO_LABELS: Record<StatusProduto, string> = {
  em_estoque: 'Em Estoque',
  reservado: 'Reservado',
  vendido: 'Vendido',
  entregue: 'Entregue',
  em_manutencao: 'Em Manutencao',
  devolvido: 'Devolvido',
  cancelado: 'Cancelado',
  em_uso: 'Em Uso',
}

export const STATUS_PRODUTO_COLORS: Record<StatusProduto, string> = {
  em_estoque: 'bg-green-500/20 text-green-400',
  reservado: 'bg-yellow-500/20 text-yellow-400',
  vendido: 'bg-blue-500/20 text-blue-400',
  entregue: 'bg-emerald-500/20 text-emerald-400',
  em_manutencao: 'bg-orange-500/20 text-orange-400',
  devolvido: 'bg-purple-500/20 text-purple-400',
  cancelado: 'bg-red-500/20 text-red-400',
  em_uso: 'bg-cyan-500/20 text-cyan-400',
}

export const TIPO_MOVIMENTACAO_PRODUTO_LABELS: Record<TipoMovimentacaoProduto, string> = {
  entrada: 'Entrada',
  venda: 'Venda',
  devolucao: 'Devolucao',
  garantia: 'Garantia',
  ajuste: 'Ajuste',
  perda: 'Perda',
  manutencao: 'Manutencao',
  troca: 'Troca',
  reserva: 'Reserva',
  cancelamento: 'Cancelamento',
  uso_conserto: 'Uso em Conserto',
}

export const TIPO_MOVIMENTACAO_PRODUTO_COLORS: Record<TipoMovimentacaoProduto, string> = {
  entrada: 'bg-green-500/20 text-green-400',
  venda: 'bg-blue-500/20 text-blue-400',
  devolucao: 'bg-yellow-500/20 text-yellow-400',
  garantia: 'bg-orange-500/20 text-orange-400',
  ajuste: 'bg-zinc-500/20 text-zinc-400',
  perda: 'bg-red-500/20 text-red-400',
  manutencao: 'bg-purple-500/20 text-purple-400',
  troca: 'bg-cyan-500/20 text-cyan-400',
  reserva: 'bg-amber-500/20 text-amber-400',
  cancelamento: 'bg-red-500/20 text-red-400',
  uso_conserto: 'bg-indigo-500/20 text-indigo-400',
}

export const TIPO_ACAO_LOG_LABELS: Record<TipoAcaoLog, string> = {
  criacao: 'Criacao',
  edicao: 'Edicao',
  exclusao: 'Exclusao',
  venda: 'Venda',
  cancelamento: 'Cancelamento',
  alteracao_valor: 'Alteracao de Valor',
  alteracao_estoque: 'Alteracao de Estoque',
  login: 'Login',
  logout: 'Logout',
  visualizacao: 'Visualizacao',
}
