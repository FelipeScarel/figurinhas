import os
import re
import sqlite3
from flask import g
from config import Config


def _placeholder(query):
    if Config().is_postgres:
        return re.sub(r"\?", "%s", query)
    return query


def get_db():
    if "db" not in g:
        if Config().is_postgres:
            import psycopg2
            import psycopg2.extras

            g.db = psycopg2.connect(Config.DATABASE_URL)
            g.db.cursor_factory = psycopg2.extras.RealDictCursor
        else:
            g.db = sqlite3.connect(
                Config.SQLITE_PATH, detect_types=sqlite3.PARSE_DECLTYPES
            )
            g.db.row_factory = sqlite3.Row
            g.db.execute("PRAGMA journal_mode=WAL")
            g.db.execute("PRAGMA foreign_keys=ON")
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    if Config().is_postgres:
        import psycopg2

        conn = psycopg2.connect(Config.DATABASE_URL)
        cur = conn.cursor()
        schema_path = os.path.join(os.path.dirname(__file__), "schema_pg.sql")
        with open(schema_path, encoding="utf-8") as f:
            cur.execute(f.read())
        conn.commit()
        cur.close()
        conn.close()
    else:
        db = sqlite3.connect(Config.SQLITE_PATH)
        db.row_factory = sqlite3.Row
        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
        with open(schema_path, encoding="utf-8") as f:
            db.executescript(f.read())
        db.commit()
        db.close()


def query_db(query, args=(), one=False, commit=False):
    db = get_db()
    pg = Config().is_postgres

    if pg:
        query = _placeholder(query)
        is_insert = commit and query.strip().upper().startswith("INSERT")
        if is_insert:
            query = query.rstrip(";") + " RETURNING id"
        cur = db.cursor()
        cur.execute(query, args)
        if commit:
            db.commit()
            if is_insert:
                row = cur.fetchone()
                return row["id"] if row else None
            cur.close()
            return None
        rv = cur.fetchall()
        cur.close()
        return (rv[0] if rv else None) if one else rv
    else:
        cur = db.execute(query, args)
        if commit:
            db.commit()
            return cur.lastrowid
        rv = cur.fetchall()
        cur.close()
        return (rv[0] if rv else None) if one else rv
