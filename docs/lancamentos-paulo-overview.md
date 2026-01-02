# Visão Geral Atual (Telas e Consultas)

Documento baseado no estado atual do backend e frontend (menus e rotas ativos).

## Autenticação
- Tela: Login  
- Base: `users`  
- Login: compara `password_plain`; nome buscado em `users` por `login`.  
- Perfil: `GET /api/auth/profile` → `SELECT id::text, name, login, email FROM users WHERE id=$1`.

## Dashboard
Endpoints:
- `GET /api/dashboard/cards`
  - Entradas mês: `SUM(valor)` de `lancamento_financeiro` onde `tipo='E'` no mês/ano atual.
  - Saídas mês: idem `tipo='S'`.
  - Recorrentes entradas: `SUM(valor)` em `lancamento_recorrente` `tipo='E' AND ativo=TRUE`.
  - Total contas fixas: `SUM(valor)` em `conta_fixa` `ativa=TRUE`.
  - Pagamentos conta fixa no mês: `SUM(valor)` em `lancamento_financeiro` `tipo='S' AND id_conta_fixa IS NOT NULL` no mês/ano.
- `GET /api/dashboard/charts`
  - Evolução últimos 6 meses: `SUM(valor)` por mês (entradas `tipo='E'`, saídas `tipo='S'`) em `lancamento_financeiro`.
  - Distribuição categorias (mês atual): `SUM(lf.valor)` agrupado por `categoria_financeira` ativa, com join em `lancamento_financeiro` no mês.
  - Receita x Despesa: reuso das somas de evolução.
- `GET /api/dashboard/lancamentos-saidas-mes`
  - Saídas do mês atual em `lancamento_financeiro` `tipo='S'`, ordenadas por data desc, limite 20.

## Menu (Shell) e Rotas (frontend)
- Dashboard → `/dashboard`
- Cadastros  
  - Categorias Financeiras → `/cadastros/categorias-financeiras`  
  - Contas Fixas → `/cadastros/contas-fixas`  
  - Fontes de Renda → `/cadastros/fontes-renda`  
  - Formas de Pagamento → `/cadastros/formas-pagamento`
- Lançamentos (base `lancamento_financeiro`)  
  - Receita - Salário → `/lancamentos/receita/salario`  
  - Receita - Renda Extra → `/lancamentos/receita/renda-extra`  
  - Despesa - Contas do Dia → `/lancamentos/despesa/contas-dia`  
  - **Despesa / Conta a Pagar** → `/lancamentos/despesa/contas-a-pagar`  
  - Despesa - Extras → `/lancamentos/despesa/despesas-extras`  
  - Pagamento Conta Fixa → `/lancamentos/pagamento-conta-fixa`  
  - Recorrentes - Entradas → `/lancamentos/recorrentes/entradas`  
  - Recorrentes - Saídas → `/lancamentos/recorrentes/saidas`
- Mercado  
  - Lançamento - Mercado → `/mercado/lancamento`  
  - Anotações - Mercado → `/mercado/anotacoes`
- Relatórios  
  - Receita - Salário → `/relatorios/receita-salario`  
  - Receita - Renda Extra → `/relatorios/receita-renda-extra`  
  - Despesa - Contas do Dia → `/relatorios/despesa-contas-dia`  
  - Despesa - Extras → `/relatorios/despesa-extras`  
  - Pagamento Conta Fixa → `/relatorios/pagamento-conta-fixa`  
  - Recorrentes - Entradas → `/relatorios/recorrentes-entradas`  
  - Recorrentes - Saídas → `/relatorios/recorrentes-saidas`

## Endpoints / Consultas por módulo

### Categorias Financeiras (`categoria_financeira`)
- Listar: `SELECT id_categoria, nome, tipo, descricao, ativo, criado_em, atualizado_em FROM categoria_financeira ORDER BY id_categoria DESC`
- Get por ID: `... WHERE id_categoria=$1`
- Insert/Update/Delete conforme handler (`financial_categories.go`).

### Contas Fixas (`conta_fixa`)
- Listar: `SELECT id_conta_fixa, nome, descricao, id_categoria, valor, dia_vencimento, ativa, criado_em, atualizado_em FROM conta_fixa ORDER BY id_conta_fixa DESC`
- Total: `SELECT COALESCE(SUM(valor),0) FROM conta_fixa`
- CRUD completo no handler `fixed_accounts.go`.

### Fontes de Renda (`fonte_renda`)
- Listar: `SELECT id_fonte_renda, nome, descricao, valor_padrao, recorrente, ativa, criado_em, atualizado_em FROM fonte_renda ORDER BY id_fonte_renda DESC`
- Delete trata FK: mensagem quando há lançamentos vinculados.

