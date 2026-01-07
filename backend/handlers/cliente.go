package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"portal-backend/models"
)

type ClienteHandler struct {
	DB *pgxpool.Pool
}

type clientePayload struct {
	TipoCliente            string   `json:"tipoCliente" binding:"required"`
	NomeRazaoSocial        string   `json:"nomeRazaoSocial" binding:"required"`
	NomeFantasia           *string  `json:"nomeFantasia"`
	CPFCNPJ                string   `json:"cpfCnpj" binding:"required"`
	RGIE                   *string  `json:"rgIe"`
	Ativo                  *bool    `json:"ativo"`
	TelefonePrincipal      *string  `json:"telefonePrincipal"`
	TelefoneSecundario     *string  `json:"telefoneSecundario"`
	Whatsapp               *string  `json:"whatsapp"`
	Email                  *string  `json:"email"`
	CEP                    *string  `json:"cep"`
	Logradouro             *string  `json:"logradouro"`
	Numero                 *string  `json:"numero"`
	Complemento            *string  `json:"complemento"`
	Bairro                 *string  `json:"bairro"`
	Cidade                 *string  `json:"cidade"`
	Estado                 *string  `json:"estado"`
	Observacoes            *string  `json:"observacoes"`
	TipoClienteBorracharia *string  `json:"tipoClienteBorracharia"`
	LimiteCredito          *float64 `json:"limiteCredito"`
	FormaPagamentoPadrao   *string  `json:"formaPagamentoPadrao"`
}

type clienteHistoricoPayload struct {
	TipoEvento string  `json:"tipoEvento" binding:"required"`
	Descricao  *string `json:"descricao"`
}

func (h *ClienteHandler) List(c *gin.Context) {
	nome := strings.TrimSpace(c.Query("nome"))
	empresa := strings.TrimSpace(c.Query("empresa"))

	baseQuery := `
		SELECT id, tipo_cliente, nome_razao_social, nome_fantasia, cpf_cnpj, rg_ie,
		       data_cadastro, ativo, telefone_principal, telefone_secundario, whatsapp, email,
		       cep, logradouro, numero, complemento, bairro, cidade, estado, observacoes,
		       tipo_cliente_borracharia, limite_credito, forma_pagamento_padrao
		  FROM cliente
	`
	var conditions []string
	var args []any

	if nome != "" {
		conditions = append(conditions, `(LOWER(nome_razao_social) LIKE $%d OR LOWER(COALESCE(nome_fantasia,'')) LIKE $%d)`)
		args = append(args, "%"+strings.ToLower(nome)+"%")
	}
	if empresa != "" {
		conditions = append(conditions, `(LOWER(COALESCE(nome_fantasia,'')) LIKE $%d OR LOWER(cpf_cnpj) LIKE $%d)`)
		args = append(args, "%"+strings.ToLower(empresa)+"%")
	}

	query := baseQuery
	if len(conditions) > 0 {
		// replace placeholders with actual positional numbers
		var built []string
		for range conditions {
			argIdx := len(built) + 1
			cond := strings.ReplaceAll(conditions[len(built)], "$%d", "$"+itoa(argIdx))
			built = append(built, cond)
		}
		query += " WHERE " + strings.Join(built, " AND ")
	}
	query += " ORDER BY nome_razao_social"

	rows, err := h.DB.Query(c, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao listar clientes"})
		return
	}
	defer rows.Close()

	var list []models.Cliente
	for rows.Next() {
		var cli models.Cliente
		if err := rows.Scan(
			&cli.ID,
			&cli.TipoCliente,
			&cli.NomeRazaoSocial,
			&cli.NomeFantasia,
			&cli.CPFCNPJ,
			&cli.RGIE,
			&cli.DataCadastro,
			&cli.Ativo,
			&cli.TelefonePrincipal,
			&cli.TelefoneSecundario,
			&cli.Whatsapp,
			&cli.Email,
			&cli.CEP,
			&cli.Logradouro,
			&cli.Numero,
			&cli.Complemento,
			&cli.Bairro,
			&cli.Cidade,
			&cli.Estado,
			&cli.Observacoes,
			&cli.TipoClienteBorracharia,
			&cli.LimiteCredito,
			&cli.FormaPagamentoPadrao,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler cliente"})
			return
		}
		list = append(list, cli)
	}
	c.JSON(http.StatusOK, list)
}

