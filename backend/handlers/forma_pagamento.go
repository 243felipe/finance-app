package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"portal-backend/models"
)

type FormaPagamentoHandler struct {
	DB *pgxpool.Pool
}

type formaPagamentoInput struct {
	Nome                string `json:"nome" binding:"required,min=2"`
	Descricao           string `json:"descricao"`
	Tipo                string `json:"tipo" binding:"required,oneof=D C P T"`
	PermiteParcelamento *bool  `json:"permiteParcelamento" binding:"required"`
	Ativa               *bool  `json:"ativa" binding:"required"`
}

func (h *FormaPagamentoHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(c, `
		SELECT id_forma_pagamento, nome, descricao, tipo, permite_parcelamento, ativa, criado_em, atualizado_em
		FROM forma_pagamento
		ORDER BY id_forma_pagamento DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao listar formas de pagamento"})
		return
	}
	defer rows.Close()

	var items []models.FormaPagamento
	for rows.Next() {
		var fp models.FormaPagamento
		if err := rows.Scan(&fp.ID, &fp.Nome, &fp.Descricao, &fp.Tipo, &fp.PermiteParcelamento, &fp.Ativa, &fp.CriadoEm, &fp.AtualizadoEm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler forma de pagamento"})
			return
		}
		items = append(items, fp)
	}

	c.JSON(http.StatusOK, items)
}

func (h *FormaPagamentoHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var fp models.FormaPagamento
	err := h.DB.QueryRow(c, `
		SELECT id_forma_pagamento, nome, descricao, tipo, permite_parcelamento, ativa, criado_em, atualizado_em
		FROM forma_pagamento
		WHERE id_forma_pagamento=$1`, id).
		Scan(&fp.ID, &fp.Nome, &fp.Descricao, &fp.Tipo, &fp.PermiteParcelamento, &fp.Ativa, &fp.CriadoEm, &fp.AtualizadoEm)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Forma de pagamento não encontrada"})
		return
	}
	c.JSON(http.StatusOK, fp)
}

func (h *FormaPagamentoHandler) Create(c *gin.Context) {
	var payload formaPagamentoInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}

	var fp models.FormaPagamento
	err := h.DB.QueryRow(c, `
		INSERT INTO forma_pagamento (nome, descricao, tipo, permite_parcelamento, ativa)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id_forma_pagamento, nome, descricao, tipo, permite_parcelamento, ativa, criado_em, atualizado_em`,
		payload.Nome, payload.Descricao, payload.Tipo, payload.PermiteParcelamento, payload.Ativa,
	).Scan(&fp.ID, &fp.Nome, &fp.Descricao, &fp.Tipo, &fp.PermiteParcelamento, &fp.Ativa, &fp.CriadoEm, &fp.AtualizadoEm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao criar forma de pagamento"})
		return
	}

	c.JSON(http.StatusCreated, fp)
}

func (h *FormaPagamentoHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var payload formaPagamentoInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}

	var fp models.FormaPagamento
	err := h.DB.QueryRow(c, `
		UPDATE forma_pagamento
		SET nome=$1, descricao=$2, tipo=$3, permite_parcelamento=$4, ativa=$5, atualizado_em=NOW()
		WHERE id_forma_pagamento=$6
		RETURNING id_forma_pagamento, nome, descricao, tipo, permite_parcelamento, ativa, criado_em, atualizado_em`,
		payload.Nome, payload.Descricao, payload.Tipo, payload.PermiteParcelamento, payload.Ativa, id,
	).Scan(&fp.ID, &fp.Nome, &fp.Descricao, &fp.Tipo, &fp.PermiteParcelamento, &fp.Ativa, &fp.CriadoEm, &fp.AtualizadoEm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar forma de pagamento"})
		return
	}

	c.JSON(http.StatusOK, fp)
}

func (h *FormaPagamentoHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	_, err := h.DB.Exec(c, `DELETE FROM forma_pagamento WHERE id_forma_pagamento=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao excluir forma de pagamento"})
		return
	}
	c.Status(http.StatusNoContent)
}
