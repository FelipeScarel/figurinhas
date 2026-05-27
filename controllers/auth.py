from flask import Blueprint, render_template, request, session, redirect, url_for, flash
from models.admin_model import verify_admin

auth = Blueprint("auth", __name__)


@auth.route("/admin/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        if not username or not password:
            flash("Preencha todos os campos.", "error")
            return render_template("admin/login.html")

        admin = verify_admin(username, password)
        if admin:
            session["admin_logged_in"] = True
            session["admin_username"] = admin["username"]
            session["admin_id"] = admin["id"]
            flash("Login realizado com sucesso!", "success")
            return redirect(url_for("admin.dashboard"))

        flash("Usuário ou senha inválidos.", "error")

    return render_template("admin/login.html")


@auth.route("/admin/logout")
def logout():
    session.clear()
    flash("Você saiu da sessão.", "info")
    return redirect(url_for("auth.login"))