func (h *ClienteHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var cli models.Cliente
	err := h.DB.QueryRow(c, `
		SELECT id, tipo_cliente, nome_razao_social, nome_fantasia, cpf_cnpj, rg_ie,
		       data_cadastro, ativo, telefone_principal, telefone_secundario, whatsapp, email,
		       cep, logradouro, numero, complemento, bairro, cidade, estado, observacoes,
		       tipo_cliente_borracharia, limite_credito, forma_pagamento_padrao
		  FROM cliente
		 WHERE id = $1
	`, id).Scan(
		&cli.ID,
		&cli.TipoCliente,
		&cli.NomeRazaoSocial,
		&cli.NomeFantasia,
		&cli.CPFCNPJ,
		&cli.RGIE,
		&cli.DataCadastro,
		&cli.Ativo,
		&cli.TelefonePrincipal,
		&cli.TelefoneSecundario,
		&cli.Whatsapp,
		&cli.Email,
		&cli.CEP,
		&cli.Logradouro,
		&cli.Numero,
		&cli.Complemento,
		&cli.Bairro,
		&cli.Cidade,
		&cli.Estado,
		&cli.Observacoes,
		&cli.TipoClienteBorracharia,
		&cli.LimiteCredito,
		&cli.FormaPagamentoPadrao,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"message": "Cliente não encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao buscar cliente"})
		return
	}
	c.JSON(http.StatusOK, cli)
}

func (h *ClienteHandler) Create(c *gin.Context) {
	var payload clientePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}
	ativo := true
	if payload.Ativo != nil {
		ativo = *payload.Ativo
	}
	var cli models.Cliente
	err := h.DB.QueryRow(c, `
		INSERT INTO cliente (
			tipo_cliente, nome_razao_social, nome_fantasia, cpf_cnpj, rg_ie, ativo,
			telefone_principal, telefone_secundario, whatsapp, email,
			cep, logradouro, numero, complemento, bairro, cidade, estado,
			observacoes, tipo_cliente_borracharia, limite_credito, forma_pagamento_padrao
		) VALUES (
			$1,$2,$3,$4,$5,$6,
			$7,$8,$9,$10,
			$11,$12,$13,$14,$15,$16,$17,
			$18,$19,$20,$21
		)
		RETURNING id, tipo_cliente, nome_razao_social, nome_fantasia, cpf_cnpj, rg_ie,
		          data_cadastro, ativo, telefone_principal, telefone_secundario, whatsapp, email,
		          cep, logradouro, numero, complemento, bairro, cidade, estado, observacoes,
		          tipo_cliente_borracharia, limite_credito, forma_pagamento_padrao
	`,
		payload.TipoCliente, payload.NomeRazaoSocial, payload.NomeFantasia, payload.CPFCNPJ, payload.RGIE, ativo,
		payload.TelefonePrincipal, payload.TelefoneSecundario, payload.Whatsapp, payload.Email,
		payload.CEP, payload.Logradouro, payload.Numero, payload.Complemento, payload.Bairro, payload.Cidade, payload.Estado,
		payload.Observacoes, payload.TipoClienteBorracharia, payload.LimiteCredito, payload.FormaPagamentoPadrao,
	).Scan(
		&cli.ID,
		&cli.TipoCliente,
		&cli.NomeRazaoSocial,
		&cli.NomeFantasia,
		&cli.CPFCNPJ,
		&cli.RGIE,
		&cli.DataCadastro,
		&cli.Ativo,
		&cli.TelefonePrincipal,
		&cli.TelefoneSecundario,
		&cli.Whatsapp,
		&cli.Email,
		&cli.CEP,
		&cli.Logradouro,
		&cli.Numero,
		&cli.Complemento,
		&cli.Bairro,
		&cli.Cidade,
		&cli.Estado,
		&cli.Observacoes,
		&cli.TipoClienteBorracharia,
		&cli.LimiteCredito,
		&cli.FormaPagamentoPadrao,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao criar cliente"})
		return
	}
	c.JSON(http.StatusCreated, cli)
}

