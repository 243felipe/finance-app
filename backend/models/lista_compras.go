package models

import "time"

// ListaCompras representa a tabela lista_compras.
type ListaCompras struct {
	ID   int64     `json:"id"`
	Nome string    `json:"nome"`
	Data time.Time `json:"data"`
}

// ItemListaCompras representa a tabela item_lista_compras.
type ItemListaCompras struct {
	ID            int64   `json:"id"`
	ListaComprasID int64   `json:"listaComprasId"`
	Descricao     string  `json:"descricao"`
	Valor         float64 `json:"valor"`
}