### Formas de Pagamento (`forma_pagamento`)
- Listar: `SELECT id_forma_pagamento, nome, descricao, tipo, permite_parcelamento, ativa, criado_em, atualizado_em FROM forma_pagamento ORDER BY id_forma_pagamento DESC`

### Lançamentos Financeiros (`lancamento_financeiro`)
- Campos adicionais: `data_vencimento` e `data_pagamento` (opcionais).
- Listagem geral (join em categoria/fonte/conta fixa/forma pagto, com status):
  ```sql
  SELECT lf.id_lancamento, lf.data_lancamento, lf.data_vencimento, lf.data_pagamento,
         lf.descricao, lf.tipo, lf.valor, lf.id_categoria, lf.id_fonte_renda, lf.id_conta_fixa, lf.id_forma_pagamento,
         COALESCE(lf.observacao,''), lf.criado_em, lf.atualizado_em,
         c.nome AS categoria, COALESCE(fr.nome,''), COALESCE(cf.nome,''), COALESCE(fp.nome,''),
         CASE WHEN lf.data_pagamento IS NOT NULL THEN 'PAGA' ELSE 'EM ABERTO' END AS status_pagamento
  FROM lancamento_financeiro lf
  JOIN categoria_financeira c ON c.id_categoria = lf.id_categoria
  LEFT JOIN fonte_renda fr ON fr.id_fonte_renda = lf.id_fonte_renda
  LEFT JOIN conta_fixa cf ON cf.id_conta_fixa = lf.id_conta_fixa
  LEFT JOIN forma_pagamento fp ON fp.id_forma_pagamento = lf.id_forma_pagamento
  ORDER BY lf.data_lancamento DESC, lf.id_lancamento DESC;
  ```
- Filtro por período/tipo/conta fixa/fonte: `GET /api/lancamentos/filtro` monta query dinâmica com condições opcionais.
- Contas a Pagar (despesa unificada): `GET /api/lancamentos/contas-a-pagar`, com query:
  ```sql
  SELECT lf.id_lancamento, lf.descricao, lf.valor, lf.data_pagamento, lf.data_vencimento,
         c.nome AS categoria, cf.nome AS conta_fixa, fp.nome AS forma_pagamento,
         lf.id_conta_fixa, COALESCE(lf.observacao,''), lf.criado_em,
         CASE WHEN lf.data_pagamento IS NOT NULL THEN 'PAGA' ELSE 'EM ABERTO' END AS status_pagamento
  FROM lancamento_financeiro lf
  JOIN categoria_financeira c ON c.id_categoria = lf.id_categoria
  LEFT JOIN conta_fixa cf ON cf.id_conta_fixa = lf.id_conta_fixa
  LEFT JOIN forma_pagamento fp ON fp.id_forma_pagamento = lf.id_forma_pagamento
  WHERE lf.tipo = 'S'
  ORDER BY status_pagamento DESC, cf.dia_vencimento NULLS LAST, lf.data_pagamento DESC NULLS LAST, lf.id_lancamento DESC;
  ```
- CRUD completo (Create/Update aceita datas opcionais; tipo segue `E`/`S`).

### Lançamentos Recorrentes (`lancamento_recorrente`)
- Entradas ativas: `SELECT ... FROM lancamento_recorrente WHERE tipo='E' AND ativo=TRUE ORDER BY descricao`
- Saídas ativas: idem com `tipo='S'`.
- CRUD completo, com campos: tipo, valor, categoria, fonte_renda opcional, forma_pagamento opcional, periodicidade (MENSAL/ANUAL), dia_execucao, data_inicio, data_fim, ativo, observacao.
- Geração automática (chamada no login): insere em `lancamento_financeiro` com `gerado_recorrente=TRUE` se ainda não gerado no mês/ano corrente.

### Lista de Compras (`lista_compras`)
- Listar: `SELECT id, nome, data FROM lista_compras ORDER BY id DESC`
- CRUD simples.

### Itens da Lista de Compras (`item_lista_compras`)
- Listar com filtro opcional `listaId`: `SELECT id, lista_compras_id, descricao, valor FROM item_lista_compras WHERE lista_compras_id=$1 ORDER BY id DESC`
- Sem filtro: lista todos ordenados desc.
- CRUD simples.

### Produtos (demo) (`products`)
- Listar: `SELECT id, name, sku, price, quantity, created_at, updated_at FROM products ORDER BY id DESC`
- CRUD completo.

## Frontend (rotas ativas)
- Vide seção “Menu e Rotas”: todas as rotas mapeadas em `app.routes.ts` refletem apenas as telas acima (não há rotas para a base `lancamentos_paulo`).

## Observações de UX/Mensagens
- Exclusão de fonte de renda com FK ativa retorna mensagem explícita indicando uso em lançamentos (Receitas/Despesas/Recorrentes).
- Toasts já usam detalhe em verde escuro (#0f5132) para contraste.



