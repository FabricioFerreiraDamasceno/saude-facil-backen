# app/services/order_service.py

import uuid
from datetime import datetime, timezone

from app.core.database import db


async def create_order(data, user):
    """
    Cria pedido no MongoDB
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

        # ✅ Collection Mongo correta
        await db["orders"].insert_one(order)

        return order

    except Exception as e:
        raise Exception(
            f"Erro ao criar pedido: {str(e)}"
        )