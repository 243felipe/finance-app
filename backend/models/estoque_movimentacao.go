package models

import "time"

type EstoqueMovimentacao struct {
	ID               int64      `json:"id"`
	IDProduto        int64      `json:"idProduto"`
	Tipo             string     `json:"tipo"`
	Quantidade       float64    `json:"quantidade"`
	Valor            float64    `json:"valor"`
	Observacao       *string    `json:"observacao,omitempty"`
	DataMovimentacao time.Time  `json:"dataMovimentacao"`
	Produto          *string    `json:"produto,omitempty"`
}

