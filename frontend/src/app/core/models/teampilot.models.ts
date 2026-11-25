export type StatusOrcamento = 'EM_NEGOCIACAO' | 'FECHADO' | 'PERDIDO';
export type MotivoPerda = 'PRECO' | 'PRAZO' | 'CONCORRENCIA' | 'FALTA_DE_ESTOQUE' | 'OUTRO';

export interface LoginRequest {
  login: string;
  senha: string;
}

export interface RegisterRequest {
  login: string;
  senha: string;
  role: 'ROLE_SUPERVISOR' | 'ROLE_RCA';
  codigoRca?: string;
  nomeRca?: string;
  telefoneRca?: string;
  metaMensal?: number;
}

export interface LoginResponse {
  token: string;
}

export interface OrcamentoResponse {
  id: number;
  numeroPedido: string | null;
  valorTotal: number;
  margemLucro: number | null;
  status: StatusOrcamento;
  motivoPerda: MotivoPerda | null;
  concorrente: string | null;
  observacao: string | null;
  dataOrcamento: string;
  vendaCasada: boolean;
  rcaCodigo: string;
  rcaNome: string;
  rcaMetaMensal: number | null;
  clienteRazaoSocial: string;
}

export interface ImportResponse {
  mensagem: string;
  novos: number;
  atualizados: number;
  preservados: number;
  ignorados: number;
}
