# PROMPT: Sistema de Gestão Financeira - Documentação Completa

## CONTEXTO DO PROJETO

Este é um sistema de gestão financeira pessoal/familiar desenvolvido em **Angular (frontend)** e **Go (backend)** com banco de dados **PostgreSQL**. O sistema permite controle completo de receitas, despesas, contas fixas, lançamentos recorrentes e listas de compras do mercado.

---

## ARQUITETURA TÉCNICA

### Stack Tecnológica:
- **Frontend**: Angular 17+ (Standalone Components), PrimeNG, TypeScript
- **Backend**: Go (Gin Framework), PostgreSQL
- **Autenticação**: JWT
- **API**: RESTful

### Estrutura de Pastas:
```
frontend/src/app/
├── features/          # Componentes de telas
├── services/          # Serviços HTTP
├── models/            # Interfaces TypeScript
├── core/              # Auth, Guards, Services core
└── environments/      # Configurações

backend/
├── handlers/          # Handlers HTTP (controllers)
├── models/            # Modelos Go
├── db/                # Schema SQL
├── middleware/        # Middlewares (Auth)
└── config/            # Configurações
```

---

## ESTRUTURA DO MENU E NAVEGAÇÃO

O sistema possui um menu lateral (sidebar) com a seguinte estrutura:

### 📊 **DASHBOARD** (Menu Principal)
- **Rota**: `/dashboard`
- **Ícone**: `pi pi-home`
- **Descrição**: Tela principal com visão geral dos indicadores financeiros
- **Funcionalidades**:
  - Cards com métricas principais:
    - Pagamento Conta Fixa (mês atual)
    - Total de Contas Fixas
    - Recorrentes - Entradas (total)
    - Recorrentes - Saídas (total)
    - Métricas A/B (placeholder)
  - Gráficos de distribuição (Pie Chart)
  - Gráfico de evolução (Line Chart)
  - Barra de progresso de processos
  - Notificações do sistema

---

### 📋 **CADASTROS** (Menu com Submenu)

Menu expandível contendo os cadastros base do sistema:

#### 1. **Categorias Financeiras**
- **Rota**: `/cadastros/categorias-financeiras`
- **Ícone**: `pi pi-list`
- **Descrição**: Cadastro de categorias para classificar receitas e despesas
- **Campos**:
  - Nome (obrigatório, min 3 caracteres)
  - Tipo: 'E' (Entrada) ou 'S' (Saída) - obrigatório
  - Descrição (opcional)
  - Ativo (boolean, default: true)
- **Funcionalidades**: CRUD completo (Cadastrar, Editar, Excluir, Atualizar)
- **Tabela no BD**: `categoria_financeira`
  - Campos: `id_categoria`, `nome`, `tipo`, `descricao`, `ativo`, `criado_em`, `atualizado_em`

#### 2. **Contas Fixas**
- **Rota**: `/cadastros/contas-fixas`
- **Ícone**: `pi pi-briefcase`
- **Descrição**: Cadastro de contas que se repetem mensalmente (ex: aluguel, energia, internet)
- **Campos**:
  - Nome (obrigatório)
  - Descrição (opcional)
  - Categoria (FK para categoria_financeira, obrigatório)
  - Valor (obrigatório, > 0)
  - Dia de Vencimento (1-31, obrigatório)
  - Ativa (boolean, default: true)
- **Funcionalidades**: CRUD completo
- **Tabela no BD**: `conta_fixa`
  - Campos: `id_conta_fixa`, `nome`, `descricao`, `id_categoria`, `valor`, `dia_vencimento`, `ativa`, `criado_em`, `atualizado_em`
  - Relacionamento: FK com `categoria_financeira`

#### 3. **Fontes de Renda**
- **Rota**: `/cadastros/fontes-renda`
- **Ícone**: `pi pi-wallet`
- **Descrição**: Cadastro das fontes de onde vem a renda (ex: Salário CLT, Freelance, Aluguel)
- **Campos**:
  - Nome (obrigatório)
  - Descrição (opcional)
  - Valor Padrão (opcional, >= 0)
  - Recorrente (boolean, default: false)
  - Ativa (boolean, default: true)
- **Funcionalidades**: CRUD completo
- **Tabela no BD**: `fonte_renda`
  - Campos: `id_fonte_renda`, `nome`, `descricao`, `valor_padrao`, `recorrente`, `ativa`, `criado_em`, `atualizado_em`

