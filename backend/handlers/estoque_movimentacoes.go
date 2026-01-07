package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"portal-backend/models"
)

type EstoqueMovimentacaoHandler struct {
	DB *pgxpool.Pool
}

type estoqueMovPayload struct {
	IDProduto   int64   `json:"idProduto" binding:"required"`
	Tipo        string  `json:"tipo" binding:"required"`
	Quantidade  float64 `json:"quantidade" binding:"required"`
	Valor       float64 `json:"valor"`
	Observacao  string  `json:"observacao"`
}

func (h *EstoqueMovimentacaoHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(c, `
		SELECT 
			m.id,
			m.id_produto,
			m.tipo,
			m.quantidade,
			m.valor,
			m.observacao,
			m.data_movimentacao,
			p.nome AS produto
		FROM estoque_movimentacao m
		LEFT JOIN produto p ON p.id = m.id_produto
		ORDER BY m.id DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao listar movimentações"})
		return
	}
	defer rows.Close()

	var items []models.EstoqueMovimentacao
	for rows.Next() {
		var m models.EstoqueMovimentacao
		if err := rows.Scan(
			&m.ID,
			&m.IDProduto,
			&m.Tipo,
			&m.Quantidade,
			&m.Valor,
			&m.Observacao,
			&m.DataMovimentacao,
			&m.Produto,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler movimentação"})
			return
		}
		items = append(items, m)
	}

	c.JSON(http.StatusOK, items)
}

// GetLastValor retorna o último valor lançado para um produto em estoque_movimentacao
func (h *EstoqueMovimentacaoHandler) GetLastValor(c *gin.Context) {
	idProdStr := c.Param("idProduto")
	if idProdStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID do produto é obrigatório"})
		return
	}

	var valor float64
	err := h.DB.QueryRow(c, `
		SELECT COALESCE(em.valor / NULLIF(em.quantidade, 0), 0)
		FROM estoque_movimentacao em
		WHERE em.id_produto = $1
		  AND em.tipo = 'ENTRADA'
		ORDER BY em.data_movimentacao DESC, em.id DESC
		LIMIT 1
	`, idProdStr).Scan(&valor)
	if err != nil {
		if err == pgx.ErrNoRows {
			// Se não houver registros, retorna 0
			c.JSON(http.StatusOK, gin.H{"valor": 0})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao buscar valor do produto", "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"valor": valor})
}

// GetSaldo retorna a quantidade atual em estoque para um produto
func (h *EstoqueMovimentacaoHandler) GetSaldo(c *gin.Context) {
	idProdStr := c.Param("idProduto")
	if idProdStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID do produto é obrigatório"})
		return
	}

	var qtd float64
	err := h.DB.QueryRow(c, `
		SELECT COALESCE(quantidade, 0)
		FROM estoque
		WHERE id_produto = $1
	`, idProdStr).Scan(&qtd)
	if err != nil {
		if err == pgx.ErrNoRows {
			// Se não houver registro na tabela estoque, calcula a partir do histórico
			var saldoCalc float64
			calcErr := h.DB.QueryRow(c, `
				SELECT COALESCE(SUM(
					CASE WHEN tipo = 'ENTRADA' THEN quantidade ELSE -quantidade END
				), 0)
				FROM estoque_movimentacao
				WHERE id_produto = $1
			`, idProdStr).Scan(&saldoCalc)
			if calcErr != nil {
				if calcErr == pgx.ErrNoRows {
					// Se não houver movimentações, retorna 0
					c.JSON(http.StatusOK, gin.H{"quantidade": 0})
					return
				}
				c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao buscar saldo do produto", "error": calcErr.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"quantidade": saldoCalc})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao buscar saldo do produto", "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"quantidade": qtd})
}

func (h *EstoqueMovimentacaoHandler) Create(c *gin.Context) {
	var payload estoqueMovPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}

	var m models.EstoqueMovimentacao
	tx, err := h.DB.BeginTx(c, pgx.TxOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao iniciar transação"})
		return
	}
	defer tx.Rollback(c)

	err = tx.QueryRow(
		c,
		`INSERT INTO estoque_movimentacao (id_produto, tipo, quantidade, valor, observacao)
		 VALUES ($1, $2, $3, $4, NULLIF($5, ''))
		 RETURNING id, id_produto, tipo, quantidade, valor, observacao, data_movimentacao`,
		payload.IDProduto, payload.Tipo, payload.Quantidade, payload.Valor, payload.Observacao,
	).Scan(
		&m.ID,
		&m.IDProduto,
		&m.Tipo,
		&m.Quantidade,
		&m.Valor,
		&m.Observacao,
		&m.DataMovimentacao,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao criar movimentação"})
		return
	}

	// garante registro na tabela estoque
	_, err = tx.Exec(c, `
		INSERT INTO estoque (id_produto, quantidade)
		VALUES ($1, 0)
		ON CONFLICT (id_produto) DO NOTHING
	`, payload.IDProduto)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao preparar estoque"})
		return
	}

	if payload.Tipo == "ENTRADA" {
		_, err = tx.Exec(c, `
			UPDATE estoque
			   SET quantidade = quantidade + $1,
			       data_atualizacao = CURRENT_TIMESTAMP
			 WHERE id_produto = $2
		`, payload.Quantidade, payload.IDProduto)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar estoque (entrada)"})
			return
		}
	} else if payload.Tipo == "SAIDA" {
		ct, err := tx.Exec(c, `
			UPDATE estoque
			   SET quantidade = quantidade - $1,
			       data_atualizacao = CURRENT_TIMESTAMP
			 WHERE id_produto = $2
			   AND quantidade >= $1
		`, payload.Quantidade, payload.IDProduto)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar estoque (saída)"})
			return
		}
		if ct.RowsAffected() == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Estoque insuficiente"})
			return
		}
	}

	if err := tx.Commit(c); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao confirmar transação"})
		return
	}

	c.JSON(http.StatusCreated, m)
}

func (h *EstoqueMovimentacaoHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var payload estoqueMovPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}

	var m models.EstoqueMovimentacao
	err := h.DB.QueryRow(
		c,
		`UPDATE estoque_movimentacao
		   SET id_produto=$1, tipo=$2, quantidade=$3, valor=$4, observacao=NULLIF($5, '')
		 WHERE id=$6
		 RETURNING id, id_produto, tipo, quantidade, valor, observacao, data_movimentacao`,
		payload.IDProduto, payload.Tipo, payload.Quantidade, payload.Valor, payload.Observacao, id,
	).Scan(
		&m.ID,
		&m.IDProduto,
		&m.Tipo,
		&m.Quantidade,
		&m.Valor,
		&m.Observacao,
		&m.DataMovimentacao,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar movimentação"})
		return
	}

	c.JSON(http.StatusOK, m)
}

func (h *EstoqueMovimentacaoHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	_, err := h.DB.Exec(c, `DELETE FROM estoque_movimentacao WHERE id=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao excluir movimentação"})
		return
	}
	c.Status(http.StatusNoContent)
}

