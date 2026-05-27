from database import query_db


def get_all_categories():
    return query_db("SELECT * FROM categories ORDER BY name")


def get_all_products(category_slug=None):
    if category_slug:
        return query_db(
            """SELECT p.*, c.name as category_name, c.slug as category_slug
               FROM products p
               LEFT JOIN categories c ON p.category_id = c.id
               WHERE p.is_active = 1 AND c.slug = ?
               ORDER BY p.created_at DESC""",
            (category_slug,),
        )
    return query_db(
        """SELECT p.*, c.name as category_name, c.slug as category_slug
           FROM products p
           LEFT JOIN categories c ON p.category_id = c.id
           WHERE p.is_active = 1
           ORDER BY p.created_at DESC"""
    )


def get_product_by_id(product_id):
    return query_db(
        """SELECT p.*, c.name as category_name, c.slug as category_slug
           FROM products p
           LEFT JOIN categories c ON p.category_id = c.id
           WHERE p.id = ?""",
        (product_id,),
        one=True,
    )