#### 4. **Formas de Pagamento**
- **Rota**: `/cadastros/formas-pagamento`
- **Ícone**: `pi pi-credit-card`
- **Descrição**: Cadastro das formas de pagamento disponíveis (ex: Dinheiro, Cartão Débito, Cartão Crédito, PIX, Transferência)
- **Campos**:
  - Nome (obrigatório)
  - Descrição (opcional)
  - Tipo: 'D' (Débito), 'C' (Crédito), 'P' (PIX), 'T' (Transferência) - obrigatório
  - Permite Parcelamento (boolean, default: false)
  - Ativa (boolean, default: true)
- **Funcionalidades**: CRUD completo
- **Tabela no BD**: `forma_pagamento`
  - Campos: `id_forma_pagamento`, `nome`, `descricao`, `tipo`, `permite_parcelamento`, `ativa`, `criado_em`, `atualizado_em`

---

### 💰 **LANÇAMENTOS** (Menu com Submenu)

Menu expandível contendo todas as telas de lançamento financeiro:

#### 1. **Receita - Salário**
- **Rota**: `/lancamentos/receita/salario`
- **Ícone**: `pi pi-dollar`
- **Descrição**: Tela para lançar receitas do tipo salário
- **Campos do Formulário**:
  - Data do Lançamento (obrigatório, date)
  - Descrição (obrigatório, min 3 caracteres)
  - Tipo: 'E' (fixo, sempre Entrada)
  - Valor (obrigatório, > 0)
  - Categoria (obrigatório, dropdown com categorias tipo 'E')
  - Fonte de Renda (opcional, dropdown)
  - Forma de Pagamento (opcional, dropdown)
  - Conta Fixa (opcional, dropdown)
  - Observação (opcional)
- **Funcionalidades**: 
  - CRUD completo
  - Filtro por descrição
  - Grid com todos os lançamentos de entrada (tipo 'E')
  - Botão Atualizar para recarregar dados
- **Tabela no BD**: `lancamento_financeiro` (filtrado por tipo='E')

#### 2. **Receita - Renda Extra**
- **Rota**: `/lancamentos/receita/renda-extra`
- **Ícone**: `pi pi-dollar`
- **Descrição**: Tela para lançar receitas extras (freelances, vendas, etc)
- **Campos**: Mesmos do Receita - Salário
- **Funcionalidades**: CRUD completo, filtro, grid, atualizar
- **Tabela no BD**: `lancamento_financeiro` (filtrado por tipo='E')

#### 3. **Despesa - Contas do Dia**
- **Rota**: `/lancamentos/despesa/contas-dia`
- **Ícone**: `pi pi-book`
- **Descrição**: Tela para lançar despesas do dia a dia (compras, transporte, alimentação)
- **Campos do Formulário**:
  - Data do Lançamento (obrigatório)
  - Descrição (obrigatório)
  - Tipo: 'S' (fixo, sempre Saída)
  - Valor (obrigatório, > 0)
  - Categoria (obrigatório, dropdown com categorias tipo 'S')
  - Forma de Pagamento (opcional)
  - Observação (opcional)
- **Funcionalidades**: CRUD completo, filtro, grid, atualizar
- **Tabela no BD**: `lancamento_financeiro` (filtrado por tipo='S')

#### 4. **Despesa - Extras**
- **Rota**: `/lancamentos/despesa/despesas-extras`
- **Ícone**: `pi pi-book`
- **Descrição**: Tela para lançar despesas extras/eventuais
- **Campos**: Mesmos do Despesa - Contas do Dia
- **Funcionalidades**: CRUD completo, filtro, grid, atualizar
- **Tabela no BD**: `lancamento_financeiro` (filtrado por tipo='S')

#### 5. **Pagamento Conta Fixa**
- **Rota**: `/lancamentos/pagamento-conta-fixa`
- **Ícone**: `pi pi-credit-card`
- **Descrição**: Tela para registrar o pagamento de uma conta fixa (vincula o lançamento à conta fixa)
- **Campos do Formulário**:
  - Data do Lançamento (obrigatório)
  - Descrição (obrigatório)
  - Tipo: 'S' (fixo, sempre Saída)
  - Valor (obrigatório, > 0)
  - Categoria (obrigatório)
  - Conta Fixa (obrigatório, dropdown com contas fixas ativas)
  - Forma de Pagamento (opcional)
  - Observação (opcional)
