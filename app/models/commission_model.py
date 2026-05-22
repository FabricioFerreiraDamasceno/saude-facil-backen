import uuid
from datetime import datetime, timezone

def commission_model(order, provider, rule, gross_amount: float, commission_amount: float):
    """
    Comissão calculada e gerada após a confirmação de um pagamento de pedido.
    Coleção recomendada: db.commissions
    """
    gross = float(gross_amount)
    comm = float(commission_amount)
    net = gross - comm  # Calcula o valor líquido que vai para o prestador de serviço

    return {
        "id": str(uuid.uuid4()),
        "order_id": order["id"],
        "provider_id": provider["id"],
        "provider_name": provider["full_name"],  # Desnormalizado para relatórios financeiros mais velozes
        "rule_id": rule["id"],
        "module": rule["module"],
        "gross_amount": gross,
        "commission_amount": comm,
        "net_amount": net,
        "is_paid": False,  # Se a plataforma já repassou o dinheiro para o médico/clínica
        "paid_at": None,
        "created_at": datetime.now(timezone.utc)
    }