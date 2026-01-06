package models

import "time"

type LancamentoServico struct {
	ID            int64                     `json:"id"`
	Descricao     string                    `json:"descricao"`
	Observacao    *string                   `json:"observacao,omitempty"`
	DataLancamento time.Time                `json:"dataLancamento"`
	Itens         []LancamentoServicoItem   `json:"itens,omitempty"`
}

type LancamentoServicoItem struct {
	ID                 int64   `json:"id"`
	IDLancamentoServico int64   `json:"idLancamentoServico"`
	IDProduto          int64   `json:"idProduto"`
	Quantidade         float64 `json:"quantidade"`
	Valor              float64 `json:"valor"`
	Produto            *string `json:"produto,omitempty"`
}

