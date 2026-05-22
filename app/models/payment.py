import uuid
from datetime import datetime, timezone

def payment_model(user, order, method: str, amount: float):
    """
    Representa o documento principal de pagamento.
    Coleção recomendada: db.payments
    """
    return {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user["full_name"],  # Desnormalização para facilitar consultas na listagem do admin
        "order_id": order["id"],
        "method": method,  # 'CREDIT_CARD', 'PIX', 'BOLETO'
        "status": "PENDING",  # 'PENDING', 'PAID', 'FAILED', 'REFUNDED'
        "amount": float(amount),
        "paid_at": None,
        "transaction_id": None,  # ID retornado pelo Gateway (Stripe, MercadoPago, etc)
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }