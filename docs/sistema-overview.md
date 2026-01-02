# Visão geral do sistema de finanças

Documento gerado a partir do código inspecionado. Abrange APIs, consultas e telas mapeadas no frontend/backend atual.

## APIs (backend Gin)

- `GET /dashboard/cards`
  - Retorna totais do mês: entradas, saídas, recorrentes de entrada, contas fixas, pagamentos de contas fixas.
- `GET /dashboard/charts`
  - Retorna evoluções (últimos 6 meses), distribuição por categoria (mês atual) e série receita x despesa.
- `GET /dashboard/lancamentos-saidas-mes`
  - Lista últimas saídas do mês (descrição, valor, data).
- `GET /lancamentos`
  - Lista geral de lançamentos financeiros.
- `GET /lancamentos/filtro?dataInicio&dataFim&tipo&idContaFixa&idFonteRenda`
  - Filtro por intervalo, tipo (`E`/`S`), conta fixa, fonte de renda.
- `POST /lancamentos`
  - Cria lançamento (campos principais: data, descrição, tipo, valor, idCategoria; opcionais: idContaFixa, idFonteRenda, idFormaPagamento, observação).
- `PUT /lancamentos/:id`
  - Atualiza lançamento.
- `DELETE /lancamentos/:id`
  - Remove lançamento.
- `GET /contas-fixas`
  - Lista contas fixas (nome, descrição, categoria, valor, dia de vencimento, status).
- `POST /contas-fixas`
  - Cria conta fixa.
- `PUT /contas-fixas/:id`
  - Atualiza conta fixa.
- `DELETE /contas-fixas/:id`
  - Remove conta fixa.
- `GET /contas-fixas/total`
  - Totalizador de contas fixas.

## Consultas / regras observadas

- Dashboard:
  - Cards somam lançamentos do mês corrente por tipo e categoria (Go handler `dashboard.go`).
  - Evolução mensal: soma de entradas/saídas para cada um dos últimos 6 meses.
  - Distribuição por categoria (mês atual) com limite 10.
  - Receita x Despesa reaproveita as séries da evolução.
- Saídas do mês:
  - `SELECT data_lancamento, descricao, valor FROM lancamento_financeiro WHERE tipo='S' AND date_trunc('month', data_lancamento)=date_trunc('month', current_date) ORDER BY data_lancamento DESC LIMIT 20`
- Contas fixas:
  - Tabela `conta_fixa` com `dia_vencimento` (1–31). Usada para marcar o calendário pelo dia, independentemente do mês/ano.
- Exemplo de consulta bruta (pedida):  
  `SELECT cf.descricao, cf.dia_vencimento FROM conta_fixa cf;`

## Telas (frontend Angular + PrimeNG)

- **Dashboard (`features/dashboard`)**
  - Cards de indicadores do mês.
  - Gráficos:
    - Linha: Entradas x Saídas (6 meses).
    - Pizza/Doughnut: Distribuição por categoria (mês atual).
    - Barras: Receita x Despesa (6 meses).
  - Notificações: últimas saídas do mês com tempo relativo e valor formatado.
  - Calendário:
    - Marcação por dia do mês atual:
      - Entrada (laranja), Saída (azul), Ambas (gradiente), Conta Fixa (amarelo), Hoje (verde).
      - Contas fixas são renderizadas pelo `diaVencimento` sempre no mês/ano atuais.
      - Demais lançamentos filtrados para mês/ano atuais.
    - Clique no dia abre modal com listas separadas de Entradas e Saídas (descrição + valor).
- **Contas Fixas (`features/cadastros/contas-fixas`)**
  - CRUD de contas fixas (nome, descrição, categoria, valor, dia de vencimento, ativa).
  - Tabela com seleção e ações (cadastrar, editar, excluir, atualizar).
- **Pagamento de Conta Fixa (`features/lancamentos/pagamento-conta-fixa`)**
  - Lista lançamentos do tipo saída vinculados a contas fixas.
  - Formulário de pagamento: data, descrição, valor, categoria, conta fixa, forma de pagamento, observação.
- **Lançamentos (genérico)**
  - Serviço `lancamento-financeiro.service` fornece listagem, filtro por intervalo/tipo/conta/fonte, criação, edição, exclusão.

## Cores e UI

- Paleta principal: Azul `#0ea5e9`, Laranja `#f59e0b`; Hoje (verde) `#22c55e`; Conta Fixa (amarelo) `#facc15`.
- Componentes PrimeNG: `p-chart`, `p-progressbar`, `p-button`, tabelas, diálogos.
- Formatação monetária em `pt-BR`.

## Notas de uso

- O dashboard recarrega dados ao entrar/voltar para `/dashboard`.
- Calendário usa apenas dados do mês atual e dias de vencimento de contas fixas para sinalização recorrente.
- Modal do calendário usa os mesmos itens carregados do mês para exibir detalhes.

