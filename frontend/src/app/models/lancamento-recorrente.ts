export interface LancamentoRecorrente {
  idRecorrente?: number;
  tipo: 'E' | 'S';
  descricao: string;
  valor: number;
  idCategoria: number;
  idFonteRenda?: number | null;
  idFormaPagamento?: number | null;
  periodicidade: 'MENSAL' | 'ANUAL';
  diaExecucao: number; // 1-31
  dataInicio: string;
  dataFim?: string | null;
  ativo: boolean;
  observacao?: string;
  criadoEm?: string;
  atualizadoEm?: string | null;
}
