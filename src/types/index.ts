export interface InventoryItem {
  id: number;
  nome: string;
  marca: string;
  modelo: string;
  preco: number;
  quantidade: number;
  status: "disponivel" | "reservado" | "vendido";
  condicao: "novo" | "usado" | "seminovo";
  tipo: "novos" | "usados" | "acessorios";
}

export interface Repair {
  id: number;
  aparelho: string;
  cliente: string;
  telefone: string;
  problema: string;
  dataEntrada: string;
  previsao: string;
  valor?: number;
  status: "pendente" | "em_andamento" | "pronto" | "entregue";
}

export interface Account {
  id: number;
  cliente: string;
  telefone: string;
  descricao: string;
  valor: number;
  valorPago: number;
  dataVencimento: string;
  formaPagamento: "promissoria" | "avista" | "cartao";
  numeroParcelas?: number;
  status: "pendente" | "atrasado" | "pago" | "parcial";
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  storeName: string;
  storePhone: string;
  storeAddress: string;
}

export interface Sale {
  id: number;
  itemId: number;
  itemNome: string;
  tipo: "novos" | "usados" | "acessorios";
  preco: number;
  dataVenda: string;
  cliente?: string;
}

export interface Parcela {
  numero: number;
  valor: number;
  dataVencimento: string;
  paga: boolean;
}
