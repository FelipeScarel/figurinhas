from database import query_db


def add_arquivo(pedido_id, arquivo_path, nome_original=None):
    return query_db(
        "INSERT INTO pedido_arquivos (pedido_id, arquivo_path, nome_original) VALUES (?, ?, ?)",
        (pedido_id, arquivo_path, nome_original),
        commit=True,
    )


def get_arquivos_by_pedido(pedido_id):
    return query_db(
        "SELECT * FROM pedido_arquivos WHERE pedido_id = ? ORDER BY created_at",
        (pedido_id,),
    )


def delete_arquivo(arquivo_id):
    query_db("DELETE FROM pedido_arquivos WHERE id = ?", (arquivo_id,), commit=True)
