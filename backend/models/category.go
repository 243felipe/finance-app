package models

import "time"

type Categoria struct {
	ID           int64     `json:"id"`
	Nome         string    `json:"nome"`
	Ativo        bool      `json:"ativo"`
	DataCadastro time.Time `json:"dataCadastro"`
}

