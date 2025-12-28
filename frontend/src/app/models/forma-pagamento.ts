export interface FormaPagamento {
  id: number;
  nome: string;
  descricao: string;
  tipo: 'D' | 'C' | 'P' | 'T';
  permiteParcelamento: boolean;
  ativa: boolean;
  criadoEm: string;
  atualizadoEm?: string | null;
}

