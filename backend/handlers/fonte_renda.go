package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"portal-backend/models"
)

type FonteRendaHandler struct {
	DB *pgxpool.Pool
}

type fonteRendaInput struct {
	Nome        string  `json:"nome" binding:"required,min=2"`
	Descricao   string  `json:"descricao"`
	ValorPadrao float64 `json:"valorPadrao" binding:"required,gte=0"`
	Recorrente  *bool   `json:"recorrente" binding:"required"`
	Ativa       *bool   `json:"ativa" binding:"required"`
}

func (h *FonteRendaHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(c, `
		SELECT id_fonte_renda, nome, descricao, valor_padrao, recorrente, ativa, criado_em, atualizado_em
		FROM fonte_renda
		ORDER BY id_fonte_renda DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao listar fontes de renda"})
		return
	}
	defer rows.Close()

	var items []models.FonteRenda
	for rows.Next() {
		var fr models.FonteRenda
		if err := rows.Scan(&fr.ID, &fr.Nome, &fr.Descricao, &fr.ValorPadrao, &fr.Recorrente, &fr.Ativa, &fr.CriadoEm, &fr.AtualizadoEm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler fonte de renda"})
			return
		}
		items = append(items, fr)
	}

	c.JSON(http.StatusOK, items)
}

func (h *FonteRendaHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var fr models.FonteRenda
	err := h.DB.QueryRow(c, `
		SELECT id_fonte_renda, nome, descricao, valor_padrao, recorrente, ativa, criado_em, atualizado_em
		FROM fonte_renda
		WHERE id_fonte_renda=$1`, id).
		Scan(&fr.ID, &fr.Nome, &fr.Descricao, &fr.ValorPadrao, &fr.Recorrente, &fr.Ativa, &fr.CriadoEm, &fr.AtualizadoEm)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Fonte de renda não encontrada"})
		return
	}
	c.JSON(http.StatusOK, fr)
}

func (h *FonteRendaHandler) Create(c *gin.Context) {
	var payload fonteRendaInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}

	var fr models.FonteRenda
	err := h.DB.QueryRow(c, `
		INSERT INTO fonte_renda (nome, descricao, valor_padrao, recorrente, ativa)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id_fonte_renda, nome, descricao, valor_padrao, recorrente, ativa, criado_em, atualizado_em`,
		payload.Nome, payload.Descricao, payload.ValorPadrao, payload.Recorrente, payload.Ativa,
	).Scan(&fr.ID, &fr.Nome, &fr.Descricao, &fr.ValorPadrao, &fr.Recorrente, &fr.Ativa, &fr.CriadoEm, &fr.AtualizadoEm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao criar fonte de renda"})
		return
	}

	c.JSON(http.StatusCreated, fr)
}

func (h *FonteRendaHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var payload fonteRendaInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}

	var fr models.FonteRenda
	err := h.DB.QueryRow(c, `
		UPDATE fonte_renda
		SET nome=$1, descricao=$2, valor_padrao=$3, recorrente=$4, ativa=$5, atualizado_em=NOW()
		WHERE id_fonte_renda=$6
		RETURNING id_fonte_renda, nome, descricao, valor_padrao, recorrente, ativa, criado_em, atualizado_em`,
		payload.Nome, payload.Descricao, payload.ValorPadrao, payload.Recorrente, payload.Ativa, id,
	).Scan(&fr.ID, &fr.Nome, &fr.Descricao, &fr.ValorPadrao, &fr.Recorrente, &fr.Ativa, &fr.CriadoEm, &fr.AtualizadoEm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar fonte de renda"})
		return
	}

	c.JSON(http.StatusOK, fr)
}

func (h *FonteRendaHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	_, err := h.DB.Exec(c, `DELETE FROM fonte_renda WHERE id_fonte_renda=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao excluir fonte de renda"})
		return
	}
	c.Status(http.StatusNoContent)
}
