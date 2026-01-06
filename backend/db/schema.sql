CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    login TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_plain TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated ON products;
CREATE TRIGGER trg_products_updated
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE PROCEDURE set_products_updated_at();

-- ==============================
-- Estoque: categorias e produtos
-- ==============================

CREATE TABLE IF NOT EXISTS categoria (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS produto (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    id_categoria INT,
    unidade VARCHAR(20) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_produto_categoria FOREIGN KEY (id_categoria) REFERENCES categoria (id)
);

CREATE OR REPLACE FUNCTION set_produto_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_produto_atualizacao ON produto;
CREATE TRIGGER trg_produto_atualizacao
BEFORE UPDATE ON produto
FOR EACH ROW
EXECUTE PROCEDURE set_produto_atualizacao();

-- Estoque atual (1 registro por produto)
CREATE TABLE IF NOT EXISTS estoque (
    id SERIAL PRIMARY KEY,
    id_produto INT NOT NULL UNIQUE,
    quantidade NUMERIC(15,3) NOT NULL DEFAULT 0,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_estoque_produto FOREIGN KEY (id_produto) REFERENCES produto (id)
);

-- Movimentação de estoque (histórico)
CREATE TABLE IF NOT EXISTS estoque_movimentacao (
    id SERIAL PRIMARY KEY,
    id_produto INT NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- ENTRADA | SAIDA | AJUSTE (futuro)
    quantidade NUMERIC(15,3) NOT NULL,
    observacao TEXT,
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mov_produto FOREIGN KEY (id_produto) REFERENCES produto (id)
);

CREATE OR REPLACE FUNCTION fn_atualiza_estoque()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tipo = 'ENTRADA' THEN
        UPDATE estoque
           SET quantidade = quantidade + NEW.quantidade,
               data_atualizacao = CURRENT_TIMESTAMP
         WHERE id_produto = NEW.id_produto;
    ELSIF NEW.tipo = 'SAIDA' THEN
        UPDATE estoque
           SET quantidade = quantidade - NEW.quantidade,
               data_atualizacao = CURRENT_TIMESTAMP
         WHERE id_produto = NEW.id_produto;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_atualiza_estoque ON estoque_movimentacao;
CREATE TRIGGER tg_atualiza_estoque
AFTER INSERT ON estoque_movimentacao
FOR EACH ROW
EXECUTE FUNCTION fn_atualiza_estoque();

-- View para verificação de quantidade
CREATE OR REPLACE VIEW vw_estoque_atual AS
SELECT
    p.id AS id_produto,
    p.nome AS produto,
    c.nome AS categoria,
    p.unidade,
    e.quantidade,
    e.data_atualizacao
FROM produto p
LEFT JOIN estoque e ON e.id_produto = p.id
LEFT JOIN categoria c ON c.id = p.id_categoria
WHERE p.ativo = TRUE;

CREATE TABLE IF NOT EXISTS categoria_financeira (
    id_categoria SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo CHAR(1) NOT NULL CHECK (tipo IN ('E','S')),
    descricao VARCHAR(255),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP
);

CREATE OR REPLACE FUNCTION set_categoria_financeira_atualizado()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_categoria_financeira_atualizado ON categoria_financeira;
CREATE TRIGGER trg_categoria_financeira_atualizado
BEFORE UPDATE ON categoria_financeira
FOR EACH ROW
EXECUTE PROCEDURE set_categoria_financeira_atualizado();

CREATE TABLE IF NOT EXISTS conta_fixa (
    id_conta_fixa SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    id_categoria INT NOT NULL,
    valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
    dia_vencimento INT NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP,
    CONSTRAINT fk_conta_fixa_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categoria_financeira (id_categoria)
);

CREATE OR REPLACE FUNCTION set_conta_fixa_atualizado()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_conta_fixa_atualizado ON conta_fixa;
CREATE TRIGGER trg_conta_fixa_atualizado
BEFORE UPDATE ON conta_fixa
FOR EACH ROW
EXECUTE PROCEDURE set_conta_fixa_atualizado();

CREATE TABLE IF NOT EXISTS fonte_renda (
    id_fonte_renda SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    valor_padrao NUMERIC(12,2) CHECK (valor_padrao >= 0),
    recorrente BOOLEAN NOT NULL DEFAULT FALSE,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP
);

CREATE OR REPLACE FUNCTION set_fonte_renda_atualizado()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fonte_renda_atualizado ON fonte_renda;
CREATE TRIGGER trg_fonte_renda_atualizado
BEFORE UPDATE ON fonte_renda
FOR EACH ROW
EXECUTE PROCEDURE set_fonte_renda_atualizado();

CREATE TABLE IF NOT EXISTS forma_pagamento (
    id_forma_pagamento SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    tipo CHAR(1) NOT NULL CHECK (tipo IN ('D','C','P','T')),
    permite_parcelamento BOOLEAN NOT NULL DEFAULT FALSE,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP
);

CREATE OR REPLACE FUNCTION set_forma_pagamento_atualizado()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_forma_pagamento_atualizado ON forma_pagamento;
CREATE TRIGGER trg_forma_pagamento_atualizado
BEFORE UPDATE ON forma_pagamento
FOR EACH ROW
EXECUTE PROCEDURE set_forma_pagamento_atualizado();

CREATE TABLE IF NOT EXISTS lancamento_financeiro (
    id_lancamento SERIAL PRIMARY KEY,
    data_lancamento DATE NOT NULL,
    descricao VARCHAR(150) NOT NULL,
    tipo CHAR(1) NOT NULL CHECK (tipo IN ('E','S')),
    valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
    id_categoria INT NOT NULL,
    id_fonte_renda INT,
    id_conta_fixa INT,
    id_forma_pagamento INT,
    observacao VARCHAR(255),
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP,
    CONSTRAINT fk_lanc_categoria FOREIGN KEY (id_categoria) REFERENCES categoria_financeira (id_categoria),
    CONSTRAINT fk_lanc_fonte_renda FOREIGN KEY (id_fonte_renda) REFERENCES fonte_renda (id_fonte_renda),
    CONSTRAINT fk_lanc_conta_fixa FOREIGN KEY (id_conta_fixa) REFERENCES conta_fixa (id_conta_fixa),
    CONSTRAINT fk_lanc_forma_pagamento FOREIGN KEY (id_forma_pagamento) REFERENCES forma_pagamento (id_forma_pagamento)
);

CREATE OR REPLACE FUNCTION set_lancamento_financeiro_atualizado()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lancamento_financeiro_atualizado ON lancamento_financeiro;
CREATE TRIGGER trg_lancamento_financeiro_atualizado
BEFORE UPDATE ON lancamento_financeiro
FOR EACH ROW
EXECUTE PROCEDURE set_lancamento_financeiro_atualizado();

-- Adiciona campo para identificar lançamentos gerados automaticamente
ALTER TABLE lancamento_financeiro 
ADD COLUMN IF NOT EXISTS gerado_recorrente BOOLEAN NOT NULL DEFAULT FALSE;

-- Ajustes para contas a pagar: datas opcionais de vencimento e pagamento
ALTER TABLE lancamento_financeiro
ADD COLUMN IF NOT EXISTS data_vencimento DATE;

ALTER TABLE lancamento_financeiro
ADD COLUMN IF NOT EXISTS data_pagamento DATE;

-- Tabela de lançamentos recorrentes (modelo de lançamento, não referência a um existente)
CREATE TABLE IF NOT EXISTS lancamento_recorrente (
    id_recorrente SERIAL PRIMARY KEY,
    tipo CHAR(1) NOT NULL CHECK (tipo IN ('E','S')),
    descricao VARCHAR(150) NOT NULL,
    valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
    id_categoria INT NOT NULL,
    id_fonte_renda INT,
    id_forma_pagamento INT,
    periodicidade VARCHAR(10) NOT NULL CHECK (periodicidade IN ('MENSAL', 'ANUAL')),
    dia_execucao INT NOT NULL CHECK (dia_execucao BETWEEN 1 AND 31),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    observacao VARCHAR(255),
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP,
    CONSTRAINT fk_recorrente_categoria FOREIGN KEY (id_categoria) REFERENCES categoria_financeira (id_categoria),
    CONSTRAINT fk_recorrente_fonte_renda FOREIGN KEY (id_fonte_renda) REFERENCES fonte_renda (id_fonte_renda),
    CONSTRAINT fk_recorrente_forma_pagamento FOREIGN KEY (id_forma_pagamento) REFERENCES forma_pagamento (id_forma_pagamento)
);

CREATE OR REPLACE FUNCTION set_lancamento_recorrente_atualizado()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lancamento_recorrente_atualizado ON lancamento_recorrente;
CREATE TRIGGER trg_lancamento_recorrente_atualizado
BEFORE UPDATE ON lancamento_recorrente
FOR EACH ROW
EXECUTE PROCEDURE set_lancamento_recorrente_atualizado();

-- Usuários padrão (login/senha simples)
INSERT INTO users (name, login, email, password_plain)
VALUES 
    ('Admin', 'admin', 'admin@acme.com', 'admin123'),
    ('Teste', 'login', 'login@test.com', 'admin123')
ON CONFLICT (login) DO NOTHING;

-- Categorias financeiras padrão
INSERT INTO categoria_financeira (nome, tipo, descricao, ativo)
VALUES
    ('Salários', 'E', 'Rendas fixas', TRUE),
    ('Freelas', 'E', 'Rendas extras', TRUE),
    ('Energia', 'S', 'Conta fixa', TRUE),
    ('Internet', 'S', 'Conta fixa', TRUE)
ON CONFLICT DO NOTHING;











