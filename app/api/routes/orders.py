# app/api/routes/orders.py

from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid

from app.core.security import get_current_user
from app.schemas.order import OrderIn
from app.core.database import db

router = APIRouter()


@router.post("")
async def create_order_endpoint(
    data: OrderIn,
    user=Depends(get_current_user)
):
    """
    Cria um novo pedido
    """

    try:
        total = sum(
            item.price * item.quantity
            for item in data.items
        )

        order = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "user_email": user.get("email"),
            "user_name": (
                user.get("full_name")
                or user.get("name")
            ),
            "items": [
                item.dict()
                for item in data.items
            ],
            "total": total,
            "status": "PENDING",
            "payment_id": None,
            "payment_status": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

        # ✅ Mongo collection correta
        await db["orders"].insert_one(order)

        return {
            "id": order["id"],
            "status": order["status"],
            "total": order["total"],
            "items": order["items"]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar pedido: {str(e)}"
        )


@router.get("")
async def get_orders(
    user=Depends(get_current_user)
):
    """
    Lista pedidos do usuário
    """

    try:
        orders = await db["orders"].find(
            {"user_id": user["id"]}
        ).to_list(length=100)

        return orders

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar pedidos: {str(e)}"
        )


@router.get("/{order_id}")
async def get_order(
    order_id: str,
    user=Depends(get_current_user)
):
    """
    Busca um pedido específico
    """

    try:
        order = await db["orders"].find_one({
            "id": order_id,
            "user_id": user["id"]
        })

        if not order:
            raise HTTPException(
                status_code=404,
                detail="Pedido não encontrado"
            )

        return order

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar pedido: {str(e)}"
        )