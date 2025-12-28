package models

import "time"

type FormaPagamento struct {
	ID                  int64      `json:"id"`
	Nome                string     `json:"nome"`
	Descricao           string     `json:"descricao"`
	Tipo                string     `json:"tipo"`
	PermiteParcelamento bool       `json:"permiteParcelamento"`
	Ativa               bool       `json:"ativa"`
	CriadoEm            time.Time  `json:"criadoEm"`
	AtualizadoEm        *time.Time `json:"atualizadoEm,omitempty"`
}