func (h *ClienteHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var payload clientePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}
	ativo := true
	if payload.Ativo != nil {
		ativo = *payload.Ativo
	}
	_, err := h.DB.Exec(c, `
		UPDATE cliente SET
			tipo_cliente=$1,
			nome_razao_social=$2,
			nome_fantasia=$3,
			cpf_cnpj=$4,
			rg_ie=$5,
			ativo=$6,
			telefone_principal=$7,
			telefone_secundario=$8,
			whatsapp=$9,
			email=$10,
			cep=$11,
			logradouro=$12,
			numero=$13,
			complemento=$14,
			bairro=$15,
			cidade=$16,
			estado=$17,
			observacoes=$18,
			tipo_cliente_borracharia=$19,
			limite_credito=$20,
			forma_pagamento_padrao=$21,
			data_cadastro = COALESCE(data_cadastro, CURRENT_TIMESTAMP)
		WHERE id=$22
	`, payload.TipoCliente, payload.NomeRazaoSocial, payload.NomeFantasia, payload.CPFCNPJ, payload.RGIE, ativo,
		payload.TelefonePrincipal, payload.TelefoneSecundario, payload.Whatsapp, payload.Email,
		payload.CEP, payload.Logradouro, payload.Numero, payload.Complemento, payload.Bairro, payload.Cidade, payload.Estado,
		payload.Observacoes, payload.TipoClienteBorracharia, payload.LimiteCredito, payload.FormaPagamentoPadrao, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao atualizar cliente"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ClienteHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	_, err := h.DB.Exec(c, `DELETE FROM cliente WHERE id=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao excluir cliente"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ClienteHandler) ListHistorico(c *gin.Context) {
	id := c.Param("id")
	rows, err := h.DB.Query(c, `
		SELECT id, id_cliente, tipo_evento, descricao, data_evento
		  FROM cliente_historico
		 WHERE id_cliente = $1
		UNION ALL
		SELECT 0 as id, ls.id_cliente, 'ORDEM_SERVICO' as tipo_evento, ls.descricao, ls.data_lancamento
		  FROM lancamento_servico ls
		 WHERE ls.id_cliente = $1
		   AND NOT EXISTS (
		     SELECT 1 FROM cliente_historico ch
		      WHERE ch.id_cliente = ls.id_cliente
		        AND ch.tipo_evento = 'ORDEM_SERVICO'
		        AND ch.descricao = ls.descricao
		        AND ch.data_evento = ls.data_lancamento
		   )
		 ORDER BY data_evento DESC, id DESC
	`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao listar histórico do cliente"})
		return
	}
	defer rows.Close()

	var list []models.ClienteHistorico
	for rows.Next() {
		var hst models.ClienteHistorico
		if err := rows.Scan(&hst.ID, &hst.IDCliente, &hst.TipoEvento, &hst.Descricao, &hst.DataEvento); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao ler histórico"})
			return
		}
		list = append(list, hst)
	}
	c.JSON(http.StatusOK, list)
}

func (h *ClienteHandler) AddHistorico(c *gin.Context) {
	id := c.Param("id")
	var payload clienteHistoricoPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Dados inválidos"})
		return
	}
	var hst models.ClienteHistorico
	err := h.DB.QueryRow(c, `
		INSERT INTO cliente_historico (id_cliente, tipo_evento, descricao)
		VALUES ($1, $2, $3)
		RETURNING id, id_cliente, tipo_evento, descricao, data_evento
	`, id, payload.TipoEvento, payload.Descricao).Scan(
		&hst.ID,
		&hst.IDCliente,
		&hst.TipoEvento,
		&hst.Descricao,
		&hst.DataEvento,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao adicionar histórico"})
		return
	}
	c.JSON(http.StatusCreated, hst)
}

// itoa evita importar strconv só para conversões simples.
func itoa(i int) string {
	if i == 0 {
		return "0"
	}
	var b [20]byte
	pos := len(b)
	n := i
	for n > 0 {
		pos--
		b[pos] = byte('0' + n%10)
		n /= 10
	}
	return string(b[pos:])
}

