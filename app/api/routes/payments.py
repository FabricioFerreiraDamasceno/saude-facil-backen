from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Body,
)

from datetime import (
    datetime,
    timezone,
)

import uuid

from app.core.security import (
    get_current_user,
)

from app.services.payment_service import (
    process_payment_webhook,
)

from app.core.database import db


router = APIRouter()


@router.post("/checkout")
async def create_checkout(
    payload: dict = Body(...),
    user=Depends(get_current_user),
):
    """
    Cria um pagamento pendente
    """

    try:
        order_id = payload.get("order_id")
        method = payload.get("method")

        if not order_id:
            raise HTTPException(
                status_code=400,
                detail="order_id é obrigatório",
            )

        if not method:
            raise HTTPException(
                status_code=400,
                detail="method é obrigatório",
            )

        # buscar pedido
        order = await db.orders.find_one({
            "id": order_id
        })

        if not order:
            raise HTTPException(
                status_code=404,
                detail="Pedido não encontrado",
            )

        payment_id = str(uuid.uuid4())

        payment_document = {
            "id": payment_id,
            "user_id": user["id"],
            "user_email": user.get("email"),
            "user_name": user.get("full_name"),
            "order_id": order_id,
            "method": method,
            "status": "PENDING",
            "amount": float(
                order.get("total", 0)
            ),
            "transaction_id": None,
            "paid_at": None,
            "created_at": datetime.now(
                timezone.utc
            ),
            "updated_at": datetime.now(
                timezone.utc
            ),
        }

        await db.payments.insert_one(
            payment_document
        )

        return {
            "message":
                "Checkout iniciado",
            "payment_id":
                payment_id,
            "status":
                "PENDING",
            "amount":
                payment_document["amount"],
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro checkout: {str(e)}"
        )


@router.post("/webhooks/{gateway}")
async def gateway_webhook(
    gateway: str,
    payload: dict = Body(...),
):
    """
    Endpoint webhook gateway
    """

    try:
        result = await (
            process_payment_webhook(
                gateway,
                payload
            )
        )

        return result

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro webhook: {str(e)}"
        )