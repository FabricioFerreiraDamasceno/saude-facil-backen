import uuid
from datetime import datetime, timezone

def transaction_model(payment_id: str, amount: float, gateway: str, gateway_transaction_id: str, status: str, raw_response: dict):
    """
    Histórico detalhado de tentativas/logs de transações financeiras.
    Coleção recomendada: db.transactions
    """
    return {
        "id": str(uuid.uuid4()),
        "payment_id": payment_id,
        "amount": float(amount),
        "gateway": gateway,  # ex: 'STRIPE', 'MERCADO_PAGO'
        "gateway_transaction_id": gateway_transaction_id,
        "status": status,  # Status cru retornado pelo gateway
        "raw_response": raw_response,  # Resposta completa da API do gateway para auditoria
        "processed_at": datetime.now(timezone.utc)
    }