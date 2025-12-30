package models

import "time"

type LancamentoRecorrente struct {
	IDRecorrente     int64      `json:"idRecorrente,omitempty"`
	Tipo             string     `json:"tipo"` // E (Entrada) ou S (Saída)
	Descricao        string     `json:"descricao"`
	Valor            float64    `json:"valor"`
	IDCategoria      int64      `json:"idCategoria"`
	IDFonteRenda     *int64     `json:"idFonteRenda,omitempty"`
	IDFormaPagamento *int64     `json:"idFormaPagamento,omitempty"`
	Periodicidade    string     `json:"periodicidade"` // MENSAL, ANUAL
	DiaExecucao      int        `json:"diaExecucao"`   // 1-31
	DataInicio       time.Time  `json:"dataInicio"`
	DataFim          *time.Time `json:"dataFim,omitempty"`
	Ativo            bool       `json:"ativo"` // true/false
	Observacao       string     `json:"observacao,omitempty"`
	CriadoEm         time.Time  `json:"criadoEm,omitempty"`
	AtualizadoEm     *time.Time `json:"atualizadoEm,omitempty"`
}

