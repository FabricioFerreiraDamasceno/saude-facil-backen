import uuid
import logging

from datetime import (
    datetime,
    timezone,
)

from fastapi import (
    HTTPException,
)

from app.core.database import db
from app.utils.commission import (
    get_commission_rate,
)

logger = logging.getLogger(__name__)


async def process_payment_webhook(
    gateway: str,
    payload: dict
):
    """
    Processa webhook do gateway
    """

    try:
        payment_id = payload.get(
            "payment_id"
        )

        status = payload.get(
            "status",
            "APPROVED"
        )

        if not payment_id:
            raise HTTPException(
                status_code=400,
                detail="payment_id é obrigatório"
            )

        # salvar evento webhook
        webhook_data = {
            "id": str(uuid.uuid4()),
            "gateway": gateway,
            "event_type": payload.get(
                "type",
                "payment"
            ),
            "payload": payload,
            "processed": False,
            "created_at": datetime.now(
                timezone.utc
            )
        }

        await db.webhook_events.insert_one(webhook_data)

        logger.info(
            f"Webhook recebido "
            f"{gateway} "
            f"payment_id={payment_id}"
        )

        # buscar pagamento
        payment = await db.payments.find_one(
            {
                "id": payment_id
            }
        )

        if not payment:
            raise HTTPException(
                status_code=404,
                detail="Pagamento não encontrado"
            )

        # atualizar pagamento
        await db.payments.update_one(
            {
                "id": payment_id
            },
            {
                "$set": {
                    "status": status,
                    "paid_at": datetime.now(
                        timezone.utc
                    ),
                    "updated_at": datetime.now(
                        timezone.utc
                    )
                }
            }
        )

        logger.info(
            f"Pagamento atualizado "
            f"{payment_id} -> {status}"
        )

        # confirmar pedido
        if status.upper() in [
            "APPROVED",
            "PAID",
            "SUCCESS"
        ]:
            await confirm_order_and_appointment(
                payment["order_id"]
            )

        # marcar evento processado
        await db.webhook_events.update_one(
            {
                "id":  webhook_data["id"]
            },
            {
                "$set": {
                    "processed": True
                }
            }
        )

        return {
            "success": True,
            "message":
                "Webhook processado",
            "payment_id":
                payment_id,
            "status":
                status
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.exception(
            "Erro ao processar webhook"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


async def confirm_order_and_appointment(
    order_id: str
):
    """
    Confirma pedido,
    appointment
    e gera comissão
    """

    order = await db.orders.find_one(
        {
            "id": order_id
        }
    )

    if not order:
        logger.warning(
            f"Pedido não encontrado: "
            f"{order_id}"
        )
        return

    # atualizar pedido
    await db.orders.update_one(
        {
            "id": order_id
        },
        {
            "$set": {
                "status": "PAID",
                "payment_status":
                    "APPROVED",
                "updated_at":
                    datetime.now(
                        timezone.utc
                    )
            }
        }
    )

    logger.info(
        f"Pedido confirmado: "
        f"{order_id}"
    )

    # confirmar appointment
    appointment_id = order.get(
        "appointment_id"
    )

    if appointment_id:

        appointment = (
            await db.appointments.find_one(
                {
                    "id":
                    appointment_id
                }
            )
        )

        if appointment:

            await db.appointments.update_one(
                {
                    "id":
                    appointment_id
                },
                {
                    "$set": {
                        "status":
                            "CONFIRMED",
                        "updated_at":
                            datetime.now(
                                timezone.utc
                            )
                    }
                }
            )

            logger.info(
                f"Appointment confirmado: "
                f"{appointment_id}"
            )

    # gerar comissão
    total_commission = 0.0

    for item in order.get(
        "items",
        []
    ):

        item_type = item.get(
            "type",
            "CONSULTATION"
        )

        rate = get_commission_rate(
            item_type
        )

        price = float(
            item.get(
                "price",
                0
            )
        )

        quantity = int(
            item.get(
                "quantity",
                1
            )
        )

        total_commission += (
            price *
            quantity
        ) * rate

    gross_amount = float(
        order.get(
            "total",
            0
        )
    )

    net_amount = (
        gross_amount -
        total_commission
    )

    commission_document = {
        "id":
            str(uuid.uuid4()),
        "order_id":
            order_id,
        "provider_id":
            order.get(
                "provider_id"
            ),
        "provider_name":
            order.get(
                "provider_name"
            ),
        "gross_amount":
            gross_amount,
        "commission_amount":
            round(
                total_commission,
                2
            ),
        "net_amount":
            round(
                net_amount,
                2
            ),
        "is_paid":
            False,
        "paid_at":
            None,
        "created_at":
            datetime.now(
                timezone.utc
            )
    }

    await db.commissions.insert_one(
        commission_document
    )

    logger.info(
        f"Comissão criada "
        f"para pedido "
        f"{order_id}"
    )