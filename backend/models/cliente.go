package models

import "time"

// Cliente representa dados cadastrais do cliente.
type Cliente struct {
	ID                    int64      `json:"id"`
	TipoCliente           string     `json:"tipoCliente"`
	NomeRazaoSocial       string     `json:"nomeRazaoSocial"`
	NomeFantasia          *string    `json:"nomeFantasia,omitempty"`
	CPFCNPJ               string     `json:"cpfCnpj"`
	RGIE                  *string    `json:"rgIe,omitempty"`
	DataCadastro          *time.Time `json:"dataCadastro,omitempty"`
	Ativo                 bool       `json:"ativo"`
	TelefonePrincipal     *string    `json:"telefonePrincipal,omitempty"`
	TelefoneSecundario    *string    `json:"telefoneSecundario,omitempty"`
	Whatsapp              *string    `json:"whatsapp,omitempty"`
	Email                 *string    `json:"email,omitempty"`
	CEP                   *string    `json:"cep,omitempty"`
	Logradouro            *string    `json:"logradouro,omitempty"`
	Numero                *string    `json:"numero,omitempty"`
	Complemento           *string    `json:"complemento,omitempty"`
	Bairro                *string    `json:"bairro,omitempty"`
	Cidade                *string    `json:"cidade,omitempty"`
	Estado                *string    `json:"estado,omitempty"`
	Observacoes           *string    `json:"observacoes,omitempty"`
	TipoClienteBorracharia *string   `json:"tipoClienteBorracharia,omitempty"`
	LimiteCredito         *float64   `json:"limiteCredito,omitempty"`
	FormaPagamentoPadrao  *string    `json:"formaPagamentoPadrao,omitempty"`
}

// ClienteHistorico representa eventos relacionados ao cliente.
type ClienteHistorico struct {
	ID         int64      `json:"id"`
	IDCliente  int64      `json:"idCliente"`
	TipoEvento string     `json:"tipoEvento"`
	Descricao  *string    `json:"descricao,omitempty"`
	DataEvento *time.Time `json:"dataEvento,omitempty"`
}

