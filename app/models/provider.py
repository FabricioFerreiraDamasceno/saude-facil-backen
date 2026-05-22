import uuid
from datetime import datetime, timezone

def provider_model(data: dict):
    return {
        "id": str(uuid.uuid4()),
        "full_name": data["full_name"],
        "type": data["type"],
        "specialty": data["specialty"],
        "crm": data.get("crm"),
        "bio": data.get("bio"),
        "avatar": data.get("avatar"),
        "base_price": data.get("base_price", 0),
        "approved": True,
        "status": "ACTIVE",
        "rating": 5.0,
        "rating_count": 0,
        "created_at": datetime.now(timezone.utc),
    }