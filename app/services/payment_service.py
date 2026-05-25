import uuid
from datetime import datetime, timezone
from fastapi import HTTPException
from app.core.database import db
from app.utils.commission import get_commission_rate  

import logging
async def process_payment_webhook(
    gateway: str,
    payload: dict
):
    """
    Processa webhook do gateway
    """
    logger = logging.getLogger(__name__)
    try:
        event = {
            "id": str(uuid.uuid4()),
            "gateway": gateway,
            "event_type": payload.get(
                "type",
                "unknown"
            ),
            "payload": payload,
            "processed": False,
            "created_at": datetime.now(
                timezone.utc
            )
        }

        # salva evento
        await db["webhook_events"].insert_one(
            event
        )

        logger.info(
            f"Webhook recebido: {gateway}"
        )

        return {
            "success": True,
            "message": "Webhook processado"
        }

    except Exception as e:
        logger.exception(
            "Erro ao processar webhook"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


async def confirm_order_and_appointment(order_id: str):
    """
    Atualiza o pedido para PAID, confirma o Appointment associado e gera a comissão.
    """
    # 1. Busca e atualiza o Pedido (Order)
    order = await db.orders.find_one({"id": order_id})
    if not order:
        return

    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": "PAID", "updated_at": datetime.now(timezone.utc)}}
    )

    # 2. Se houver um agendamento (Appointment) vinculado a este pedido, altera para CONFIRMED
    # Seus appointments usam 'status': 'PENDING' na criação. Aqui mudamos para 'CONFIRMED'
    appointment = await db.appointments.find_one({"id": order.get("appointment_id")})
    if appointment:
        await db.appointments.update_one(
            {"id": appointment["id"]},
            {"$set": {"status": "CONFIRMED", "updated_at": datetime.now(timezone.utc)}}
        )

    # 3. Processamento de Comissões utilizando suas regras de 'utils'
    # Vamos iterar pelos itens do pedido para aplicar as taxas corretas
    total_commission = 0.0
    items = order.get("items", [])

    for item in items:
        # Passa o tipo ("EXAM", "PRODUCT", etc.) para a sua função utilitária
        item_type = item.get("type", "CONSULTATION")
        rate = get_commission_rate(item_type)
        
        item_price = float(item.get("price", 0))
        item_qty = int(item.get("quantity", 1))
        
        # Calcula a comissão do item
        total_commission += (item_price * item_qty) * rate

    gross_amount = float(order.get("total", 0))
    net_amount = gross_amount - total_commission

    # 4. Salva o documento de comissão na coleção 'commissions'
    commission_document = {
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "provider_id": order.get("provider_id"),
        "provider_name": order.get("provider_name"),
        "gross_amount": gross_amount,
        "commission_amount": round(total_commission, 2),
        "net_amount": round(net_amount, 2),
        "is_paid": False,
        "paid_at": None,
        "created_at": datetime.now(timezone.utc)
    }
    await db.commissions.insert_one(commission_document)