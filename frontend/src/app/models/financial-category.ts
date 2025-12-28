export interface FinancialCategory {
  id: number;
  nome: string;
  tipo: 'E' | 'S';
  descricao: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm?: string | null;
}

