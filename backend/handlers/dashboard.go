package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DashboardHandler struct {
	DB *pgxpool.Pool
}

type DashboardCardsResponse struct {
	TotalEstoque              float64 `json:"totalEstoque"`
	TotalEntradasMes          float64 `json:"totalEntradasMes"`
	TotalSaidasMes            float64 `json:"totalSaidasMes"`
	TotalRecorrentesEntradas  float64 `json:"totalRecorrentesEntradas"`
	TotalContasFixas          float64 `json:"totalContasFixas"`
	TotalPagamentosContaFixaMes float64 `json:"totalPagamentosContaFixaMes"`
}

type DashboardChartsResponse struct {
	EvolucaoMensal struct {
		Labels []string  `json:"labels"`
		Entradas []float64 `json:"entradas"`
		Saidas   []float64 `json:"saidas"`
	} `json:"evolucaoMensal"`
	DistribuicaoCategorias struct {
		Labels []string  `json:"labels"`
		Values []float64 `json:"values"`
	} `json:"distribuicaoCategorias"`
	ReceitaDespesa struct {
		Labels []string  `json:"labels"`
		Receita []float64 `json:"receita"`
		Despesa []float64 `json:"despesa"`
	} `json:"receitaDespesa"`
}

// GetCards retorna os dados para os cards do dashboard
func (h *DashboardHandler) GetCards(c *gin.Context) {
	hoje := time.Now()
	anoAtual := hoje.Year()
	mesAtual := int(hoje.Month())

	var response DashboardCardsResponse

	// Total em estoque (soma das movimentações registradas)
	if err := h.DB.QueryRow(c, `
		SELECT COALESCE(SUM(valor), 0)
		FROM estoque_movimentacao
	`).Scan(&response.TotalEstoque); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao calcular total em estoque"})
		return
	}

	// Total de Entradas do Mês
	err := h.DB.QueryRow(c, `
		SELECT COALESCE(SUM(valor), 0)
		FROM lancamento_financeiro
		WHERE tipo = 'E'
			AND EXTRACT(YEAR FROM data_lancamento) = $1
			AND EXTRACT(MONTH FROM data_lancamento) = $2
	`, anoAtual, mesAtual).Scan(&response.TotalEntradasMes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao calcular total de entradas"})
		return
	}

	// Total de Saídas do Mês
	err = h.DB.QueryRow(c, `
		SELECT COALESCE(SUM(valor), 0)
		FROM lancamento_financeiro
		WHERE tipo = 'S'
			AND EXTRACT(YEAR FROM data_lancamento) = $1
			AND EXTRACT(MONTH FROM data_lancamento) = $2
	`, anoAtual, mesAtual).Scan(&response.TotalSaidasMes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao calcular total de saídas"})
		return
	}

	// Total de Recorrentes - Entradas (soma dos valores dos recorrentes ativos)
	err = h.DB.QueryRow(c, `
		SELECT COALESCE(SUM(valor), 0)
		FROM lancamento_recorrente
		WHERE tipo = 'E' AND ativo = TRUE
	`).Scan(&response.TotalRecorrentesEntradas)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao calcular total de recorrentes de entrada"})
		return
	}

	// Total de Contas Fixas (soma dos valores das contas fixas ativas)
	err = h.DB.QueryRow(c, `
		SELECT COALESCE(SUM(valor), 0)
		FROM conta_fixa
		WHERE ativa = TRUE
	`).Scan(&response.TotalContasFixas)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao calcular total de contas fixas"})
		return
	}

	// Total de Pagamentos de Conta Fixa do Mês
	err = h.DB.QueryRow(c, `
		SELECT COALESCE(SUM(valor), 0)
		FROM lancamento_financeiro
		WHERE tipo = 'S'
			AND id_conta_fixa IS NOT NULL
			AND EXTRACT(YEAR FROM data_lancamento) = $1
			AND EXTRACT(MONTH FROM data_lancamento) = $2
	`, anoAtual, mesAtual).Scan(&response.TotalPagamentosContaFixaMes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao calcular total de pagamentos de conta fixa"})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetCharts retorna os dados para os gráficos do dashboard
func (h *DashboardHandler) GetCharts(c *gin.Context) {
	var response DashboardChartsResponse

	// Evolução Mensal (últimos 6 meses)
	hoje := time.Now()
	mesesNomes := []string{"Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"}
	entradas := make([]float64, 6)
	saidas := make([]float64, 6)
	meses := make([]string, 6)

	for i := 0; i < 6; i++ {
		mesRef := hoje.AddDate(0, -5+i, 0)
		anoRef := mesRef.Year()
		mesNum := int(mesRef.Month())
		meses[i] = mesesNomes[mesNum-1]

		var ent float64
		var sai float64

		// Entradas do mês
		h.DB.QueryRow(c, `
			SELECT COALESCE(SUM(valor), 0)
			FROM lancamento_financeiro
			WHERE tipo = 'E'
				AND EXTRACT(YEAR FROM data_lancamento) = $1
				AND EXTRACT(MONTH FROM data_lancamento) = $2
		`, anoRef, mesNum).Scan(&ent)

		// Saídas do mês
		h.DB.QueryRow(c, `
			SELECT COALESCE(SUM(valor), 0)
			FROM lancamento_financeiro
			WHERE tipo = 'S'
				AND EXTRACT(YEAR FROM data_lancamento) = $1
				AND EXTRACT(MONTH FROM data_lancamento) = $2
		`, anoRef, mesNum).Scan(&sai)

		entradas[i] = ent
		saidas[i] = sai
	}

	if len(meses) == 0 {
		meses = []string{"Jan", "Fev", "Mar", "Abr", "Mai", "Jun"}
		entradas = []float64{0, 0, 0, 0, 0, 0}
		saidas = []float64{0, 0, 0, 0, 0, 0}
	}
	response.EvolucaoMensal.Labels = meses
	response.EvolucaoMensal.Entradas = entradas
	response.EvolucaoMensal.Saidas = saidas

	// Distribuição por Categoria (mês atual)
	rows, err := h.DB.Query(c, `
		SELECT 
			cf.nome,
			COALESCE(SUM(lf.valor), 0) as total
		FROM categoria_financeira cf
		LEFT JOIN lancamento_financeiro lf ON lf.id_categoria = cf.id_categoria
			AND EXTRACT(YEAR FROM lf.data_lancamento) = EXTRACT(YEAR FROM CURRENT_DATE)
			AND EXTRACT(MONTH FROM lf.data_lancamento) = EXTRACT(MONTH FROM CURRENT_DATE)
		WHERE cf.ativo = TRUE
		GROUP BY cf.id_categoria, cf.nome
		HAVING COALESCE(SUM(lf.valor), 0) > 0
		ORDER BY total DESC
		LIMIT 10
	`)
	if err == nil {
		defer rows.Close()
		var labels []string
		var values []float64
		for rows.Next() {
			var nome string
			var total float64
			if err := rows.Scan(&nome, &total); err == nil {
				labels = append(labels, nome)
				values = append(values, total)
			}
		}
		response.DistribuicaoCategorias.Labels = labels
		response.DistribuicaoCategorias.Values = values
	}

	// Receita x Despesa (últimos 6 meses) - mesmo dado da evolução mensal
	response.ReceitaDespesa.Labels = meses
	response.ReceitaDespesa.Receita = entradas
	response.ReceitaDespesa.Despesa = saidas

	// Garantir que sempre há arrays válidos
	if len(response.DistribuicaoCategorias.Labels) == 0 {
		response.DistribuicaoCategorias.Labels = []string{"Sem dados"}
		response.DistribuicaoCategorias.Values = []float64{1}
	}

	c.JSON(http.StatusOK, response)
}

type LancamentoSaida struct {
	DataLancamento string  `json:"dataLancamento"`
	Descricao      string  `json:"descricao"`
	Valor          float64 `json:"valor"`
}

// GetLancamentosSaidasMes retorna os lançamentos de saída do mês atual
func (h *DashboardHandler) GetLancamentosSaidasMes(c *gin.Context) {
	rows, err := h.DB.Query(c, `
		SELECT
			lf.data_lancamento,
			lf.descricao,
			lf.valor
		FROM lancamento_financeiro lf
		WHERE lf.tipo = 'S'
			AND DATE_TRUNC('month', lf.data_lancamento) = DATE_TRUNC('month', CURRENT_DATE)
		ORDER BY lf.data_lancamento DESC
		LIMIT 20
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Erro ao buscar lançamentos de saída"})
		return
	}
	defer rows.Close()

	var lancamentos []LancamentoSaida
	for rows.Next() {
		var l LancamentoSaida
		var dataLancamento time.Time
		if err := rows.Scan(&dataLancamento, &l.Descricao, &l.Valor); err != nil {
			continue
		}
		l.DataLancamento = dataLancamento.Format("2006-01-02")
		lancamentos = append(lancamentos, l)
	}

	c.JSON(http.StatusOK, lancamentos)
}

