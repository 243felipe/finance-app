package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"portal-backend/models"
)

type ProductHandler struct {
	DB *pgxpool.Pool
}

type productInput struct {
	Nome        string  `json:"nome" binding:"required"`
	Descricao   string  `json:"descricao"`
	IDCategoria *int64  `json:"idCategoria"`
	Unidade     string  `json:"unidade" binding:"required"`
	Ativo       *bool   `json:"ativo"`
}

func (h *ProductHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(c, `
		SELECT 
			p.id,
			p.nome,
			p.descricao,
			p.id_categoria,
			p.unidade,
			p.ativo,
			p.data_cadastro,
			p.data_atualizacao,
			c.nome as categoria
		FROM produto p
		LEFT JOIN categoria c ON c.id = p.id_categoria
		ORDER BY p.id DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao listar produtos"})
		return
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(
			&p.ID,
			&p.Nome,
			&p.Descricao,
			&p.IDCategoria,
			&p.Unidade,
			&p.Ativo,
			&p.DataCadastro,
			&p.DataAtualiza,
			&p.Categoria,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler produto"})
			return
		}
		products = append(products, p)
	}

	c.JSON(http.StatusOK, products)
}

func (h *ProductHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var p models.Product
	err := h.DB.QueryRow(c, `
		SELECT 
			p.id,
			p.nome,
			p.descricao,
			p.id_categoria,
			p.unidade,
			p.ativo,
			p.data_cadastro,
			p.data_atualizacao,
			c.nome as categoria
		FROM produto p
		LEFT JOIN categoria c ON c.id = p.id_categoria
		WHERE p.id=$1`, id).
		Scan(
			&p.ID,
			&p.Nome,
			&p.Descricao,
			&p.IDCategoria,
			&p.Unidade,
			&p.Ativo,
			&p.DataCadastro,
			&p.DataAtualiza,
			&p.Categoria,
		)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Produto não encontrado"})
		return
	}
	c.JSON(http.StatusOK, p)
}

func (h *ProductHandler) Create(c *gin.Context) {
	var payload productInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}

	ativo := true
	if payload.Ativo != nil {
		ativo = *payload.Ativo
	}

	var p models.Product
	err := h.DB.QueryRow(
		c,
		`INSERT INTO produto (nome, descricao, id_categoria, unidade, ativo) 
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, nome, descricao, id_categoria, unidade, ativo, data_cadastro, data_atualizacao`,
		payload.Nome, payload.Descricao, payload.IDCategoria, payload.Unidade, ativo,
	).Scan(
		&p.ID,
		&p.Nome,
		&p.Descricao,
		&p.IDCategoria,
		&p.Unidade,
		&p.Ativo,
		&p.DataCadastro,
		&p.DataAtualiza,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao criar produto"})
		return
	}

	c.JSON(http.StatusCreated, p)
}

func (h *ProductHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var payload productInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}

	ativo := true
	if payload.Ativo != nil {
		ativo = *payload.Ativo
	}

	var p models.Product
	err := h.DB.QueryRow(
		c,
		`UPDATE produto 
		 SET nome=$1, descricao=$2, id_categoria=$3, unidade=$4, ativo=$5, data_atualizacao=NOW()
		 WHERE id=$6
		 RETURNING id, nome, descricao, id_categoria, unidade, ativo, data_cadastro, data_atualizacao`,
		payload.Nome, payload.Descricao, payload.IDCategoria, payload.Unidade, ativo, id,
	).Scan(
		&p.ID,
		&p.Nome,
		&p.Descricao,
		&p.IDCategoria,
		&p.Unidade,
		&p.Ativo,
		&p.DataCadastro,
		&p.DataAtualiza,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar produto"})
		return
	}

	c.JSON(http.StatusOK, p)
}

func (h *ProductHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	_, err := h.DB.Exec(c, `DELETE FROM produto WHERE id=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao excluir produto"})
		return
	}
	c.Status(http.StatusNoContent)
}












