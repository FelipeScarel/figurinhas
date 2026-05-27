from database import query_db


def create_order(data):
    return query_db(
        """INSERT INTO orders (customer_name, customer_whatsapp, quantity,
                               estimated_size, finish_type, artwork_path,
                               reference_product_id, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            data["customer_name"],
            data["customer_whatsapp"],
            data["quantity"],
            data.get("estimated_size", ""),
            data["finish_type"],
            data.get("artwork_path", ""),
            data.get("reference_product_id"),
            data.get("notes", ""),
        ),
        commit=True,
    )


def get_all_orders(search=None):
    if search:
        search_term = f"%{search}%"
        return query_db(
            """SELECT o.*, p.title as reference_title
               FROM orders o
               LEFT JOIN products p ON o.reference_product_id = p.id
               WHERE o.customer_name LIKE ? OR o.customer_whatsapp LIKE ?
               ORDER BY o.created_at DESC""",
            (search_term, search_term),
        )
    return query_db(
        """SELECT o.*, p.title as reference_title
           FROM orders o
           LEFT JOIN products p ON o.reference_product_id = p.id
           ORDER BY o.created_at DESC"""
    )


def get_order_by_id(order_id):
    return query_db(
        """SELECT o.*, p.title as reference_title
           FROM orders o
           LEFT JOIN products p ON o.reference_product_id = p.id
           WHERE o.id = ?""",
        (order_id,),
        one=True,
    )


def update_order_status(order_id, status):
    query_db(
        "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (status, order_id),
        commit=True,
    )
