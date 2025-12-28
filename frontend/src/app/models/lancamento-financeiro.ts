export interface LancamentoFinanceiro {
  id: number;
  dataLancamento: string;
  descricao: string;
  tipo: 'E' | 'S';
  valor: number;
  idCategoria: number;
  idFonteRenda?: number | null;
  idContaFixa?: number | null;
  idFormaPagamento?: number | null;
  observacao: string;
  categoria?: string;
  fonteRenda?: string;
  contaFixa?: string;
  formaPagamento?: string;
  criadoEm: string;
  atualizadoEm?: string | null;
}

