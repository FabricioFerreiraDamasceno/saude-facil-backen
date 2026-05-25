import uuid
from datetime import datetime, timezone
from app.core.database import db


async def create_order(data, user):
    total = sum(
        i.price * i.quantity
        for i in data.items
    )

    order = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "items": [
            i.dict()
            for i in data.items
        ],
        "total": float(total),
        "status": "PENDING",
        "created_at": datetime.now(
            timezone.utc
        ),
        "updated_at": datetime.now(
            timezone.utc
        ),
    }

    # ✅ CORREÇÃO
    await db.orders.insert_one(order)

    return order