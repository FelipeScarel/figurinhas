from flask import Blueprint, render_template, request, jsonify
from utils.decorators import login_required
from utils.file_handler import save_upload
from models.order import get_all_orders, get_order_by_id, update_order_status, update_order_notes
from models.pedido_arquivo import get_arquivos_by_pedido
from models.figurinha import (
    get_all_categorias,
    get_all_figurinhas_admin,
    get_figurinha_by_id,
    create_figurinha,
    update_figurinha,
    delete_figurinha,
)

admin = Blueprint("admin", __name__, url_prefix="/admin")


@admin.route("/dashboard")
@login_required
def dashboard():
    return render_template("admin/dashboard.html")


@admin.route("/vitrine")
@login_required
def vitrine():
    categorias = get_all_categorias()
    return render_template("admin/vitrine.html", categorias=categorias)


# ── Pedidos API ──────────────────────────────────────────────

@admin.route("/api/pedidos")
@login_required
def api_list_orders():
    search = request.args.get("search", "").strip() or None
    orders = get_all_orders(search=search)
    result = []
    for o in orders:
        order_dict = dict(o)
        order_dict["arquivos"] = [dict(a) for a in get_arquivos_by_pedido(o["id"])]
        result.append(order_dict)
    return jsonify(result)


@admin.route("/api/pedidos/<int:order_id>/status", methods=["PUT"])
@login_required
def api_update_status(order_id):
    data = request.get_json()
    new_status = data.get("status", "").strip()

    valid_statuses = [
        "Pendente", "Em Análise", "Orçamento Enviado", "Em Produção", "Finalizado",
    ]
    if new_status not in valid_statuses:
        return jsonify({"success": False, "error": "Status inválido."}), 400

    order = get_order_by_id(order_id)
    if not order:
        return jsonify({"success": False, "error": "Pedido não encontrado."}), 404

    update_order_status(order_id, new_status)
    return jsonify({"success": True})


@admin.route("/api/pedidos/<int:order_id>/notas", methods=["PUT"])
@login_required
def api_update_notas(order_id):
    data = request.get_json()
    anotacoes = data.get("anotacoes_internas", "").strip()
    link_pagamento = data.get("link_pagamento", "").strip()

    order = get_order_by_id(order_id)
    if not order:
        return jsonify({"success": False, "error": "Pedido não encontrado."}), 404

    update_order_notes(order_id, anotacoes, link_pagamento)
    return jsonify({"success": True})


# ── Vitrine CRUD API ─────────────────────────────────────────

@admin.route("/api/vitrine")
@login_required
def api_list_vitrine():
    categoria = request.args.get("categoria", "").strip() or None
    figurinhas = get_all_figurinhas_admin(categoria_slug=categoria)
    return jsonify([dict(f) for f in figurinhas])


@admin.route("/api/vitrine", methods=["POST"])
@login_required
def api_create_vitrine():
    try:
        titulo = request.form.get("titulo", "").strip()
        descricao = request.form.get("descricao", "").strip()
        categoria_id = request.form.get("categoria_id", "").strip() or None
        preco = request.form.get("preco", "").strip() or None

        if not titulo:
            return jsonify({"success": False, "error": "Título é obrigatório."}), 400

        url_imagem = ""
        file = request.files.get("imagem")
        if file and file.filename:
            saved = save_upload(file, subfolder="produtos")
            if saved:
                url_imagem = saved

        if not url_imagem:
            return jsonify({"success": False, "error": "Imagem é obrigatória."}), 400

        data = {
            "titulo": titulo,
            "descricao": descricao,
            "url_imagem": url_imagem,
            "categoria_id": int(categoria_id) if categoria_id else None,
            "preco": float(preco) if preco else None,
        }

        fig_id = create_figurinha(data)
        return jsonify({"success": True, "id": fig_id})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@admin.route("/api/vitrine/<int:fig_id>", methods=["PUT"])
@login_required
def api_update_vitrine(fig_id):
    try:
        existing = get_figurinha_by_id(fig_id)
        if not existing:
            return jsonify({"success": False, "error": "Figurinha não encontrada."}), 404

        titulo = request.form.get("titulo", "").strip()
        descricao = request.form.get("descricao", "").strip()
        categoria_id = request.form.get("categoria_id", "").strip() or None
        preco = request.form.get("preco", "").strip() or None
        is_active = request.form.get("is_active", "1")

        if not titulo:
            return jsonify({"success": False, "error": "Título é obrigatório."}), 400

        url_imagem = existing["url_imagem"]
        file = request.files.get("imagem")
        if file and file.filename:
            saved = save_upload(file, subfolder="produtos")
            if saved:
                url_imagem = saved

        data = {
            "titulo": titulo,
            "descricao": descricao,
            "url_imagem": url_imagem,
            "categoria_id": int(categoria_id) if categoria_id else None,
            "preco": float(preco) if preco else None,
            "is_active": int(is_active),
        }

        update_figurinha(fig_id, data)
        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@admin.route("/api/vitrine/<int:fig_id>", methods=["DELETE"])
@login_required
def api_delete_vitrine(fig_id):
    existing = get_figurinha_by_id(fig_id)
    if not existing:
        return jsonify({"success": False, "error": "Figurinha não encontrada."}), 404

    delete_figurinha(fig_id)
    return jsonify({"success": True})
