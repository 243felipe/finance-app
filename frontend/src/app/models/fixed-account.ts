export interface FixedAccount {
  id: number;
  nome: string;
  descricao: string;
  idCategoria: number;
  valor: number;
  diaVencimento: number;
  ativa: boolean;
  criadoEm: string;
  atualizadoEm?: string | null;
}

