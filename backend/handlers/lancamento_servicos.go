package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"portal-backend/models"
)

type LancamentoServicoHandler struct {
	DB *pgxpool.Pool
}

type lancamentoServicoItemPayload struct {
	IDProduto  int64   `json:"idProduto" binding:"required"`
	Quantidade float64 `json:"quantidade" binding:"required"`
	Valor      float64 `json:"valor" binding:"required"`
}

type lancamentoServicoPayload struct {
	IDCliente  int64                          `json:"idCliente" binding:"required"`
	Descricao  string                          `json:"descricao" binding:"required"`
	Observacao string                          `json:"observacao"`
	Itens      []lancamentoServicoItemPayload  `json:"itens" binding:"required"`
}

func (h *LancamentoServicoHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(c, `
		SELECT ls.id, ls.id_cliente, ls.descricao, ls.observacao, ls.data_lancamento, c.nome_razao_social
		FROM lancamento_servico ls
		LEFT JOIN cliente c ON c.id = ls.id_cliente
		ORDER BY ls.id DESC
		LIMIT 200
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao listar lançamentos de serviço"})
		return
	}
	defer rows.Close()

	var list []models.LancamentoServico
	for rows.Next() {
		var s models.LancamentoServico
		if err := rows.Scan(&s.ID, &s.IDCliente, &s.Descricao, &s.Observacao, &s.DataLancamento, &s.Cliente); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler lançamento de serviço"})
			return
		}
		list = append(list, s)
	}

	c.JSON(http.StatusOK, list)
}

func (h *LancamentoServicoHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var s models.LancamentoServico
	err := h.DB.QueryRow(c, `
		SELECT ls.id, ls.id_cliente, ls.descricao, ls.observacao, ls.data_lancamento, c.nome_razao_social
		FROM lancamento_servico ls
		LEFT JOIN cliente c ON c.id = ls.id_cliente
		WHERE ls.id = $1
	`, id).Scan(&s.ID, &s.IDCliente, &s.Descricao, &s.Observacao, &s.DataLancamento, &s.Cliente)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Serviço não encontrado"})
		return
	}

	rows, err := h.DB.Query(c, `
		SELECT i.id, i.id_lancamento_servico, i.id_produto, i.quantidade, i.valor, p.nome
		FROM lancamento_servico_item i
		LEFT JOIN produto p ON p.id = i.id_produto
		WHERE i.id_lancamento_servico = $1
	`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao buscar itens"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var it models.LancamentoServicoItem
		if err := rows.Scan(&it.ID, &it.IDLancamentoServico, &it.IDProduto, &it.Quantidade, &it.Valor, &it.Produto); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler item"})
			return
		}
		s.Itens = append(s.Itens, it)
	}

	c.JSON(http.StatusOK, s)
}

func (h *LancamentoServicoHandler) Create(c *gin.Context) {
	var payload lancamentoServicoPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}
	if len(payload.Itens) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Informe ao menos um item"})
		return
	}

	tx, err := h.DB.BeginTx(c, pgx.TxOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao iniciar transação"})
		return
	}
	defer tx.Rollback(c)

	var serv models.LancamentoServico
	err = tx.QueryRow(c, `
		INSERT INTO lancamento_servico (id_cliente, descricao, observacao)
		VALUES ($1, $2, NULLIF($3, ''))
		RETURNING id, id_cliente, descricao, observacao, data_lancamento
	`, payload.IDCliente, payload.Descricao, payload.Observacao).
		Scan(&serv.ID, &serv.IDCliente, &serv.Descricao, &serv.Observacao, &serv.DataLancamento)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao criar lançamento de serviço"})
		return
	}

	var itens []models.LancamentoServicoItem
	for _, it := range payload.Itens {
		// obtém último valor de entrada para o produto
		var precoEntrada float64
		priceErr := tx.QueryRow(c, `
			SELECT COALESCE(em.valor / NULLIF(em.quantidade, 0), 0)
			FROM estoque_movimentacao em
			WHERE em.id_produto = $1 AND em.tipo = 'ENTRADA'
			ORDER BY em.data_movimentacao DESC, em.id DESC
			LIMIT 1
		`, it.IDProduto).Scan(&precoEntrada)
		if priceErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Produto sem valor de entrada cadastrado"})
			return
		}

		var item models.LancamentoServicoItem
		err = tx.QueryRow(c, `
			INSERT INTO lancamento_servico_item (id_lancamento_servico, id_produto, quantidade, valor)
			VALUES ($1, $2, $3, $4)
			RETURNING id, id_lancamento_servico, id_produto, quantidade, valor
		`, serv.ID, it.IDProduto, it.Quantidade, precoEntrada).
			Scan(&item.ID, &item.IDLancamentoServico, &item.IDProduto, &item.Quantidade, &item.Valor)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao inserir item do serviço"})
			return
		}
		itens = append(itens, item)

		// registra saída no histórico
		_, err = tx.Exec(c, `
			INSERT INTO estoque_movimentacao (id_produto, tipo, quantidade, valor, observacao)
			VALUES ($1, 'SAIDA', $2, $3, 'Lançamento de Serviço')
		`, it.IDProduto, it.Quantidade, precoEntrada)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao registrar movimentação de estoque"})
			return
		}

		// garante registro na tabela estoque
		_, err = tx.Exec(c, `
			INSERT INTO estoque (id_produto, quantidade)
			VALUES ($1, 0)
			ON CONFLICT (id_produto) DO NOTHING
		`, it.IDProduto)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao preparar estoque"})
			return
		}

		// bloqueia e verifica saldo atual
		var saldo float64
		err = tx.QueryRow(c, `
			SELECT quantidade
			FROM estoque
			WHERE id_produto = $1
			FOR UPDATE
		`, it.IDProduto).Scan(&saldo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao consultar saldo do produto"})
			return
		}
		if saldo < it.Quantidade {
			// Tenta recalcular saldo a partir do histórico de movimentações
			var saldoCalc float64
			if err := tx.QueryRow(c, `
				SELECT COALESCE(SUM(
					CASE WHEN tipo = 'ENTRADA' THEN quantidade ELSE -quantidade END
				), 0)
				FROM estoque_movimentacao
				WHERE id_produto = $1
			`, it.IDProduto).Scan(&saldoCalc); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao recalcular saldo do produto"})
				return
			}

			_, err = tx.Exec(c, `
				UPDATE estoque
				   SET quantidade = $1,
				       data_atualizacao = CURRENT_TIMESTAMP
				 WHERE id_produto = $2
			`, saldoCalc, it.IDProduto)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ajustar saldo do produto"})
				return
			}

			saldo = saldoCalc
		}
		if saldo < it.Quantidade {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Estoque insuficiente", "saldo": saldo})
			return
		}

		// baixa no estoque com validação
		ct, err := tx.Exec(c, `
			UPDATE estoque
			   SET quantidade = quantidade - $1,
			       data_atualizacao = CURRENT_TIMESTAMP
			 WHERE id_produto = $2
			   AND quantidade >= $1
		`, it.Quantidade, it.IDProduto)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar estoque"})
			return
		}
		if ct.RowsAffected() == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Estoque insuficiente ou produto sem saldo"})
			return
		}
	}

	// registra histórico do cliente
	_, err = tx.Exec(c, `
		INSERT INTO cliente_historico (id_cliente, tipo_evento, descricao)
		VALUES ($1, 'ORDEM_SERVICO', $2)
	`, payload.IDCliente, payload.Descricao)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao registrar histórico do cliente"})
		return
	}

	if err := tx.Commit(c); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao confirmar transação"})
		return
	}

	serv.Itens = itens
	c.JSON(http.StatusCreated, serv)
}

func (h *LancamentoServicoHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var payload lancamentoServicoPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}
	if len(payload.Itens) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Informe ao menos um item"})
		return
	}

	tx, err := h.DB.BeginTx(c, pgx.TxOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao iniciar transação"})
		return
	}
	defer tx.Rollback(c)

	// recupera itens atuais
	rowsOld, err := tx.Query(c, `
		SELECT id_produto, quantidade, valor
		FROM lancamento_servico_item
		WHERE id_lancamento_servico = $1
	`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao carregar itens atuais"})
		return
	}
	var oldItems []struct {
		IDProduto  int64
		Quantidade float64
		Valor      float64
	}
	for rowsOld.Next() {
		var oi struct {
			IDProduto  int64
			Quantidade float64
			Valor      float64
		}
		if err := rowsOld.Scan(&oi.IDProduto, &oi.Quantidade, &oi.Valor); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler itens atuais"})
			return
		}
		oldItems = append(oldItems, oi)
	}
	rowsOld.Close()

	// devolve estoque dos itens antigos
	for _, it := range oldItems {
		_, err = tx.Exec(c, `
			INSERT INTO estoque (id_produto, quantidade)
			VALUES ($1, 0)
			ON CONFLICT (id_produto) DO NOTHING
		`, it.IDProduto)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao preparar estoque antigo"})
			return
		}
		_, err = tx.Exec(c, `
			UPDATE estoque
			   SET quantidade = quantidade + $1,
			       data_atualizacao = CURRENT_TIMESTAMP
			 WHERE id_produto = $2
		`, it.Quantidade, it.IDProduto)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao estornar estoque antigo"})
			return
		}
		_, _ = tx.Exec(c, `
			INSERT INTO estoque_movimentacao (id_produto, tipo, quantidade, valor, observacao)
			VALUES ($1, 'ENTRADA', $2, $3, 'Reversão edição lançamento de serviço')
		`, it.IDProduto, it.Quantidade, it.Valor)
	}

	// atualiza cabeçalho
	_, err = tx.Exec(c, `
		UPDATE lancamento_servico
		   SET id_cliente=$1,
		       descricao=$2,
		       observacao=NULLIF($3,'')
		 WHERE id=$4
	`, payload.IDCliente, payload.Descricao, payload.Observacao, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar cabeçalho"})
		return
	}

	// remove itens antigos
	_, err = tx.Exec(c, `DELETE FROM lancamento_servico_item WHERE id_lancamento_servico=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao limpar itens antigos"})
		return
	}

	var itensNovos []models.LancamentoServicoItem
	for _, it := range payload.Itens {
		var precoEntrada float64
		priceErr := tx.QueryRow(c, `
			SELECT COALESCE(em.valor / NULLIF(em.quantidade, 0), 0)
			FROM estoque_movimentacao em
			WHERE em.id_produto = $1 AND em.tipo = 'ENTRADA'
			ORDER BY em.data_movimentacao DESC, em.id DESC
			LIMIT 1
		`, it.IDProduto).Scan(&precoEntrada)
		if priceErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Produto sem valor de entrada cadastrado"})
			return
		}

		_, err = tx.Exec(c, `
			INSERT INTO estoque (id_produto, quantidade)
			VALUES ($1, 0)
			ON CONFLICT (id_produto) DO NOTHING
		`, it.IDProduto)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao preparar estoque"})
			return
		}

		var saldo float64
		if err := tx.QueryRow(c, `
			SELECT quantidade FROM estoque WHERE id_produto=$1 FOR UPDATE
		`, it.IDProduto).Scan(&saldo); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao consultar saldo do produto"})
			return
		}
		if saldo < it.Quantidade {
			var saldoCalc float64
			if err := tx.QueryRow(c, `
				SELECT COALESCE(SUM(
					CASE WHEN tipo='ENTRADA' THEN quantidade ELSE -quantidade END
				),0)
				FROM estoque_movimentacao
				WHERE id_produto=$1
			`, it.IDProduto).Scan(&saldoCalc); err == nil {
				_, _ = tx.Exec(c, `
					UPDATE estoque
					   SET quantidade=$1,
					       data_atualizacao=CURRENT_TIMESTAMP
					 WHERE id_produto=$2
				`, saldoCalc, it.IDProduto)
				saldo = saldoCalc
			}
		}
		if saldo < it.Quantidade {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Estoque insuficiente", "saldo": saldo})
			return
		}

		var item models.LancamentoServicoItem
		err = tx.QueryRow(c, `
			INSERT INTO lancamento_servico_item (id_lancamento_servico, id_produto, quantidade, valor)
			VALUES ($1, $2, $3, $4)
			RETURNING id, id_lancamento_servico, id_produto, quantidade, valor
		`, id, it.IDProduto, it.Quantidade, precoEntrada).
			Scan(&item.ID, &item.IDLancamentoServico, &item.IDProduto, &item.Quantidade, &item.Valor)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao inserir item do serviço"})
			return
		}
		itensNovos = append(itensNovos, item)

		_, err = tx.Exec(c, `
			INSERT INTO estoque_movimentacao (id_produto, tipo, quantidade, valor, observacao)
			VALUES ($1, 'SAIDA', $2, $3, 'Lançamento de Serviço')
		`, it.IDProduto, it.Quantidade, precoEntrada)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao registrar movimentação de estoque"})
			return
		}

		ct, err := tx.Exec(c, `
			UPDATE estoque
			   SET quantidade = quantidade - $1,
			       data_atualizacao = CURRENT_TIMESTAMP
			 WHERE id_produto = $2
			   AND quantidade >= $1
		`, it.Quantidade, it.IDProduto)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar estoque"})
			return
		}
		if ct.RowsAffected() == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Estoque insuficiente ou produto sem saldo"})
			return
		}
	}

	if err := tx.Commit(c); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao confirmar transação"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": id, "itens": itensNovos})
}

