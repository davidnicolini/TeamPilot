export type StatusOrcamento = 'EM_NEGOCIACAO' | 'FECHADO' | 'PERDIDO';

export type MotivoPerda =
  | 'PRECO'
  | 'PRAZO'
  | 'CONCORRENCIA'
  | 'FALTA_DE_ESTOQUE'
  | 'OUTRO';

export interface LoginRequest {
  login: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  tipo: string;
}

export interface OrcamentoRequest {
  numeroPedido?: string;
  valorTotal: number;
  margemLucro?: number;
  dataOrcamento: string;
  vendaCasada: boolean;
  clienteId: number;
  linhaProdutoId?: number;
}

export interface OrcamentoResponse {
  id: number;
  numeroPedido: string;
  valorTotal: number;
  margemLucro: number;
  status: StatusOrcamento;
  motivoPerda?: MotivoPerda;
  concorrente?: string;
  dataOrcamento: string;
  vendaCasada: boolean;
  rcaNome: string;
  clienteRazaoSocial: string;
}

export interface MetaResponse {
  rcaNome: string;
  metaMensal: number;
  valorFaturado: number;
  percentualAtingido: number;
}
