import uuid
from datetime import datetime, timezone

def order_model(user, items, total):
    return {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "items": items,
        "total": total,
        "status": "PENDING",
        "created_at": datetime.now(timezone.utc),
    }