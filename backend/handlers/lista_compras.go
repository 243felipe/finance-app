package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"portal-backend/models"
)

type ListaComprasHandler struct {
	DB *pgxpool.Pool
}

type listaComprasInput struct {
	Nome string `json:"nome" binding:"required,min=2"`
}

func (h *ListaComprasHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(c, `
		SELECT id, nome, data
		FROM lista_compras
		ORDER BY id DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao listar listas de compras"})
		return
	}
	defer rows.Close()

	var items []models.ListaCompras
	for rows.Next() {
		var lc models.ListaCompras
		if err := rows.Scan(&lc.ID, &lc.Nome, &lc.Data); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler lista de compras"})
			return
		}
		items = append(items, lc)
	}

	c.JSON(http.StatusOK, items)
}

func (h *ListaComprasHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var lc models.ListaCompras
	err := h.DB.QueryRow(c, `
		SELECT id, nome, data
		FROM lista_compras
		WHERE id=$1`, id).
		Scan(&lc.ID, &lc.Nome, &lc.Data)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Lista não encontrada"})
		return
	}
	c.JSON(http.StatusOK, lc)
}

func (h *ListaComprasHandler) Create(c *gin.Context) {
	var payload listaComprasInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}

	var lc models.ListaCompras
	err := h.DB.QueryRow(c, `
		INSERT INTO lista_compras (nome, data)
		VALUES ($1, CURRENT_DATE)
		RETURNING id, nome, data`,
		payload.Nome,
	).Scan(&lc.ID, &lc.Nome, &lc.Data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao criar lista"})
		return
	}

	c.JSON(http.StatusCreated, lc)
}

func (h *ListaComprasHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var payload listaComprasInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}

	var lc models.ListaCompras
	err := h.DB.QueryRow(c, `
		UPDATE lista_compras
		SET nome=$1
		WHERE id=$2
		RETURNING id, nome, data`,
		payload.Nome, id,
	).Scan(&lc.ID, &lc.Nome, &lc.Data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar lista"})
		return
	}

	c.JSON(http.StatusOK, lc)
}

func (h *ListaComprasHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	_, err := h.DB.Exec(c, `DELETE FROM lista_compras WHERE id=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao excluir lista"})
		return
	}
	c.Status(http.StatusNoContent)
}
