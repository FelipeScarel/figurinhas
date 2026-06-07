from database import query_db


def create_order(data):
    return query_db(
        """INSERT INTO pedidos (cliente_nome, cliente_whatsapp, quantidade,
                                tamanho_estimado, largura_cm, altura_cm,
                                tipo_acabamento, urgencia,
                                referencia_figurinha_id, observacoes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            data["cliente_nome"],
            data["cliente_whatsapp"],
            data["quantidade"],
            data.get("tamanho_estimado", ""),
            data.get("largura_cm", ""),
            data.get("altura_cm", ""),
            data["tipo_acabamento"],
            data.get("urgencia", ""),
            data.get("referencia_figurinha_id"),
            data.get("observacoes", ""),
        ),
        commit=True,
    )


def get_all_orders(search=None):
    if search:
        search_term = f"%{search}%"
        return query_db(
            """SELECT p.*, f.titulo as referencia_titulo
               FROM pedidos p
               LEFT JOIN figurinhas f ON p.referencia_figurinha_id = f.id
               WHERE p.cliente_nome LIKE ? OR p.cliente_whatsapp LIKE ?
               ORDER BY p.created_at DESC""",
            (search_term, search_term),
        )
    return query_db(
        """SELECT p.*, f.titulo as referencia_titulo
           FROM pedidos p
           LEFT JOIN figurinhas f ON p.referencia_figurinha_id = f.id
           ORDER BY p.created_at DESC"""
    )


def get_order_by_id(order_id):
    return query_db(
        """SELECT p.*, f.titulo as referencia_titulo
           FROM pedidos p
           LEFT JOIN figurinhas f ON p.referencia_figurinha_id = f.id
           WHERE p.id = ?""",
        (order_id,),
        one=True,
    )


def update_order_status(order_id, status):
    query_db(
        "UPDATE pedidos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (status, order_id),
        commit=True,
    )


def update_order_notes(order_id, anotacoes, link_pagamento):
    query_db(
        """UPDATE pedidos SET anotacoes_internas = ?, link_pagamento = ?,
           updated_at = CURRENT_TIMESTAMP WHERE id = ?""",
        (anotacoes, link_pagamento, order_id),
        commit=True,
    )
