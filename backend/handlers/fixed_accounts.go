package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"portal-backend/models"
)

type FixedAccountHandler struct {
	DB *pgxpool.Pool
}

type fixedAccountInput struct {
	Nome          string  `json:"nome" binding:"required,min=2"`
	Descricao     string  `json:"descricao"`
	IDCategoria   int64   `json:"idCategoria" binding:"required"`
	Valor         float64 `json:"valor" binding:"required,gt=0"`
	DiaVencimento int     `json:"diaVencimento" binding:"required,min=1,max=31"`
	Ativa         *bool   `json:"ativa" binding:"required"`
}

func (h *FixedAccountHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(c, `
		SELECT id_conta_fixa, nome, descricao, id_categoria, valor, dia_vencimento, ativa, criado_em, atualizado_em
		FROM conta_fixa
		ORDER BY id_conta_fixa DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao listar contas fixas"})
		return
	}
	defer rows.Close()

	var items []models.FixedAccount
	for rows.Next() {
		var fa models.FixedAccount
		if err := rows.Scan(&fa.ID, &fa.Nome, &fa.Descricao, &fa.IDCategoria, &fa.Valor, &fa.DiaVencimento, &fa.Ativa, &fa.CriadoEm, &fa.AtualizadoEm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler conta fixa"})
			return
		}
		items = append(items, fa)
	}

	c.JSON(http.StatusOK, items)
}

func (h *FixedAccountHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var fa models.FixedAccount
	err := h.DB.QueryRow(c, `
		SELECT id_conta_fixa, nome, descricao, id_categoria, valor, dia_vencimento, ativa, criado_em, atualizado_em
		FROM conta_fixa
		WHERE id_conta_fixa=$1`, id).
		Scan(&fa.ID, &fa.Nome, &fa.Descricao, &fa.IDCategoria, &fa.Valor, &fa.DiaVencimento, &fa.Ativa, &fa.CriadoEm, &fa.AtualizadoEm)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Conta fixa não encontrada"})
		return
	}
	c.JSON(http.StatusOK, fa)
}

func (h *FixedAccountHandler) Create(c *gin.Context) {
	var payload fixedAccountInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}

	var fa models.FixedAccount
	err := h.DB.QueryRow(c, `
		INSERT INTO conta_fixa (nome, descricao, id_categoria, valor, dia_vencimento, ativa)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id_conta_fixa, nome, descricao, id_categoria, valor, dia_vencimento, ativa, criado_em, atualizado_em`,
		payload.Nome, payload.Descricao, payload.IDCategoria, payload.Valor, payload.DiaVencimento, payload.Ativa,
	).Scan(&fa.ID, &fa.Nome, &fa.Descricao, &fa.IDCategoria, &fa.Valor, &fa.DiaVencimento, &fa.Ativa, &fa.CriadoEm, &fa.AtualizadoEm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao criar conta fixa"})
		return
	}

	c.JSON(http.StatusCreated, fa)
}

func (h *FixedAccountHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var payload fixedAccountInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}

	var fa models.FixedAccount
	err := h.DB.QueryRow(c, `
		UPDATE conta_fixa
		SET nome=$1, descricao=$2, id_categoria=$3, valor=$4, dia_vencimento=$5, ativa=$6, atualizado_em=NOW()
		WHERE id_conta_fixa=$7
		RETURNING id_conta_fixa, nome, descricao, id_categoria, valor, dia_vencimento, ativa, criado_em, atualizado_em`,
		payload.Nome, payload.Descricao, payload.IDCategoria, payload.Valor, payload.DiaVencimento, payload.Ativa, id,
	).Scan(&fa.ID, &fa.Nome, &fa.Descricao, &fa.IDCategoria, &fa.Valor, &fa.DiaVencimento, &fa.Ativa, &fa.CriadoEm, &fa.AtualizadoEm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar conta fixa"})
		return
	}

	c.JSON(http.StatusOK, fa)
}

func (h *FixedAccountHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	_, err := h.DB.Exec(c, `DELETE FROM conta_fixa WHERE id_conta_fixa=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao excluir conta fixa"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *FixedAccountHandler) Total(c *gin.Context) {
	var total float64
	err := h.DB.QueryRow(c, `SELECT COALESCE(SUM(valor), 0) FROM conta_fixa`).Scan(&total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao calcular total de contas fixas"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"total": total})
}
