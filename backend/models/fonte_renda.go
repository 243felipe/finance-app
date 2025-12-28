package models

import "time"

type FonteRenda struct {
	ID           int64      `json:"id"`
	Nome         string     `json:"nome"`
	Descricao    string     `json:"descricao"`
	ValorPadrao  float64    `json:"valorPadrao"`
	Recorrente   bool       `json:"recorrente"`
	Ativa        bool       `json:"ativa"`
	CriadoEm     time.Time  `json:"criadoEm"`
	AtualizadoEm *time.Time `json:"atualizadoEm,omitempty"`
}