- **Funcionalidades**: CRUD completo, filtro, grid, atualizar
- **Tabela no BD**: `lancamento_financeiro` (filtrado por tipo='S' e id_conta_fixa IS NOT NULL)

#### 6. **Recorrentes - Entradas** ⭐ (CORRIGIDO - MODELO INDEPENDENTE)
- **Rota**: `/lancamentos/recorrentes/entradas`
- **Ícone**: `pi pi-refresh`
- **Descrição**: Tela para gerenciar lançamentos recorrentes de entrada (receitas que se repetem)
- **Funcionalidades**:
  - Visualização de lançamentos recorrentes de entrada ativos
  - CRUD completo de lançamentos recorrentes
  - Filtro por descrição
  - Botão Atualizar
- **Campos do Formulário** (CORRIGIDO):
  - **Descrição** (obrigatório, min 3 caracteres)
  - **Valor** (obrigatório, > 0)
  - **Categoria** (obrigatório, dropdown com categorias tipo 'E')
  - Fonte de Renda (opcional, dropdown)
  - Forma de Pagamento (opcional, dropdown)
  - **Periodicidade**: 'MENSAL' ou 'ANUAL' (obrigatório)
  - **Dia de Execução**: 1-31 (obrigatório) ⭐ CRÍTICO
  - **Data Início** (obrigatório, date)
  - Data Fim (opcional, date)
  - **Status**: Ativo/Inativo (boolean, obrigatório)
  - Observação (opcional)
- **Tabela no BD**: `lancamento_recorrente`
  - Query: `SELECT * FROM lancamento_recorrente WHERE tipo='E' AND ativo=TRUE`
  - **Não depende mais de `lancamento_financeiro`** - é modelo independente
- **API Endpoints**:
  - `GET /api/lancamentos-recorrentes/entradas` - Lista recorrentes de entrada
  - `POST /api/lancamentos-recorrentes` - Cria novo recorrente
  - `PUT /api/lancamentos-recorrentes/:id` - Atualiza recorrente
  - `DELETE /api/lancamentos-recorrentes/:id` - Exclui recorrente
  - `GerarLancamentosAutomaticos()` - Método interno chamado ao login

#### 7. **Recorrentes - Saídas** ⚠️ (PENDENTE)
- **Rota**: `/lancamentos/recorrentes/saidas`
- **Ícone**: `pi pi-refresh`
- **Descrição**: Tela para gerenciar lançamentos recorrentes de saída (despesas que se repetem)
- **Status**: Atualmente mostra apenas um placeholder
- **Necessário**: Implementar igual ao Recorrentes - Entradas, mas filtrando tipo='S'
- **API Endpoint**: `GET /api/lancamentos-recorrentes/saidas` (já existe no backend)

---

### 🛒 **MERCADO** (Menu com Submenu)

Menu expandível para gestão de compras do mercado:

#### 1. **Lançamento - Mercado**
- **Rota**: `/mercado/lancamento`
- **Ícone**: `pi pi-dollar`
- **Descrição**: Tela para lançar despesas de mercado vinculadas a uma lista de compras
- **Funcionalidades**:
  - Seleção de lista de compras (dropdown)
  - Grid com itens da lista selecionada
  - CRUD de itens da lista
  - Filtro por descrição
  - Botão Atualizar
- **Campos do Formulário (Item)**:
  - Descrição (obrigatório)
  - Valor (opcional, >= 0)
- **Tabelas no BD**:
  - `lista_compras`: `id`, `nome`, `data`
  - `item_lista_compras`: `id`, `lista_compras_id` (FK), `descricao`, `valor`
- **API Endpoints**:
  - `GET /api/lista-compras` - Lista todas as listas
  - `GET /api/item-lista-compras?listaId=X` - Lista itens de uma lista
  - CRUD completo para ambas as entidades

#### 2. **Anotações - Mercado**
- **Rota**: `/mercado/anotacoes`
- **Ícone**: `pi pi-list`
- **Descrição**: Tela para criar e gerenciar listas de compras do mercado
- **Funcionalidades**:
  - CRUD de listas de compras
  - CRUD de itens dentro de cada lista
  - Marcar itens como completos
  - Estatísticas: Total de itens, Itens completos, Valor total
  - Visualização por lista selecionada
- **Campos**:
  - Lista: Nome (obrigatório)
  - Item: Descrição (obrigatório), Valor (opcional)
- **Tabelas no BD**: Mesmas do Lançamento - Mercado

---

