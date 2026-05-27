from flask import Blueprint, render_template, request, jsonify
from utils.decorators import login_required
from models.order import get_all_orders, get_order_by_id, update_order_status

admin = Blueprint("admin", __name__)


@admin.route("/admin/dashboard")
@login_required
def dashboard():
    return render_template("admin/dashboard.html")


@admin.route("/admin/api/orders")
@login_required
def api_list_orders():
    search = request.args.get("search", "").strip() or None
    orders = get_all_orders(search=search)
    return jsonify([dict(o) for o in orders])


@admin.route("/admin/api/orders/<int:order_id>/status", methods=["PUT"])
@login_required
def api_update_status(order_id):
    data = request.get_json()
    new_status = data.get("status", "").strip()

    valid_statuses = [
        "Pendente",
        "Em Análise",
        "Orçamento Enviado",
        "Em Produção",
        "Finalizado",
    ]
    if new_status not in valid_statuses:
        return jsonify({"success": False, "error": "Status inválido."}), 400

    order = get_order_by_id(order_id)
    if not order:
        return jsonify({"success": False, "error": "Pedido não encontrado."}), 404

    update_order_status(order_id, new_status)
    return jsonify({"success": True})
