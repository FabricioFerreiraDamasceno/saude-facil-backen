import uuid
from app.core.database import db

async def create_order(data, user):
    total = sum(i.price * i.quantity for i in data.items)

    order = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "items": [i.dict() for i in data.items],
        "total": total,
        "status": "PENDING"
    }

    await db.orders.insert_one(order)
    return order