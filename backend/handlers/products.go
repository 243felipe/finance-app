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
	Name     string  `json:"name" binding:"required"`
	SKU      string  `json:"sku" binding:"required"`
	Price    float64 `json:"price" binding:"required"`
	Quantity int     `json:"quantity" binding:"required"`
}

func (h *ProductHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(c, `SELECT id, name, sku, price, quantity, created_at, updated_at FROM products ORDER BY id DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao listar produtos"})
		return
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(&p.ID, &p.Name, &p.SKU, &p.Price, &p.Quantity, &p.CreatedAt, &p.UpdatedAt); err != nil {
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
	err := h.DB.QueryRow(c, `SELECT id, name, sku, price, quantity, created_at, updated_at FROM products WHERE id=$1`, id).
		Scan(&p.ID, &p.Name, &p.SKU, &p.Price, &p.Quantity, &p.CreatedAt, &p.UpdatedAt)
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

	var p models.Product
	err := h.DB.QueryRow(
		c,
		`INSERT INTO products (name, sku, price, quantity) VALUES ($1, $2, $3, $4) RETURNING id, name, sku, price, quantity, created_at, updated_at`,
		payload.Name, payload.SKU, payload.Price, payload.Quantity,
	).Scan(&p.ID, &p.Name, &p.SKU, &p.Price, &p.Quantity, &p.CreatedAt, &p.UpdatedAt)
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

	var p models.Product
	err := h.DB.QueryRow(
		c,
		`UPDATE products SET name=$1, sku=$2, price=$3, quantity=$4, updated_at=NOW() WHERE id=$5 RETURNING id, name, sku, price, quantity, created_at, updated_at`,
		payload.Name, payload.SKU, payload.Price, payload.Quantity, id,
	).Scan(&p.ID, &p.Name, &p.SKU, &p.Price, &p.Quantity, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar produto"})
		return
	}

	c.JSON(http.StatusOK, p)
}

func (h *ProductHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	_, err := h.DB.Exec(c, `DELETE FROM products WHERE id=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao excluir produto"})
		return
	}
	c.Status(http.StatusNoContent)
}