## ESTRUTURA DO BANCO DE DADOS

### Tabelas Principais:

#### 1. **users**
```sql
- id (SERIAL PRIMARY KEY)
- name (TEXT NOT NULL)
- login (TEXT UNIQUE NOT NULL)
- email (TEXT UNIQUE)
- password_plain (TEXT NOT NULL)
- created_at (TIMESTAMP)
```

#### 2. **categoria_financeira**
```sql
- id_categoria (SERIAL PRIMARY KEY)
- nome (VARCHAR(100) NOT NULL)
- tipo (CHAR(1) CHECK IN ('E','S'))
- descricao (VARCHAR(255))
- ativo (BOOLEAN DEFAULT TRUE)
- criado_em (TIMESTAMP)
- atualizado_em (TIMESTAMP)
```

#### 3. **conta_fixa**
```sql
- id_conta_fixa (SERIAL PRIMARY KEY)
- nome (VARCHAR(100) NOT NULL)
- descricao (VARCHAR(255))
- id_categoria (INT FK -> categoria_financeira)
- valor (NUMERIC(12,2) CHECK > 0)
- dia_vencimento (INT CHECK 1-31)
- ativa (BOOLEAN DEFAULT TRUE)
- criado_em (TIMESTAMP)
- atualizado_em (TIMESTAMP)
```

#### 4. **fonte_renda**
```sql
- id_fonte_renda (SERIAL PRIMARY KEY)
- nome (VARCHAR(100) NOT NULL)
- descricao (VARCHAR(255))
- valor_padrao (NUMERIC(12,2) CHECK >= 0)
- recorrente (BOOLEAN DEFAULT FALSE)
- ativa (BOOLEAN DEFAULT TRUE)
- criado_em (TIMESTAMP)
- atualizado_em (TIMESTAMP)
```

#### 5. **forma_pagamento**
```sql
- id_forma_pagamento (SERIAL PRIMARY KEY)
- nome (VARCHAR(100) NOT NULL)
- descricao (VARCHAR(255))
- tipo (CHAR(1) CHECK IN ('D','C','P','T'))
  -- D = Débito, C = Crédito, P = PIX, T = Transferência
- permite_parcelamento (BOOLEAN DEFAULT FALSE)
- ativa (BOOLEAN DEFAULT TRUE)
- criado_em (TIMESTAMP)
- atualizado_em (TIMESTAMP)
```

#### 6. **lancamento_financeiro** (Tabela Central)
```sql
- id_lancamento (SERIAL PRIMARY KEY)
- data_lancamento (DATE NOT NULL)
- descricao (VARCHAR(150) NOT NULL)
- tipo (CHAR(1) CHECK IN ('E','S'))
  -- E = Entrada (Receita), S = Saída (Despesa)
- valor (NUMERIC(12,2) CHECK > 0)
- id_categoria (INT FK -> categoria_financeira, NOT NULL)
- id_fonte_renda (INT FK -> fonte_renda, NULLABLE)
- id_conta_fixa (INT FK -> conta_fixa, NULLABLE)
- id_forma_pagamento (INT FK -> forma_pagamento, NULLABLE)
- observacao (VARCHAR(255))
- gerado_recorrente (BOOLEAN NOT NULL DEFAULT FALSE) ⭐ NOVO
  -- Indica se o lançamento foi gerado automaticamente por um recorrente
- criado_em (TIMESTAMP)
- atualizado_em (TIMESTAMP)
```

#### 7. **lancamento_recorrente** ⭐ (CORRIGIDO - MODELO INDEPENDENTE)
```sql
- id_recorrente (SERIAL PRIMARY KEY)
- tipo (CHAR(1) NOT NULL CHECK IN ('E','S'))
  -- E = Entrada, S = Saída
- descricao (VARCHAR(150) NOT NULL)
- valor (NUMERIC(12,2) NOT NULL CHECK > 0)
- id_categoria (INT FK -> categoria_financeira, NOT NULL)
- id_fonte_renda (INT FK -> fonte_renda, NULLABLE)
- id_forma_pagamento (INT FK -> forma_pagamento, NULLABLE)
- periodicidade (VARCHAR(10) NOT NULL CHECK IN ('MENSAL', 'ANUAL'))
- dia_execucao (INT NOT NULL CHECK BETWEEN 1 AND 31) ⭐ CRÍTICO
  -- Dia do mês em que o lançamento será gerado
- data_inicio (DATE NOT NULL)
- data_fim (DATE NULLABLE)
- ativo (BOOLEAN NOT NULL DEFAULT TRUE)
- observacao (VARCHAR(255))
- criado_em (TIMESTAMP)
- atualizado_em (TIMESTAMP)
```

