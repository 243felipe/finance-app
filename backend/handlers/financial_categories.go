package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"portal-backend/models"
)

type FinancialCategoryHandler struct {
	DB *pgxpool.Pool
}

type financialCategoryInput struct {
	Nome      string `json:"nome" binding:"required,min=2"`
	Tipo      string `json:"tipo" binding:"required,oneof=E S"`
	Descricao string `json:"descricao"`
	Ativo     *bool  `json:"ativo" binding:"required"`
}

func (h *FinancialCategoryHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(c, `
		SELECT id_categoria, nome, tipo, descricao, ativo, criado_em, atualizado_em
		FROM categoria_financeira
		ORDER BY id_categoria DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao listar categorias financeiras"})
		return
	}
	defer rows.Close()

	var items []models.FinancialCategory
	for rows.Next() {
		var fc models.FinancialCategory
		if err := rows.Scan(&fc.ID, &fc.Nome, &fc.Tipo, &fc.Descricao, &fc.Ativo, &fc.CriadoEm, &fc.AtualizadoEm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler categoria financeira"})
			return
		}
		items = append(items, fc)
	}

	c.JSON(http.StatusOK, items)
}

func (h *FinancialCategoryHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var fc models.FinancialCategory
	err := h.DB.QueryRow(c, `
		SELECT id_categoria, nome, tipo, descricao, ativo, criado_em, atualizado_em
		FROM categoria_financeira
		WHERE id_categoria=$1`, id).
		Scan(&fc.ID, &fc.Nome, &fc.Tipo, &fc.Descricao, &fc.Ativo, &fc.CriadoEm, &fc.AtualizadoEm)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Categoria financeira não encontrada"})
		return
	}
	c.JSON(http.StatusOK, fc)
}

func (h *FinancialCategoryHandler) Create(c *gin.Context) {
	var payload financialCategoryInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}

	var fc models.FinancialCategory
	err := h.DB.QueryRow(c, `
		INSERT INTO categoria_financeira (nome, tipo, descricao, ativo)
		VALUES ($1, $2, $3, $4)
		RETURNING id_categoria, nome, tipo, descricao, ativo, criado_em, atualizado_em`,
		payload.Nome, payload.Tipo, payload.Descricao, payload.Ativo,
	).Scan(&fc.ID, &fc.Nome, &fc.Tipo, &fc.Descricao, &fc.Ativo, &fc.CriadoEm, &fc.AtualizadoEm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao criar categoria financeira"})
		return
	}

	c.JSON(http.StatusCreated, fc)
}

func (h *FinancialCategoryHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var payload financialCategoryInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}

	var fc models.FinancialCategory
	err := h.DB.QueryRow(c, `
		UPDATE categoria_financeira
		SET nome=$1, tipo=$2, descricao=$3, ativo=$4, atualizado_em=NOW()
		WHERE id_categoria=$5
		RETURNING id_categoria, nome, tipo, descricao, ativo, criado_em, atualizado_em`,
		payload.Nome, payload.Tipo, payload.Descricao, payload.Ativo, id,
	).Scan(&fc.ID, &fc.Nome, &fc.Tipo, &fc.Descricao, &fc.Ativo, &fc.CriadoEm, &fc.AtualizadoEm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar categoria financeira"})
		return
	}

	c.JSON(http.StatusOK, fc)
}

func (h *FinancialCategoryHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	_, err := h.DB.Exec(c, `DELETE FROM categoria_financeira WHERE id_categoria=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao excluir categoria financeira"})
		return
	}
	c.Status(http.StatusNoContent)
}
