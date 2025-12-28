package models

import "time"

// FinancialCategory representa a tabela categoria_financeira.
type FinancialCategory struct {
	ID           int64      `json:"id"`
	Nome         string     `json:"nome"`
	Tipo         string     `json:"tipo"` // E (Entrada) ou S (Saída)
	Descricao    string     `json:"descricao"`
	Ativo        bool       `json:"ativo"`
	CriadoEm     time.Time  `json:"criadoEm"`
	AtualizadoEm *time.Time `json:"atualizadoEm,omitempty"`
}
