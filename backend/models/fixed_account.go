package models

import "time"

// FixedAccount representa a tabela conta_fixa.
type FixedAccount struct {
	ID            int64      `json:"id"`
	Nome          string     `json:"nome"`
	Descricao     string     `json:"descricao"`
	IDCategoria   int64      `json:"idCategoria"`
	Valor         float64    `json:"valor"`
	DiaVencimento int        `json:"diaVencimento"`
	Ativa         bool       `json:"ativa"`
	CriadoEm      time.Time  `json:"criadoEm"`
	AtualizadoEm  *time.Time `json:"atualizadoEm,omitempty"`
}