**⚠️ CORREÇÃO CONCEITUAL IMPORTANTE**: 
- **ANTES (ERRADO)**: `lancamento_recorrente` referenciava um `lancamento_financeiro` existente
- **AGORA (CORRETO)**: `lancamento_recorrente` é um **modelo independente** que define como gerar lançamentos
- O sistema gera automaticamente `lancamento_financeiro` baseado nos recorrentes ativos
- Campo `dia_execucao` é **obrigatório** para definir em qual dia do mês gerar (1-31)
- Campo `gerado_recorrente` em `lancamento_financeiro` identifica lançamentos gerados automaticamente

#### 8. **lista_compras**
```sql
- id (SERIAL PRIMARY KEY)
- nome (TEXT NOT NULL)
- data (DATE)
```

#### 9. **item_lista_compras**
```sql
- id (SERIAL PRIMARY KEY)
- lista_compras_id (INT FK -> lista_compras, NOT NULL)
- descricao (TEXT NOT NULL)
- valor (NUMERIC(12,2))
```

---

## FUNCIONALIDADES IMPLEMENTADAS

### ✅ **Autenticação e Segurança**
- Login com JWT
- Guard de autenticação nas rotas protegidas
- Perfil de usuário (visualizar/editar nome, login, senha)
- Timeout de sessão (45 minutos de inatividade)
- Modal de aviso de sessão expirada

### ✅ **Dashboard**
- Cards com métricas principais (atualizados automaticamente)
- Gráficos de distribuição e evolução
- Saudação personalizada por horário
- Recarregamento automático ao acessar

### ✅ **Cadastros (CRUD Completo)**
- Todas as telas de cadastro têm:
  - Filtro por nome/descrição
  - Grid com seleção múltipla
  - Botões: Pesquisar, Cadastrar, Editar, Excluir, **Atualizar**
  - Modal de cadastro/edição
  - Validação de formulários
  - Feedback visual de loading/saving

### ✅ **Lançamentos (CRUD Completo)**
- Todas as telas de lançamento têm:
  - Filtro por descrição
  - Grid com todos os lançamentos do tipo
  - Botões: Pesquisar, Cadastrar, Editar, Excluir, **Atualizar**
  - Modal de cadastro/edição
  - Formatação de valores monetários (R$)
  - Validação completa

### ✅ **Recorrentes - Entradas**
- Visualização de lançamentos recorrentes ativos
- CRUD completo
- Filtro por descrição
- Formulário com todos os campos necessários
- Integração com dashboard (card mostra total)

### ✅ **Mercado**
- Gestão completa de listas de compras
- CRUD de itens dentro das listas
- Marcação de itens como completos
- Estatísticas em tempo real
- Lançamento vinculado a lista

### ✅ **Interface e UX**
- Sidebar responsiva (colapsa/expande)
- Animações suaves no drawer
- Sistema de abas (tabs) para navegação rápida
- Design moderno e profissional
- Responsivo (mobile, tablet, desktop)
- Overlay no mobile quando sidebar aberto

---

## FUNCIONALIDADES PENDENTES / A IMPLEMENTAR

### ⚠️ **Recorrentes - Saídas**
- **Status**: Backend pronto, frontend pendente
- **Necessário**: Criar componente igual ao Recorrentes - Entradas
- **Rota**: `/lancamentos/recorrentes/saidas`
- **API**: `GET /api/lancamentos-recorrentes/saidas` (já existe)

### ✅ **Geração Automática de Lançamentos Recorrentes** (IMPLEMENTADO)
- **Descrição**: Sistema para gerar automaticamente lançamentos baseados nos recorrentes
- **Quando roda**: Ao fazer login (executa em background, não atrasa resposta)
- **Lógica Implementada**:
  - Verifica recorrentes ativos (`ativo = TRUE`)
  - Verifica se `data_inicio <= hoje` e `data_fim IS NULL OR data_fim >= hoje`
  - Para MENSAL: usa `dia_execucao` do mês atual
  - Para ANUAL: usa `dia_execucao` e mês da `data_inicio` no ano atual
  - Só gera se a data de execução já passou (ou é hoje)
  - Verifica se já existe lançamento gerado no mês/ano atual (evita duplicação)
  - Cria `lancamento_financeiro` com `gerado_recorrente = TRUE`
  - **Não gera retroativo** (apenas mês atual)
