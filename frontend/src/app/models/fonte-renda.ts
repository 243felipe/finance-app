export interface FonteRenda {
  id: number;
  nome: string;
  descricao: string;
  valorPadrao: number;
  recorrente: boolean;
  ativa: boolean;
  criadoEm: string;
  atualizadoEm?: string | null;
}

