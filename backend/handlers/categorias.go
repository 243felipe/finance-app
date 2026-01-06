package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"portal-backend/models"
)

type CategoriaHandler struct {
	DB *pgxpool.Pool
}

type categoriaInput struct {
	Nome  string `json:"nome" binding:"required"`
	Ativo *bool  `json:"ativo"`
}

func (h *CategoriaHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(c, `
		SELECT id, nome, ativo, data_cadastro
		FROM categoria
		ORDER BY id DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao listar categorias"})
		return
	}
	defer rows.Close()

	var items []models.Categoria
	for rows.Next() {
		var cat models.Categoria
		if err := rows.Scan(&cat.ID, &cat.Nome, &cat.Ativo, &cat.DataCadastro); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler categoria"})
			return
		}
		items = append(items, cat)
	}

	c.JSON(http.StatusOK, items)
}

func (h *CategoriaHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var cat models.Categoria
	err := h.DB.QueryRow(c, `
		SELECT id, nome, ativo, data_cadastro
		FROM categoria
		WHERE id=$1`, id).
		Scan(&cat.ID, &cat.Nome, &cat.Ativo, &cat.DataCadastro)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Categoria não encontrada"})
		return
	}
	c.JSON(http.StatusOK, cat)
}

func (h *CategoriaHandler) Create(c *gin.Context) {
	var payload categoriaInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}
	ativo := true
	if payload.Ativo != nil {
		ativo = *payload.Ativo
	}

	var cat models.Categoria
	err := h.DB.QueryRow(
		c,
		`INSERT INTO categoria (nome, ativo) 
		 VALUES ($1, $2)
		 RETURNING id, nome, ativo, data_cadastro`,
		payload.Nome, ativo,
	).Scan(&cat.ID, &cat.Nome, &cat.Ativo, &cat.DataCadastro)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao criar categoria"})
		return
	}

	c.JSON(http.StatusCreated, cat)
}

func (h *CategoriaHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var payload categoriaInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}
	ativo := true
	if payload.Ativo != nil {
		ativo = *payload.Ativo
	}

	var cat models.Categoria
	err := h.DB.QueryRow(
		c,
		`UPDATE categoria
		   SET nome=$1, ativo=$2
		 WHERE id=$3
		 RETURNING id, nome, ativo, data_cadastro`,
		payload.Nome, ativo, id,
	).Scan(&cat.ID, &cat.Nome, &cat.Ativo, &cat.DataCadastro)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar categoria"})
		return
	}

	c.JSON(http.StatusOK, cat)
}

func (h *CategoriaHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	_, err := h.DB.Exec(c, `DELETE FROM categoria WHERE id=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao excluir categoria"})
		return
	}
	c.Status(http.StatusNoContent)
}

