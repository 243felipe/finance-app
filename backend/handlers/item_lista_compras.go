package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"portal-backend/models"
)

type ItemListaComprasHandler struct {
	DB *pgxpool.Pool
}

type itemListaComprasInput struct {
	ListaComprasID int64   `json:"listaComprasId" binding:"required"`
	Descricao      string  `json:"descricao" binding:"required,min=2"`
	Valor          float64 `json:"valor" binding:"required,gt=0"`
}

func (h *ItemListaComprasHandler) List(c *gin.Context) {
	listaID := c.Query("listaId")
	
	var rows interface {
		Close()
		Next() bool
		Scan(dest ...interface{}) error
	}
	var err error
	
	if listaID != "" {
		rows, err = h.DB.Query(c, `
			SELECT id, lista_compras_id, descricao, valor
			FROM item_lista_compras
			WHERE lista_compras_id=$1
			ORDER BY id DESC`, listaID)
	} else {
		rows, err = h.DB.Query(c, `
			SELECT id, lista_compras_id, descricao, valor
			FROM item_lista_compras
			ORDER BY id DESC`)
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao listar itens"})
		return
	}
	defer rows.Close()

	var items []models.ItemListaCompras
	for rows.Next() {
		var item models.ItemListaCompras
		if err := rows.Scan(&item.ID, &item.ListaComprasID, &item.Descricao, &item.Valor); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler item"})
			return
		}
		items = append(items, item)
	}

	c.JSON(http.StatusOK, items)
}

func (h *ItemListaComprasHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var item models.ItemListaCompras
	err := h.DB.QueryRow(c, `
		SELECT id, lista_compras_id, descricao, valor
		FROM item_lista_compras
		WHERE id=$1`, id).
		Scan(&item.ID, &item.ListaComprasID, &item.Descricao, &item.Valor)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Item não encontrado"})
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *ItemListaComprasHandler) Create(c *gin.Context) {
	var payload itemListaComprasInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}

	var item models.ItemListaCompras
	err := h.DB.QueryRow(c, `
		INSERT INTO item_lista_compras (lista_compras_id, descricao, valor)
		VALUES ($1, $2, $3)
		RETURNING id, lista_compras_id, descricao, valor`,
		payload.ListaComprasID, payload.Descricao, payload.Valor,
	).Scan(&item.ID, &item.ListaComprasID, &item.Descricao, &item.Valor)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao criar item"})
		return
	}

	c.JSON(http.StatusCreated, item)
}

func (h *ItemListaComprasHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var payload itemListaComprasInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}

	var item models.ItemListaCompras
	err := h.DB.QueryRow(c, `
		UPDATE item_lista_compras
		SET descricao=$1, valor=$2
		WHERE id=$3
		RETURNING id, lista_compras_id, descricao, valor`,
		payload.Descricao, payload.Valor, id,
	).Scan(&item.ID, &item.ListaComprasID, &item.Descricao, &item.Valor)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar item"})
		return
	}

	c.JSON(http.StatusOK, item)
}

func (h *ItemListaComprasHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	_, err := h.DB.Exec(c, `DELETE FROM item_lista_compras WHERE id=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao excluir item"})
		return
	}
	c.Status(http.StatusNoContent)
}
