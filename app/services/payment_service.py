import uuid
from datetime import datetime, timezone
from fastapi import HTTPException
from app.core.database import db
from app.utils.commission import get_commission_rate  

async def process_payment_webhook(gateway: str, payload: dict):
    """
    Processa o webhook vindo do Gateway de Pagamento de forma assíncrona no Mongo.
    """
    # 1. Registra o evento de Webhook recebido para fins de auditoria
    event = {
        "id": str(uuid.uuid4()),
        "gateway": gateway,
        "event_type": payload.get("type", "unknown"),
        "payload": payload,
        "processed": False,
        "created_at": datetime.now(timezone.utc)
    }
    await db.webhook_events.insert_one(event)

    # 2. Captura os dados de referência enviados pelo gateway
    payment_id = payload.get("payment_id")
    status_gateway = payload.get("status")  # ex: 'approved', 'failed'

    if not payment_id:
        raise HTTPException(status_code=400, detail="ID de pagamento ausente no payload")

    # 3. Busca o pagamento pendente no MongoDB
    payment = await db.payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail=f"Pagamento {payment_id} não encontrado")

    # 4. Atualiza o status com base no retorno
    new_status = "PENDING"
    if status_gateway == "approved":
        new_status = "PAID"
    elif status_gateway == "failed":
        new_status = "FAILED"

    await db.payments.update_one(
        {"id": payment_id},
        {
            "$set": {
                "status": new_status,
                "transaction_id": payload.get("transaction_id"),
                "paid_at": datetime.now(timezone.utc) if new_status == "PAID" else None,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )

    # 5. Se o pagamento foi aprovado com sucesso, engatilha a confirmação do fluxo
    if new_status == "PAID":
        await confirm_order_and_appointment(payment["order_id"])

    # 6. Marca o evento como processado
    await db.webhook_events.update_one(
        {"id": event["id"]},
        {
            "$set": {
                "processed": True,
                "processed_at": datetime.now(timezone.utc)
            }
        }
    )

    return {"status": "success", "payment_status": new_status}


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