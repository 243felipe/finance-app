package models

import "time"

type Product struct {
	ID           int64     `json:"id"`
	Nome         string    `json:"nome"`
	Descricao    string    `json:"descricao"`
	IDCategoria  *int64    `json:"idCategoria,omitempty"`
	Unidade      string    `json:"unidade"`
	Ativo        bool      `json:"ativo"`
	DataCadastro time.Time `json:"dataCadastro"`
	DataAtualiza time.Time `json:"dataAtualiza"`
	Categoria    *string   `json:"categoria,omitempty"`
}












