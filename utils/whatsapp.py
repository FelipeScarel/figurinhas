import urllib.parse
from config import Config


def generate_whatsapp_message(order_data):
    lines = [
        "\U0001F3A8 *NOVO PEDIDO DE ORÇAMENTO* \U0001F3A8",
        "",
        f"*Cliente:* {order_data['cliente_nome']}",
        f"*WhatsApp:* {order_data['cliente_whatsapp']}",
        f"*Quantidade:* {order_data['quantidade']} unidades",
        f"*Tamanho:* {order_data.get('tamanho_estimado', 'Não informado')}",
        f"*Acabamento:* {order_data['tipo_acabamento']}",
    ]

    if order_data.get("urgencia"):
        lines.append(f"*Urgência:* {order_data['urgencia']}")

    if order_data.get("referencia_figurinha_id"):
        lines.append(f"*Modelo Ref:* #{order_data['referencia_figurinha_id']}")

    if order_data.get("observacoes"):
        lines.append(f"*Observações:* {order_data['observacoes']}")

    if order_data.get("arquivos_count"):
        lines.append(f"\U0001F4CE *{order_data['arquivos_count']} arquivo(s) enviado(s)*")

    lines.append("")
    lines.append(f"\U0001F194 Pedido #{order_data.get('order_id', 'NOVO')}")

    message = "\n".join(lines)
    encoded = urllib.parse.quote(message)
    return f"https://api.whatsapp.com/send?phone={Config.WHATSAPP_NUMBER}&text={encoded}"
