import urllib.parse
from config import Config


def generate_whatsapp_message(order_data):
    lines = [
        "\U0001F48E *NOVO ORÇAMENTO PREMIUM* \U0001F48E",
        "",
        f"\U0001F464 *Cliente:* {order_data['cliente_nome']}",
        f"\U0001F4F1 *WhatsApp:* {order_data['cliente_whatsapp']}",
        f"\U0001F4E6 *Quantidade:* {order_data['quantidade']} unidades",
    ]

    # Dimensões
    largura = order_data.get("largura_cm", "")
    altura = order_data.get("altura_cm", "")
    if largura and altura:
        lines.append(f"\U0001F4CF *Dimensões:* {largura}cm × {altura}cm")
    elif order_data.get("tamanho_estimado"):
        lines.append(f"\U0001F4CF *Tamanho:* {order_data['tamanho_estimado']}")

    lines.append(f"\U0001F3A8 *Acabamento:* {order_data['tipo_acabamento']}")

    if order_data.get("urgencia"):
        lines.append(f"\U0001F534 *Urgência:* {order_data['urgencia']}")

    if order_data.get("referencia_figurinha_id"):
        lines.append(f"\U0001F3AF *Modelo Referência:* #{order_data['referencia_figurinha_id']}")

    if order_data.get("observacoes"):
        lines.append(f"\U0001F4DD *Observações:* {order_data['observacoes']}")

    if order_data.get("arquivos_count"):
        lines.append(f"\U0001F4CE *{order_data['arquivos_count']} arquivo(s) anexado(s)*")

    lines.append("")
    lines.append(f"\U00002721 Pedido #{order_data.get('order_id', 'NOVO')}")

    message = "\n".join(lines)
    encoded = urllib.parse.quote(message)
    return f"https://api.whatsapp.com/send?phone={Config.WHATSAPP_NUMBER}&text={encoded}"
