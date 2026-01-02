package models

import "time"

type LancamentoFinanceiro struct {
	ID                 int64      `json:"id"`
	DataLancamento     time.Time  `json:"dataLancamento"`
	DataVencimento     *time.Time `json:"dataVencimento,omitempty"`
	DataPagamento      *time.Time `json:"dataPagamento,omitempty"`
	Descricao          string     `json:"descricao"`
	Tipo               string     `json:"tipo"`
	Valor              float64    `json:"valor"`
	IDCategoria        int64      `json:"idCategoria"`
	IDFonteRenda       *int64     `json:"idFonteRenda,omitempty"`
	IDContaFixa        *int64     `json:"idContaFixa,omitempty"`
	IDFormaPagamento   *int64     `json:"idFormaPagamento,omitempty"`
	Observacao         string     `json:"observacao"`
	CriadoEm           time.Time  `json:"criadoEm"`
	AtualizadoEm       *time.Time `json:"atualizadoEm,omitempty"`
	CategoriaNome      string     `json:"categoria,omitempty"`
	FonteRendaNome     string     `json:"fonteRenda,omitempty"`
	ContaFixaNome      string     `json:"contaFixa,omitempty"`
	FormaPagamentoNome string     `json:"formaPagamento,omitempty"`
	StatusPagamento    string     `json:"statusPagamento,omitempty"`
}
