package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"portal-backend/models"
)

type LancamentoRecorrenteHandler struct {
	DB *pgxpool.Pool
}

type lancamentoRecorrenteInput struct {
	Tipo             string  `json:"tipo" binding:"required,oneof=E S"`
	Descricao        string  `json:"descricao" binding:"required,min=3"`
	Valor            float64 `json:"valor" binding:"required,gt=0"`
	IDCategoria      int64   `json:"idCategoria" binding:"required"`
	IDFonteRenda     *int64  `json:"idFonteRenda"`
	IDFormaPagamento *int64  `json:"idFormaPagamento"`
	Periodicidade    string  `json:"periodicidade" binding:"required,oneof=MENSAL ANUAL"`
	DiaExecucao      int     `json:"diaExecucao" binding:"required,min=1,max=31"`
	DataInicio       string  `json:"dataInicio" binding:"required"` // yyyy-MM-dd
	DataFim          *string `json:"dataFim"`                       // yyyy-MM-dd ou null
	Ativo            bool    `json:"ativo"`
	Observacao       string  `json:"observacao"`
}

// ListEntradas lista os lançamentos recorrentes de entrada (tipo 'E')
func (h *LancamentoRecorrenteHandler) ListEntradas(c *gin.Context) {
	rows, err := h.DB.Query(c, `
		SELECT
			lr.id_recorrente,
			lr.tipo,
			lr.descricao,
			lr.valor,
			lr.id_categoria,
			lr.id_fonte_renda,
			lr.id_forma_pagamento,
			lr.periodicidade,
			lr.dia_execucao,
			lr.data_inicio,
			lr.data_fim,
			lr.ativo,
			lr.observacao,
			lr.criado_em,
			lr.atualizado_em
		FROM lancamento_recorrente lr
		WHERE lr.tipo = 'E' AND lr.ativo = TRUE
		ORDER BY lr.descricao`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao listar lançamentos recorrentes de entrada"})
		return
	}
	defer rows.Close()

	var items []models.LancamentoRecorrente
	for rows.Next() {
		var lr models.LancamentoRecorrente
		if err := rows.Scan(
			&lr.IDRecorrente,
			&lr.Tipo,
			&lr.Descricao,
			&lr.Valor,
			&lr.IDCategoria,
			&lr.IDFonteRenda,
			&lr.IDFormaPagamento,
			&lr.Periodicidade,
			&lr.DiaExecucao,
			&lr.DataInicio,
			&lr.DataFim,
			&lr.Ativo,
			&lr.Observacao,
			&lr.CriadoEm,
			&lr.AtualizadoEm,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler lançamento recorrente"})
			return
		}
		items = append(items, lr)
	}

	c.JSON(http.StatusOK, items)
}

// ListSaidas lista os lançamentos recorrentes de saída (tipo 'S')
func (h *LancamentoRecorrenteHandler) ListSaidas(c *gin.Context) {
	rows, err := h.DB.Query(c, `
		SELECT
			lr.id_recorrente,
			lr.tipo,
			lr.descricao,
			lr.valor,
			lr.id_categoria,
			lr.id_fonte_renda,
			lr.id_forma_pagamento,
			lr.periodicidade,
			lr.dia_execucao,
			lr.data_inicio,
			lr.data_fim,
			lr.ativo,
			lr.observacao,
			lr.criado_em,
			lr.atualizado_em
		FROM lancamento_recorrente lr
		WHERE lr.tipo = 'S' AND lr.ativo = TRUE
		ORDER BY lr.descricao`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao listar lançamentos recorrentes de saída"})
		return
	}
	defer rows.Close()

	var items []models.LancamentoRecorrente
	for rows.Next() {
		var lr models.LancamentoRecorrente
		if err := rows.Scan(
			&lr.IDRecorrente,
			&lr.Tipo,
			&lr.Descricao,
			&lr.Valor,
			&lr.IDCategoria,
			&lr.IDFonteRenda,
			&lr.IDFormaPagamento,
			&lr.Periodicidade,
			&lr.DiaExecucao,
			&lr.DataInicio,
			&lr.DataFim,
			&lr.Ativo,
			&lr.Observacao,
			&lr.CriadoEm,
			&lr.AtualizadoEm,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler lançamento recorrente"})
			return
		}
		items = append(items, lr)
	}

	c.JSON(http.StatusOK, items)
}

