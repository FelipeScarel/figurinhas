import os
from flask import Blueprint, render_template, request, jsonify, current_app
from models.figurinha import get_all_categorias, get_all_figurinhas
from models.order import create_order
from models.pedido_arquivo import add_arquivo
from utils.file_handler import save_upload
from utils.whatsapp import generate_whatsapp_message

orders = Blueprint("orders", __name__)


@orders.route("/")
def index():
    categorias = get_all_categorias()
    figurinhas = get_all_figurinhas()
    return render_template("index.html", categorias=categorias, figurinhas=figurinhas)


@orders.route("/api/figurinhas")
def api_figurinhas():
    categoria = request.args.get("categoria")
    figurinhas = get_all_figurinhas(categoria_slug=categoria if categoria else None)
    return jsonify([dict(f) for f in figurinhas])


@orders.route("/api/pedidos", methods=["POST"])
def api_create_order():
    try:
        cliente_nome = request.form.get("cliente_nome", "").strip()
        cliente_whatsapp = request.form.get("cliente_whatsapp", "").strip()
        quantidade = request.form.get("quantidade", "").strip()
        tamanho_estimado = request.form.get("tamanho_estimado", "").strip()
        tipo_acabamento = request.form.get("tipo_acabamento", "").strip()
        urgencia = request.form.get("urgencia", "").strip()
        referencia_figurinha_id = request.form.get("referencia_figurinha_id", "").strip() or None
        observacoes = request.form.get("observacoes", "").strip()

        errors = []
        if not cliente_nome:
            errors.append("Nome é obrigatório.")
        if not cliente_whatsapp:
            errors.append("WhatsApp é obrigatório.")
        if not quantidade or not quantidade.isdigit() or int(quantidade) < 1:
            errors.append("Quantidade deve ser um número positivo.")
        if not tipo_acabamento:
            errors.append("Tipo de acabamento é obrigatório.")

        if errors:
            return jsonify({"success": False, "errors": errors}), 400

        order_data = {
            "cliente_nome": cliente_nome,
            "cliente_whatsapp": cliente_whatsapp,
            "quantidade": int(quantidade),
            "tamanho_estimado": tamanho_estimado,
            "tipo_acabamento": tipo_acabamento,
            "urgencia": urgencia,
            "referencia_figurinha_id": int(referencia_figurinha_id) if referencia_figurinha_id else None,
            "observacoes": observacoes,
        }

        order_id = create_order(order_data)

        # Handle multiple file uploads
        arquivos_count = 0
        files = request.files.getlist("artworks")
        for file in files:
            if file and file.filename:
                saved_path = save_upload(file, subfolder="pedidos")
                if saved_path:
                    add_arquivo(order_id, saved_path, file.filename)
                    arquivos_count += 1

        order_data["order_id"] = order_id
        order_data["arquivos_count"] = arquivos_count
        whatsapp_link = generate_whatsapp_message(order_data)

        return jsonify({
            "success": True,
            "whatsapp_link": whatsapp_link,
            "order_id": order_id,
            "arquivos_count": arquivos_count,
        })

    except Exception as e:
        current_app.logger.error(f"Erro ao criar pedido: {e}")
        return jsonify({"success": False, "errors": ["Erro interno. Tente novamente."]}), 500
