from database import query_db
from models.admin_model import get_admin_by_username, create_admin
from config import Config


def seed_admin():
    existing = get_admin_by_username(Config.ADMIN_USERNAME)
    if not existing:
        create_admin(Config.ADMIN_USERNAME, Config.ADMIN_PASSWORD)
        print(f"[SEED] Admin '{Config.ADMIN_USERNAME}' criado.")


def seed_categorias():
    categorias = [
        ("Grau e Empinamento", "grau"),
        ("Capacetes Esportivos", "capacetes"),
        ("Marcas e Logos", "marcas"),
        ("Frases e Humor", "frases"),
        ("Cascatas e Manobras", "cascatas"),
        ("Corte de Giro", "corte-de-giro"),
    ]
    for nome, slug in categorias:
        existing = query_db("SELECT id FROM categorias WHERE slug = ?", (slug,), one=True)
        if not existing:
            query_db(
                "INSERT INTO categorias (nome, slug) VALUES (?, ?)",
                (nome, slug),
                commit=True,
            )
            print(f"[SEED] Categoria '{nome}' criada.")


def seed_all():
    seed_admin()
    seed_categorias()