// Create cria um novo lançamento recorrente
func (h *LancamentoRecorrenteHandler) Create(c *gin.Context) {
	var payload lancamentoRecorrenteInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos", "error": err.Error()})
		return
	}

	dataInicio, err := time.Parse("2006-01-02", payload.DataInicio)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data de início inválida"})
		return
	}

	var dataFim *time.Time
	if payload.DataFim != nil && *payload.DataFim != "" {
		parsedDataFim, err := time.Parse("2006-01-02", *payload.DataFim)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Data de fim inválida"})
			return
		}
		dataFim = &parsedDataFim
	}

	var lr models.LancamentoRecorrente
	err = h.DB.QueryRow(c, `
		INSERT INTO lancamento_recorrente (
			tipo, descricao, valor, id_categoria, id_fonte_renda, id_forma_pagamento,
			periodicidade, dia_execucao, data_inicio, data_fim, ativo, observacao
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id_recorrente, tipo, descricao, valor, id_categoria, id_fonte_renda, id_forma_pagamento,
			periodicidade, dia_execucao, data_inicio, data_fim, ativo, observacao, criado_em, atualizado_em`,
		payload.Tipo, payload.Descricao, payload.Valor, payload.IDCategoria, payload.IDFonteRenda, payload.IDFormaPagamento,
		payload.Periodicidade, payload.DiaExecucao, dataInicio, dataFim, payload.Ativo, payload.Observacao,
	).Scan(
		&lr.IDRecorrente, &lr.Tipo, &lr.Descricao, &lr.Valor, &lr.IDCategoria, &lr.IDFonteRenda, &lr.IDFormaPagamento,
		&lr.Periodicidade, &lr.DiaExecucao, &lr.DataInicio, &lr.DataFim, &lr.Ativo, &lr.Observacao, &lr.CriadoEm, &lr.AtualizadoEm,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao criar lançamento recorrente", "error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, lr)
}

// Update atualiza um lançamento recorrente existente
func (h *LancamentoRecorrenteHandler) Update(c *gin.Context) {
	id := c.Param("id")
	idRecorrente, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID de lançamento recorrente inválido"})
		return
	}

	var payload lancamentoRecorrenteInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos", "error": err.Error()})
		return
	}

	dataInicio, err := time.Parse("2006-01-02", payload.DataInicio)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Data de início inválida"})
		return
	}

	var dataFim *time.Time
	if payload.DataFim != nil && *payload.DataFim != "" {
		parsedDataFim, err := time.Parse("2006-01-02", *payload.DataFim)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Data de fim inválida"})
			return
		}
		dataFim = &parsedDataFim
	}

	var lr models.LancamentoRecorrente
	err = h.DB.QueryRow(c, `
		UPDATE lancamento_recorrente
		SET tipo=$1, descricao=$2, valor=$3, id_categoria=$4, id_fonte_renda=$5, id_forma_pagamento=$6,
			periodicidade=$7, dia_execucao=$8, data_inicio=$9, data_fim=$10, ativo=$11, observacao=$12
		WHERE id_recorrente=$13
		RETURNING id_recorrente, tipo, descricao, valor, id_categoria, id_fonte_renda, id_forma_pagamento,
			periodicidade, dia_execucao, data_inicio, data_fim, ativo, observacao, criado_em, atualizado_em`,
		payload.Tipo, payload.Descricao, payload.Valor, payload.IDCategoria, payload.IDFonteRenda, payload.IDFormaPagamento,
		payload.Periodicidade, payload.DiaExecucao, dataInicio, dataFim, payload.Ativo, payload.Observacao, idRecorrente,
	).Scan(
		&lr.IDRecorrente, &lr.Tipo, &lr.Descricao, &lr.Valor, &lr.IDCategoria, &lr.IDFonteRenda, &lr.IDFormaPagamento,
		&lr.Periodicidade, &lr.DiaExecucao, &lr.DataInicio, &lr.DataFim, &lr.Ativo, &lr.Observacao, &lr.CriadoEm, &lr.AtualizadoEm,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar lançamento recorrente", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, lr)
}

