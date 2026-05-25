from fastapi import APIRouter, Depends, HTTPException, Body
from app.core.security import get_current_user
from app.services.payment_service import process_payment_webhook
from app.core.database import db
import uuid
from datetime import datetime, timezone

router = APIRouter()

@router.post("/checkout")
async def create_checkout(
    payload: dict = Body(...), 
    user=Depends(get_current_user)
):
    """
    Rota acionada quando o paciente escolhe a forma de pagamento no app.
    Gera o registro PENDING na coleção 'payments'.
    """
    order_id = payload.get("order_id")
    method = payload.get("method")  # 'PIX', 'CREDIT_CARD', 'BOLETO'

    if not order_id or not method:
        raise HTTPException(status_code=400, detail="order_id e method são obrigatórios")

    # Busca o pedido correspondente para conferir o valor total
    order = await db["orders"].find_one(
    {"id": order_id}
)   
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    # Monta o documento no padrão do MongoDB
    payment_id = str(uuid.uuid4())
    payment_document = {
        "id": payment_id,
        "user_id": user["id"],
        "user_name": user.get("full_name"),
        "order_id": order_id,
        "method": method,
        "status": "PENDING",
        "amount": float(order.get("total", 0)),
        "paid_at": None,
        "transaction_id": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    await db["payments"].insert_one(
    payment_document
    )

    
    return {
        "message": "Checkout iniciado com sucesso",
        "payment_id": payment_id,
        "status": "PENDING",
        "amount": payment_document["amount"]
    }


@router.post("/webhooks/{gateway}")
async def gateway_webhook(gateway: str, payload: dict = Body(...)):
    """
    Endpoint público e assíncrono que escuta as notificações de pagamento dos gateways.
    """
    try:
        result = await process_payment_webhook(gateway, payload)
        return result
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))