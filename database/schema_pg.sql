CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS figurinhas (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    url_imagem TEXT NOT NULL,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    preco DECIMAL(10,2) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    cliente_nome TEXT NOT NULL,
    cliente_whatsapp TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    tamanho_estimado TEXT,
    tipo_acabamento TEXT NOT NULL,
    urgencia TEXT,
    referencia_figurinha_id INTEGER REFERENCES figurinhas(id) ON DELETE SET NULL,
    observacoes TEXT,
    anotacoes_internas TEXT,
    link_pagamento TEXT,
    status TEXT DEFAULT 'Pendente'
        CHECK (status IN ('Pendente','Em Análise','Orçamento Enviado','Em Produção','Finalizado')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedido_arquivos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    arquivo_path TEXT NOT NULL,
    nome_original TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