- **Status**: ✅ Implementado no handler `GerarLancamentosAutomaticos()`

### ⚠️ **Relatórios e Análises**
- Relatório mensal de receitas vs despesas
- Gráfico de evolução financeira
- Análise de gastos por categoria
- Previsão de saldo futuro
- **Status**: Dashboard tem gráficos placeholder, mas não conectados a dados reais

### ⚠️ **Alertas e Notificações**
- Alertas de contas fixas próximas do vencimento
- Notificações de saldo negativo (se implementar controle de saldo)
- Lembretes de lançamentos recorrentes
- **Status**: Não implementado

### ⚠️ **Controle de Saldo**
- Tabela de saldo/contas bancárias
- Controle de saldo atual
- Histórico de movimentações
- **Status**: Não implementado

### ⚠️ **Parcelamento**
- Sistema de parcelamento para despesas
- Campo "permite_parcelamento" existe em forma_pagamento, mas não é usado
- Geração automática de parcelas
- **Status**: Não implementado

### ⚠️ **Exportação de Dados**
- Exportar lançamentos para Excel/CSV
- Relatórios em PDF
- **Status**: Não implementado

### ⚠️ **Filtros Avançados**
- Filtro por período (data início/fim)
- Filtro por categoria
- Filtro por valor (mínimo/máximo)
- **Status**: Apenas filtro por descrição implementado

### ⚠️ **Busca Global**
- Busca unificada em todas as telas
- **Status**: Não implementado

---

## PADRÕES DE CÓDIGO E CONVENÇÕES

### Frontend (Angular):
- **Componentes**: Standalone components
- **Formulários**: Reactive Forms com validação
- **Serviços**: Injectable com `providedIn: 'root'`
- **Modelos**: Interfaces TypeScript
- **Estilos**: SCSS com variáveis CSS
- **Tabelas**: PrimeNG Table com seleção múltipla
- **Modais**: PrimeNG Dialog
- **Validação**: Validators do Angular Forms

### Backend (Go):
- **Handlers**: Struct com método DB pool
- **Models**: Structs com tags JSON
- **Validação**: Gin binding tags
- **Queries**: pgx/v5 com prepared statements
- **Respostas**: JSON padronizado
- **Erros**: HTTP status codes apropriados

### Banco de Dados:
- **Nomenclatura**: snake_case
- **IDs**: SERIAL PRIMARY KEY
- **Timestamps**: `criado_em`, `atualizado_em`
- **Triggers**: Funções para atualizar `atualizado_em`
- **Constraints**: CHECK constraints para validação
- **Foreign Keys**: Relacionamentos bem definidos

---

## ENDPOINTS DA API

### Autenticação:
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Obter perfil
- `PUT /api/auth/profile` - Atualizar perfil

### Cadastros:
- `GET /api/categorias-financeiras` - Listar
- `GET /api/categorias-financeiras/:id` - Obter
- `POST /api/categorias-financeiras` - Criar
- `PUT /api/categorias-financeiras/:id` - Atualizar
- `DELETE /api/categorias-financeiras/:id` - Excluir

- `GET /api/contas-fixas` - Listar
- `GET /api/contas-fixas/:id` - Obter
- `GET /api/contas-fixas/total` - Total de contas fixas
- `POST /api/contas-fixas` - Criar
- `PUT /api/contas-fixas/:id` - Atualizar
- `DELETE /api/contas-fixas/:id` - Excluir

- `GET /api/fontes-renda` - Listar
- `GET /api/fontes-renda/:id` - Obter
- `POST /api/fontes-renda` - Criar
- `PUT /api/fontes-renda/:id` - Atualizar
- `DELETE /api/fontes-renda/:id` - Excluir

- `GET /api/formas-pagamento` - Listar
- `GET /api/formas-pagamento/:id` - Obter
- `POST /api/formas-pagamento` - Criar
- `PUT /api/formas-pagamento/:id` - Atualizar
- `DELETE /api/formas-pagamento/:id` - Excluir

### Lançamentos:
- `GET /api/lancamentos` - Listar todos
- `GET /api/lancamentos/:id` - Obter
- `POST /api/lancamentos` - Criar
- `PUT /api/lancamentos/:id` - Atualizar
- `DELETE /api/lancamentos/:id` - Excluir

