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

type listaComprasComItensInput struct {
	Nome  string                      `json:"nome" binding:"required,min=2"`
	Itens []itemListaComprasInputItem `json:"itens" binding:"required,min=1,dive"`
}

type itemListaComprasInputItem struct {
	Descricao string  `json:"descricao" binding:"required,min=1"`
	Valor     float64 `json:"valor" binding:"required,gt=0"`
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

func (h *ListaComprasHandler) CreateComItens(c *gin.Context) {
	var payload listaComprasComItensInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos", "error": err.Error()})
		return
	}

	// Inicia uma transação
	tx, err := h.DB.Begin(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao iniciar transação"})
		return
	}
	defer tx.Rollback(c.Request.Context())

	// Insere a lista de compras
	var listaID int64
	var listaNome string
	var listaData interface{}
	err = tx.QueryRow(c.Request.Context(), `
		INSERT INTO lista_compras (nome, data)
		VALUES ($1, CURRENT_DATE)
		RETURNING id, nome, data`,
		payload.Nome,
	).Scan(&listaID, &listaNome, &listaData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao criar lista"})
		return
	}

	// Insere os itens
	var itens []models.ItemListaCompras
	for _, itemInput := range payload.Itens {
		var item models.ItemListaCompras
		err = tx.QueryRow(c.Request.Context(), `
			INSERT INTO item_lista_compras (lista_compras_id, descricao, valor)
			VALUES ($1, $2, $3)
			RETURNING id, lista_compras_id, descricao, valor`,
			listaID, itemInput.Descricao, itemInput.Valor,
		).Scan(&item.ID, &item.ListaComprasID, &item.Descricao, &item.Valor)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao criar item"})
			return
		}
		itens = append(itens, item)
	}

	// Commit da transação
	if err = tx.Commit(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao finalizar transação"})
		return
	}

	// Retorna a resposta com a lista e os itens
	c.JSON(http.StatusCreated, gin.H{
		"lista": models.ListaCompras{
			ID:   listaID,
			Nome: listaNome,
		},
		"itens": itens,
	})
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
