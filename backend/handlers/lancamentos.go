package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"portal-backend/models"
)

type LancamentoHandler struct {
	DB *pgxpool.Pool
}

type lancamentoInput struct {
	DataLancamento   string  `json:"dataLancamento" binding:"required"` // yyyy-MM-dd
	Descricao        string  `json:"descricao" binding:"required,min=3"`
	Tipo             string  `json:"tipo" binding:"required,oneof=E S"`
	Valor            float64 `json:"valor" binding:"required,gt=0"`
	IDCategoria      int64   `json:"idCategoria" binding:"required"`
	IDFonteRenda     *int64  `json:"idFonteRenda"`
	IDContaFixa      *int64  `json:"idContaFixa"`
	IDFormaPagamento *int64  `json:"idFormaPagamento"`
	Observacao       string  `json:"observacao"`
}

func (h *LancamentoHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(c, `
		SELECT 
			lf.id_lancamento,
			lf.data_lancamento,
			lf.descricao,
			lf.tipo,
			lf.valor,
			lf.id_categoria,
			lf.id_fonte_renda,
			lf.id_conta_fixa,
			lf.id_forma_pagamento,
			COALESCE(lf.observacao, '') AS observacao,
			lf.criado_em,
			lf.atualizado_em,
			c.nome AS categoria,
			COALESCE(fr.nome, '') AS fonte_renda,
			COALESCE(cf.nome, '') AS conta_fixa,
			COALESCE(fp.nome, '') AS forma_pagamento
		FROM lancamento_financeiro lf
		JOIN categoria_financeira c ON c.id_categoria = lf.id_categoria
		LEFT JOIN fonte_renda fr ON fr.id_fonte_renda = lf.id_fonte_renda
		LEFT JOIN conta_fixa cf ON cf.id_conta_fixa = lf.id_conta_fixa
		LEFT JOIN forma_pagamento fp ON fp.id_forma_pagamento = lf.id_forma_pagamento
		ORDER BY lf.data_lancamento DESC, lf.id_lancamento DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao listar lançamentos"})
		return
	}
	defer rows.Close()

	var items []models.LancamentoFinanceiro
	for rows.Next() {
		var lf models.LancamentoFinanceiro
		if err := rows.Scan(
			&lf.ID,
			&lf.DataLancamento,
			&lf.Descricao,
			&lf.Tipo,
			&lf.Valor,
			&lf.IDCategoria,
			&lf.IDFonteRenda,
			&lf.IDContaFixa,
			&lf.IDFormaPagamento,
			&lf.Observacao,
			&lf.CriadoEm,
			&lf.AtualizadoEm,
			&lf.CategoriaNome,
			&lf.FonteRendaNome,
			&lf.ContaFixaNome,
			&lf.FormaPagamentoNome,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler lançamento"})
			return
		}
		items = append(items, lf)
	}

	c.JSON(http.StatusOK, items)
}

// ListByDateRange retorna lançamentos filtrados por período e tipo
func (h *LancamentoHandler) ListByDateRange(c *gin.Context) {
	dataInicio := c.Query("dataInicio")
	dataFim := c.Query("dataFim")
	tipo := c.Query("tipo")
	idContaFixa := c.Query("idContaFixa")
	idFonteRenda := c.Query("idFonteRenda")

	query := `
		SELECT 
			lf.id_lancamento,
			lf.data_lancamento,
			lf.descricao,
			lf.tipo,
			lf.valor,
			lf.id_categoria,
			lf.id_fonte_renda,
			lf.id_conta_fixa,
			lf.id_forma_pagamento,
			COALESCE(lf.observacao, '') AS observacao,
			lf.criado_em,
			lf.atualizado_em,
			c.nome AS categoria,
			COALESCE(fr.nome, '') AS fonte_renda,
			COALESCE(cf.nome, '') AS conta_fixa,
			COALESCE(fp.nome, '') AS forma_pagamento
		FROM lancamento_financeiro lf
		JOIN categoria_financeira c ON c.id_categoria = lf.id_categoria
		LEFT JOIN fonte_renda fr ON fr.id_fonte_renda = lf.id_fonte_renda
		LEFT JOIN conta_fixa cf ON cf.id_conta_fixa = lf.id_conta_fixa
		LEFT JOIN forma_pagamento fp ON fp.id_forma_pagamento = lf.id_forma_pagamento
		WHERE 1=1`

	args := []interface{}{}
	argIndex := 1

	if dataInicio != "" {
		query += ` AND lf.data_lancamento >= $` + fmt.Sprintf("%d", argIndex)
		args = append(args, dataInicio)
		argIndex++
	}

	if dataFim != "" {
		query += ` AND lf.data_lancamento <= $` + fmt.Sprintf("%d", argIndex)
		args = append(args, dataFim)
		argIndex++
	}

	if tipo != "" {
		query += ` AND lf.tipo = $` + fmt.Sprintf("%d", argIndex)
		args = append(args, tipo)
		argIndex++
	}

	if idContaFixa != "" {
		query += ` AND lf.id_conta_fixa = $` + fmt.Sprintf("%d", argIndex)
		args = append(args, idContaFixa)
		argIndex++
	}

	if idFonteRenda != "" {
		query += ` AND lf.id_fonte_renda = $` + fmt.Sprintf("%d", argIndex)
		args = append(args, idFonteRenda)
		argIndex++
	}

	query += ` ORDER BY lf.data_lancamento DESC, lf.id_lancamento DESC`

	rows, err := h.DB.Query(c, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao listar lançamentos"})
		return
	}
	defer rows.Close()

	var items []models.LancamentoFinanceiro
	for rows.Next() {
		var lf models.LancamentoFinanceiro
		if err := rows.Scan(
			&lf.ID,
			&lf.DataLancamento,
			&lf.Descricao,
			&lf.Tipo,
			&lf.Valor,
			&lf.IDCategoria,
			&lf.IDFonteRenda,
			&lf.IDContaFixa,
			&lf.IDFormaPagamento,
			&lf.Observacao,
			&lf.CriadoEm,
			&lf.AtualizadoEm,
			&lf.CategoriaNome,
			&lf.FonteRendaNome,
			&lf.ContaFixaNome,
			&lf.FormaPagamentoNome,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler lançamento"})
			return
		}
		items = append(items, lf)
	}

	c.JSON(http.StatusOK, items)
}

func (h *LancamentoHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var lf models.LancamentoFinanceiro
	err := h.DB.QueryRow(c, `
		SELECT 
			lf.id_lancamento,
			lf.data_lancamento,
			lf.descricao,
			lf.tipo,
			lf.valor,
			lf.id_categoria,
			lf.id_fonte_renda,
			lf.id_conta_fixa,
			lf.id_forma_pagamento,
			COALESCE(lf.observacao, '') AS observacao,
			lf.criado_em,
			lf.atualizado_em,
			c.nome AS categoria,
			COALESCE(fr.nome, '') AS fonte_renda,
			COALESCE(cf.nome, '') AS conta_fixa,
			COALESCE(fp.nome, '') AS forma_pagamento
		FROM lancamento_financeiro lf
		JOIN categoria_financeira c ON c.id_categoria = lf.id_categoria
		LEFT JOIN fonte_renda fr ON fr.id_fonte_renda = lf.id_fonte_renda
		LEFT JOIN conta_fixa cf ON cf.id_conta_fixa = lf.id_conta_fixa
		LEFT JOIN forma_pagamento fp ON fp.id_forma_pagamento = lf.id_forma_pagamento
		WHERE lf.id_lancamento=$1`, id).
		Scan(
			&lf.ID, &lf.DataLancamento, &lf.Descricao, &lf.Tipo, &lf.Valor,
			&lf.IDCategoria, &lf.IDFonteRenda, &lf.IDContaFixa, &lf.IDFormaPagamento,
			&lf.Observacao, &lf.CriadoEm, &lf.AtualizadoEm,
			&lf.CategoriaNome, &lf.FonteRendaNome, &lf.ContaFixaNome, &lf.FormaPagamentoNome,
		)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Lançamento não encontrado"})
		return
	}
	c.JSON(http.StatusOK, lf)
}

func (h *LancamentoHandler) Create(c *gin.Context) {
	var payload lancamentoInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}
	data, err := time.Parse("2006-01-02", payload.DataLancamento)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data inválida"})
		return
	}

	var lf models.LancamentoFinanceiro
	err = h.DB.QueryRow(c, `
		INSERT INTO lancamento_financeiro (
			data_lancamento, descricao, tipo, valor, id_categoria, id_fonte_renda, id_conta_fixa, id_forma_pagamento, observacao
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		RETURNING id_lancamento, data_lancamento, descricao, tipo, valor, id_categoria, id_fonte_renda, id_conta_fixa, id_forma_pagamento, observacao, criado_em, atualizado_em`,
		data, payload.Descricao, payload.Tipo, payload.Valor, payload.IDCategoria, payload.IDFonteRenda, payload.IDContaFixa, payload.IDFormaPagamento, payload.Observacao,
	).Scan(
		&lf.ID, &lf.DataLancamento, &lf.Descricao, &lf.Tipo, &lf.Valor, &lf.IDCategoria, &lf.IDFonteRenda, &lf.IDContaFixa, &lf.IDFormaPagamento, &lf.Observacao, &lf.CriadoEm, &lf.AtualizadoEm,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao criar lançamento"})
		return
	}
	c.JSON(http.StatusCreated, lf)
}

func (h *LancamentoHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var payload lancamentoInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}
	data, err := time.Parse("2006-01-02", payload.DataLancamento)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data inválida"})
		return
	}

	var lf models.LancamentoFinanceiro
	err = h.DB.QueryRow(c, `
		UPDATE lancamento_financeiro
		SET data_lancamento=$1, descricao=$2, tipo=$3, valor=$4, id_categoria=$5, id_fonte_renda=$6, id_conta_fixa=$7, id_forma_pagamento=$8, observacao=$9, atualizado_em=NOW()
		WHERE id_lancamento=$10
		RETURNING id_lancamento, data_lancamento, descricao, tipo, valor, id_categoria, id_fonte_renda, id_conta_fixa, id_forma_pagamento, observacao, criado_em, atualizado_em`,
		data, payload.Descricao, payload.Tipo, payload.Valor, payload.IDCategoria, payload.IDFonteRenda, payload.IDContaFixa, payload.IDFormaPagamento, payload.Observacao, id,
	).Scan(
		&lf.ID, &lf.DataLancamento, &lf.Descricao, &lf.Tipo, &lf.Valor, &lf.IDCategoria, &lf.IDFonteRenda, &lf.IDContaFixa, &lf.IDFormaPagamento, &lf.Observacao, &lf.CriadoEm, &lf.AtualizadoEm,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar lançamento"})
		return
	}
	c.JSON(http.StatusOK, lf)
}

func (h *LancamentoHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	_, err := h.DB.Exec(c, `DELETE FROM lancamento_financeiro WHERE id_lancamento=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao excluir lançamento"})
		return
	}
	c.Status(http.StatusNoContent)
}
