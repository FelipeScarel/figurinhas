import os
from flask import Blueprint, render_template, request, jsonify, current_app
from models.product import get_all_categories, get_all_products
from models.order import create_order
from utils.file_handler import save_upload
from utils.whatsapp import generate_whatsapp_message

orders = Blueprint("orders", __name__)


@orders.route("/")
def index():
    categories = get_all_categories()
    products = get_all_products()
    return render_template("index.html", categories=categories, products=products)


@orders.route("/api/products")
def api_products():
    category = request.args.get("category")
    products = get_all_products(category_slug=category if category else None)
    return jsonify([dict(p) for p in products])


@orders.route("/api/orders", methods=["POST"])
def api_create_order():
    try:
        customer_name = request.form.get("customer_name", "").strip()
        customer_whatsapp = request.form.get("customer_whatsapp", "").strip()
        quantity = request.form.get("quantity", "").strip()
        estimated_size = request.form.get("estimated_size", "").strip()
        finish_type = request.form.get("finish_type", "").strip()
        reference_product_id = request.form.get("reference_product_id", "").strip() or None
        notes = request.form.get("notes", "").strip()

        errors = []
        if not customer_name:
            errors.append("Nome é obrigatório.")
        if not customer_whatsapp:
            errors.append("WhatsApp é obrigatório.")
        if not quantity or not quantity.isdigit() or int(quantity) < 1:
            errors.append("Quantidade deve ser um número positivo.")
        if not finish_type:
            errors.append("Tipo de acabamento é obrigatório.")

        if errors:
            return jsonify({"success": False, "errors": errors}), 400

        artwork_path = None
        file = request.files.get("artwork")
        if file and file.filename:
            artwork_path = save_upload(file, subfolder="orders")
            if artwork_path is None:
                return jsonify({"success": False, "errors": ["Formato de arquivo não permitido. Use PNG, JPG, PDF ou SVG."]}), 400

        order_data = {
            "customer_name": customer_name,
            "customer_whatsapp": customer_whatsapp,
            "quantity": int(quantity),
            "estimated_size": estimated_size,
            "finish_type": finish_type,
            "artwork_path": artwork_path,
            "reference_product_id": int(reference_product_id) if reference_product_id else None,
            "notes": notes,
        }

        order_id = create_order(order_data)
        order_data["order_id"] = order_id
        whatsapp_link = generate_whatsapp_message(order_data)

        return jsonify({"success": True, "whatsapp_link": whatsapp_link, "order_id": order_id})

    except Exception as e:
        current_app.logger.error(f"Erro ao criar pedido: {e}")
        return jsonify({"success": False, "errors": ["Erro interno. Tente novamente."]}), 500
