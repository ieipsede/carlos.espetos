export interface Estabelecimento {
  id: number;
  codigo: number;
  nome: string;
  descricao: string;
  icone: string;
}

export type StatusCompra = 'PENDENTE' | 'PAGO';

export type FormaPagamento = 
  | 'BOLETO'
  | 'FATURADO'
  | 'PIX'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'DINHEIRO';

export interface Compra {
  id: number;
  estabelecimento_id: number;
  codigo_unidade?: number;
  unidade?: string;
  icone_unidade?: string;
  data: string;          // ISO YYYY-MM-DD
  vencimento: string;    // ISO YYYY-MM-DD
  descricao: string;
  fornecedor: string;
  categoria: string;
  valor: number;
  forma_pagamento: FormaPagamento;
  status: StatusCompra;
  numero_nf?: string | null;
  observacoes?: string | null;
  data_registro?: string;
}

export type ViewMode = 'painel' | 'cadastro';
