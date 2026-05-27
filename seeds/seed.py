from database import query_db
from models.admin_model import get_admin_by_username, create_admin
from config import Config


def seed_admin():
    existing = get_admin_by_username(Config.ADMIN_USERNAME)
    if not existing:
        create_admin(Config.ADMIN_USERNAME, Config.ADMIN_PASSWORD)
        print(f"[SEED] Admin '{Config.ADMIN_USERNAME}' criado.")


def seed_categories():
    categories = [
        ("Grau e Empinamento", "grau"),
        ("Capacetes Esportivos", "capacetes"),
        ("Marcas e Logos", "marcas"),
        ("Frases e Humor", "frases"),
        ("Cascatas e Manobras", "cascatas"),
        ("Corte de Giro", "corte-de-giro"),
    ]
    for name, slug in categories:
        existing = query_db("SELECT id FROM categories WHERE slug = ?", (slug,), one=True)
        if not existing:
            query_db(
                "INSERT INTO categories (name, slug) VALUES (?, ?)",
                (name, slug),
                commit=True,
            )
            print(f"[SEED] Categoria '{name}' criada.")


def seed_all():
    seed_admin()
    seed_categories()
