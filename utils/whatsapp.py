import urllib.parse
from config import Config


def generate_whatsapp_message(order_data):
    lines = [
        "🎨 *NOVO PEDIDO DE ORÇAMENTO* 🎨",
        "",
        f"*Cliente:* {order_data['customer_name']}",
        f"*WhatsApp:* {order_data['customer_whatsapp']}",
        f"*Quantidade:* {order_data['quantity']} unidades",
        f"*Tamanho:* {order_data.get('estimated_size', 'Não informado')}",
        f"*Acabamento:* {order_data['finish_type']}",
    ]

    if order_data.get("reference_product_id"):
        lines.append(f"*Modelo Ref:* #{order_data['reference_product_id']}")

    if order_data.get("notes"):
        lines.append(f"*Observações:* {order_data['notes']}")

    if order_data.get("artwork_path"):
        lines.append("")
        lines.append("📎 _Arte enviada pelo cliente_")

    lines.append("")
    lines.append(f"🆔 Pedido #{order_data.get('order_id', 'NOVO')}")

    message = "\n".join(lines)
    encoded = urllib.parse.quote(message)
    return f"https://api.whatsapp.com/send?phone={Config.WHATSAPP_NUMBER}&text={encoded}"