### Lançamentos Recorrentes:
- `GET /api/lancamentos-recorrentes/entradas` - Listar entradas
- `GET /api/lancamentos-recorrentes/saidas` - Listar saídas
- `POST /api/lancamentos-recorrentes` - Criar
- `PUT /api/lancamentos-recorrentes/:id` - Atualizar
- `DELETE /api/lancamentos-recorrentes/:id` - Excluir

### Mercado:
- `GET /api/lista-compras` - Listar listas
- `GET /api/lista-compras/:id` - Obter lista
- `POST /api/lista-compras` - Criar lista
- `PUT /api/lista-compras/:id` - Atualizar lista
- `DELETE /api/lista-compras/:id` - Excluir lista

- `GET /api/item-lista-compras` - Listar itens (com query param ?listaId=X)
- `GET /api/item-lista-compras/:id` - Obter item
- `POST /api/item-lista-compras` - Criar item
- `PUT /api/item-lista-compras/:id` - Atualizar item
- `DELETE /api/item-lista-compras/:id` - Excluir item

---

## FLUXOS DE NEGÓCIO IMPORTANTES

### 1. **Fluxo de Lançamento de Receita**
1. Usuário acessa "Receita - Salário" ou "Receita - Renda Extra"
2. Clica em "Cadastrar"
3. Preenche: Data, Descrição, Valor, Categoria (obrigatórios)
4. Opcionalmente seleciona: Fonte de Renda, Forma de Pagamento, Conta Fixa
5. Salva → Cria registro em `lancamento_financeiro` com tipo='E'
6. Se quiser tornar recorrente → Acessa "Recorrentes - Entradas" e vincula

### 2. **Fluxo de Lançamento de Despesa**
1. Usuário acessa "Despesa - Contas do Dia" ou "Despesa - Extras"
2. Clica em "Cadastrar"
3. Preenche: Data, Descrição, Valor, Categoria (obrigatórios)
4. Opcionalmente seleciona: Forma de Pagamento
5. Salva → Cria registro em `lancamento_financeiro` com tipo='S'

### 3. **Fluxo de Pagamento de Conta Fixa**
1. Usuário acessa "Pagamento Conta Fixa"
2. Clica em "Cadastrar"
3. Seleciona a Conta Fixa (obrigatório)
4. Preenche: Data, Descrição, Valor, Categoria
5. Salva → Cria registro em `lancamento_financeiro` com tipo='S' e id_conta_fixa preenchido
6. Dashboard calcula total de pagamentos do mês atual

### 4. **Fluxo de Lançamento Recorrente** ⭐ (CORRIGIDO)
1. Usuário acessa "Recorrentes - Entradas" ou "Recorrentes - Saídas"
2. Clica em "Cadastrar"
3. Preenche diretamente no formulário:
   - Descrição (obrigatório)
   - Valor (obrigatório)
   - Categoria (obrigatório)
   - Fonte de Renda (opcional)
   - Forma de Pagamento (opcional)
   - Periodicidade: MENSAL ou ANUAL (obrigatório)
   - **Dia de Execução: 1-31** (obrigatório) ⭐ CRÍTICO
   - Data Início (obrigatório)
   - Data Fim (opcional)
   - Status: Ativo/Inativo (obrigatório)
   - Observação (opcional)
4. Salva → Cria registro em `lancamento_recorrente` (modelo independente)
5. **Sistema gera automaticamente** lançamentos financeiros ao fazer login:
   - Verifica recorrentes ativos
   - Compara `dia_execucao` com data atual
   - Se já passou o dia e não existe lançamento no mês → cria automaticamente
   - Marca `gerado_recorrente = TRUE` no lançamento gerado
   - **Não gera retroativo** (apenas mês atual se já passou o dia)

### 5. **Fluxo de Lista de Compras**
1. Usuário acessa "Anotações - Mercado"
2. Cria uma nova lista de compras
3. Adiciona itens à lista (descrição e valor opcional)
4. Marca itens como completos conforme vai comprando
5. Acessa "Lançamento - Mercado"
6. Seleciona a lista
7. Lança os itens como despesa vinculada à lista

---

## 🔧 CORREÇÕES APLICADAS (VERSÃO ATUAL)

### ✅ **Correções Críticas Implementadas:**

