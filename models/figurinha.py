from database import query_db


def get_all_categorias():
    return query_db("SELECT * FROM categorias ORDER BY nome")


def get_all_figurinhas(categoria_slug=None):
    if categoria_slug:
        return query_db(
            """SELECT f.*, c.nome as categoria_nome, c.slug as categoria_slug
               FROM figurinhas f
               LEFT JOIN categorias c ON f.categoria_id = c.id
               WHERE f.is_active = 1 AND c.slug = ?
               ORDER BY f.created_at DESC""",
            (categoria_slug,),
        )
    return query_db(
        """SELECT f.*, c.nome as categoria_nome, c.slug as categoria_slug
           FROM figurinhas f
           LEFT JOIN categorias c ON f.categoria_id = c.id
           WHERE f.is_active = 1
           ORDER BY f.created_at DESC"""
    )


def get_figurinha_by_id(figurinha_id):
    return query_db(
        """SELECT f.*, c.nome as categoria_nome, c.slug as categoria_slug
           FROM figurinhas f
           LEFT JOIN categorias c ON f.categoria_id = c.id
           WHERE f.id = ?""",
        (figurinha_id,),
        one=True,
    )


# Admin CRUD
def get_all_figurinhas_admin(categoria_slug=None):
    if categoria_slug:
        return query_db(
            """SELECT f.*, c.nome as categoria_nome
               FROM figurinhas f
               LEFT JOIN categorias c ON f.categoria_id = c.id
               WHERE c.slug = ?
               ORDER BY f.created_at DESC""",
            (categoria_slug,),
        )
    return query_db(
        """SELECT f.*, c.nome as categoria_nome
           FROM figurinhas f
           LEFT JOIN categorias c ON f.categoria_id = c.id
           ORDER BY f.created_at DESC"""
    )


def create_figurinha(data):
    return query_db(
        """INSERT INTO figurinhas (titulo, descricao, url_imagem, categoria_id, preco, tags)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (
            data["titulo"],
            data.get("descricao", ""),
            data["url_imagem"],
            data.get("categoria_id"),
            data.get("preco"),
            data.get("tags", "[]"),
        ),
        commit=True,
    )


def update_figurinha(figurinha_id, data):
    query_db(
        """UPDATE figurinhas SET titulo=?, descricao=?, url_imagem=?,
           categoria_id=?, preco=?, tags=?, is_active=?
           WHERE id=?""",
        (
            data["titulo"],
            data.get("descricao", ""),
            data["url_imagem"],
            data.get("categoria_id"),
            data.get("preco"),
            data.get("tags", "[]"),
            data.get("is_active", 1),
            figurinha_id,
        ),
        commit=True,
    )


def delete_figurinha(figurinha_id):
    query_db("DELETE FROM figurinhas WHERE id = ?", (figurinha_id,), commit=True)
