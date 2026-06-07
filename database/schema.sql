PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS figurinhas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descricao TEXT,
    url_imagem TEXT NOT NULL,
    categoria_id INTEGER,
    preco DECIMAL(10,2) DEFAULT NULL,
    tags TEXT DEFAULT '[]',
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_nome TEXT NOT NULL,
    cliente_whatsapp TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    tamanho_estimado TEXT,
    largura_cm TEXT,
    altura_cm TEXT,
    tipo_acabamento TEXT NOT NULL,
    urgencia TEXT,
    referencia_figurinha_id INTEGER,
    observacoes TEXT,
    anotacoes_internas TEXT,
    link_pagamento TEXT,
    status TEXT DEFAULT 'Pendente'
        CHECK(status IN ('Pendente','Em Análise','Orçamento Enviado','Em Produção','Finalizado')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referencia_figurinha_id) REFERENCES figurinhas(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS pedido_arquivos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    arquivo_path TEXT NOT NULL,
    nome_original TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
