from database import query_db
from werkzeug.security import generate_password_hash, check_password_hash


def get_admin_by_username(username):
    return query_db(
        "SELECT * FROM admins WHERE username = ?", (username,), one=True
    )


def create_admin(username, password):
    pw_hash = generate_password_hash(password)
    return query_db(
        "INSERT INTO admins (username, password_hash) VALUES (?, ?)",
        (username, pw_hash),
        commit=True,
    )


def update_admin_password(username, password):
    pw_hash = generate_password_hash(password)
    query_db(
        "UPDATE admins SET password_hash = ? WHERE username = ?",
        (pw_hash, username),
        commit=True,
    )


def verify_admin(username, password):
    admin = get_admin_by_username(username)
    if admin and check_password_hash(admin["password_hash"], password):
        return admin
    return None
