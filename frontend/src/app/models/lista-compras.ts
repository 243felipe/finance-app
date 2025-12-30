export interface ListaCompras {
  id: number;
  nome: string;
  data: string;
}

export interface ItemListaCompras {
  id: number;
  listaComprasId: number;
  descricao: string;
  valor: number;
}