func (h *LancamentoServicoHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	tx, err := h.DB.BeginTx(c, pgx.TxOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao iniciar transação"})
		return
	}
	defer tx.Rollback(c)

	rows, err := tx.Query(c, `
		SELECT id_produto, quantidade, valor
		FROM lancamento_servico_item
		WHERE id_lancamento_servico = $1
	`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao obter itens"})
		return
	}
	var itens []struct {
		IDProduto  int64
		Quantidade float64
		Valor      float64
	}
	for rows.Next() {
		var it struct {
			IDProduto  int64
			Quantidade float64
			Valor      float64
		}
		if err := rows.Scan(&it.IDProduto, &it.Quantidade, &it.Valor); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler itens"})
			return
		}
		itens = append(itens, it)
	}
	rows.Close()

	for _, it := range itens {
		_, err = tx.Exec(c, `
			INSERT INTO estoque (id_produto, quantidade)
			VALUES ($1, 0)
			ON CONFLICT (id_produto) DO NOTHING
		`, it.IDProduto)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao preparar estoque"})
			return
		}
		_, err = tx.Exec(c, `
			UPDATE estoque
			   SET quantidade = quantidade + $1,
			       data_atualizacao = CURRENT_TIMESTAMP
			 WHERE id_produto = $2
		`, it.Quantidade, it.IDProduto)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao estornar estoque"})
			return
		}
		_, _ = tx.Exec(c, `
			INSERT INTO estoque_movimentacao (id_produto, tipo, quantidade, valor, observacao)
			VALUES ($1, 'ENTRADA', $2, $3, 'Reversão lançamento de serviço')
		`, it.IDProduto, it.Quantidade, it.Valor)
	}

	_, err = tx.Exec(c, `DELETE FROM lancamento_servico_item WHERE id_lancamento_servico=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao remover itens"})
		return
	}
	_, err = tx.Exec(c, `DELETE FROM lancamento_servico WHERE id=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao remover serviço"})
		return
	}

	if err := tx.Commit(c); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao confirmar exclusão"})
		return
	}

	c.Status(http.StatusNoContent)
}