// Delete exclui um lançamento recorrente
func (h *LancamentoRecorrenteHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	idRecorrente, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID de lançamento recorrente inválido"})
		return
	}

	_, err = h.DB.Exec(c, `DELETE FROM lancamento_recorrente WHERE id_recorrente=$1`, idRecorrente)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao excluir lançamento recorrente", "error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// GerarLancamentosAutomaticos verifica e gera lançamentos financeiros baseados nos recorrentes ativos
// Deve ser chamado ao fazer login ou periodicamente
func (h *LancamentoRecorrenteHandler) GerarLancamentosAutomaticos(ctx context.Context) error {
	hoje := time.Now()
	anoAtual := hoje.Year()
	mesAtual := int(hoje.Month())

	// Busca todos os recorrentes ativos
	rows, err := h.DB.Query(ctx, `
		SELECT
			id_recorrente, tipo, descricao, valor, id_categoria, id_fonte_renda, id_forma_pagamento,
			periodicidade, dia_execucao, data_inicio, data_fim, observacao
		FROM lancamento_recorrente
		WHERE ativo = TRUE
			AND (data_fim IS NULL OR data_fim >= CURRENT_DATE)
			AND data_inicio <= CURRENT_DATE
	`)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var lr models.LancamentoRecorrente
		if err := rows.Scan(
			&lr.IDRecorrente, &lr.Tipo, &lr.Descricao, &lr.Valor, &lr.IDCategoria,
			&lr.IDFonteRenda, &lr.IDFormaPagamento, &lr.Periodicidade, &lr.DiaExecucao,
			&lr.DataInicio, &lr.DataFim, &lr.Observacao,
		); err != nil {
			continue
		}

		// Verifica se já existe lançamento gerado para este mês/ano
		var dataLancamento time.Time
		if lr.Periodicidade == "MENSAL" {
			// Para mensal: usa o dia_execucao do mês atual
			dataLancamento = time.Date(anoAtual, time.Month(mesAtual), lr.DiaExecucao, 0, 0, 0, 0, time.Local)
		} else { // ANUAL
			// Para anual: usa o dia_execucao e mês da data_inicio
			mesInicio := int(lr.DataInicio.Month())
			dataLancamento = time.Date(anoAtual, time.Month(mesInicio), lr.DiaExecucao, 0, 0, 0, 0, time.Local)
		}

		// Só gera se a data de lançamento já passou ou é hoje
		if dataLancamento.After(hoje) {
			continue
		}

		// Verifica se já existe lançamento gerado para este recorrente neste mês/ano
		var existe int
		err = h.DB.QueryRow(ctx, `
			SELECT COUNT(*)
			FROM lancamento_financeiro
			WHERE gerado_recorrente = TRUE
				AND tipo = $1
				AND descricao = $2
				AND valor = $3
				AND id_categoria = $4
				AND EXTRACT(YEAR FROM data_lancamento) = $5
				AND EXTRACT(MONTH FROM data_lancamento) = $6
		`, lr.Tipo, lr.Descricao, lr.Valor, lr.IDCategoria, anoAtual, mesAtual).Scan(&existe)

		if err != nil || existe > 0 {
			continue // Já existe, pula
		}

		// Gera o lançamento financeiro
		_, err = h.DB.Exec(ctx, `
			INSERT INTO lancamento_financeiro (
				data_lancamento, descricao, tipo, valor, id_categoria,
				id_fonte_renda, id_forma_pagamento, observacao, gerado_recorrente
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
		`, dataLancamento, lr.Descricao, lr.Tipo, lr.Valor, lr.IDCategoria,
			lr.IDFonteRenda, lr.IDFormaPagamento, lr.Observacao)

		if err != nil {
			// Log erro mas continua processando outros
			continue
		}
	}

	return nil
}