1. **Modelo de Recorrentes Corrigido** ⭐
   - **ANTES**: Recorrente dependia de `lancamento_financeiro` existente (erro conceitual)
   - **AGORA**: Recorrente é modelo independente com campos próprios
   - Campos próprios: `descricao`, `valor`, `id_categoria`, `id_fonte_renda`, `id_forma_pagamento`
   - Elimina dependência errada e duplicação de dados

2. **Campo `dia_execucao` Adicionado** ⭐
   - Campo obrigatório (1-31) para definir dia do mês de geração
   - Para MENSAL: usa `dia_execucao` do mês atual
   - Para ANUAL: usa `dia_execucao` e mês da `data_inicio` no ano atual
   - Resolve inconsistência na geração automática

3. **Geração Automática Implementada** ⭐
   - Método `GerarLancamentosAutomaticos()` criado
   - Executa automaticamente ao fazer login (em background)
   - Verifica recorrentes ativos e gera lançamentos se necessário
   - Evita duplicação verificando se já existe no mês/ano
   - Marca `gerado_recorrente = TRUE` nos lançamentos gerados

4. **Campo `gerado_recorrente` Adicionado**
   - Campo boolean em `lancamento_financeiro`
   - Identifica lançamentos gerados automaticamente
   - Facilita auditoria, relatórios e debug

5. **Padronização de Status**
   - `ativo` agora é BOOLEAN (true/false) em vez de CHAR('S','N')
   - Mais consistente com o resto do sistema

## PONTOS DE ATENÇÃO E MELHORIAS SUGERIDAS

### 🔴 **Crítico - Faltando Implementar:**

1. **Recorrentes - Saídas (Frontend)**
   - Backend pronto, falta criar componente frontend igual ao Recorrentes - Entradas
   - Usar os novos campos (não mais `id_lancamento`)

2. **Validações de Negócio**
   - Validar se `data_fim > data_inicio` em recorrentes
   - Validar se `dia_execucao` é válido para o mês (ex: não permitir dia 31 em fevereiro)
   - Impedir exclusão de categoria/forma/fonte que está sendo usada
   - Validar se `dia_execucao` não excede dias do mês na `data_inicio`

### 🟡 **Importante - Melhorias:**

3. **Relatórios Reais**
   - Conectar gráficos do dashboard a dados reais
   - Implementar filtros por período
   - Gráfico de receitas vs despesas por mês

4. **Filtros Avançados**
   - Filtro por período em todas as telas de lançamento
   - Filtro por categoria
   - Filtro por valor

5. **Controle de Saldo**
   - Tabela de contas/saldos
   - Cálculo automático de saldo baseado em lançamentos
   - Alertas de saldo negativo

6. **Contas Fixas vs Recorrentes** (Decisão Futura)
   - Conceitualmente, Conta Fixa é um tipo de recorrente de saída
   - Sugestão: No futuro, Conta Fixa pode gerar automaticamente um recorrente
   - Ou: Conta Fixa pode ser um tipo especial de recorrente
   - Documentar como dívida técnica para refatoração futura

### 🟢 **Desejável - Funcionalidades Extras:**

7. **Preview do Impacto da Recorrência**
   - Na tela de recorrente, mostrar: "Este lançamento gerará R$ X todo mês"
   - UX excelente para o usuário entender o impacto

8. **Log de Execução de Recorrentes**
   - Tabela `recorrente_execucao` (id, id_recorrente, data_execucao, status)
   - Evita gerar duas vezes e permite auditoria completa

9. **Parcelamento**
   - Implementar sistema de parcelas
   - Gerar múltiplos lançamentos automaticamente

10. **Exportação**
    - Exportar para Excel/CSV
    - Gerar PDFs de relatórios

11. **Backup e Restore**
    - Exportar/importar dados
    - Backup automático

12. **Multi-usuário**
    - Compartilhamento de dados entre usuários
    - Perfis e permissões

---

## OBSERVAÇÕES FINAIS

- O sistema está bem estruturado e escalável
- **Correções críticas aplicadas**: Modelo de recorrentes independente, campo `dia_execucao`, geração automática
- Separação clara entre lançamentos únicos e recorrentes
- Código limpo e seguindo boas práticas
- Interface moderna e responsiva
- Backend RESTful bem organizado
- Geração automática de recorrentes implementada e funcionando
- Falta principalmente: Frontend de Recorrentes - Saídas e relatórios mais robustos

---

**Este prompt contém todas as informações necessárias para entender o sistema financeiro completo e identificar o que está faltando ou precisa ser melhorado.**

