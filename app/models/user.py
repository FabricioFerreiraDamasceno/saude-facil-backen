import uuid
from datetime import datetime, timezone

def user_model(data: dict):
    return {
        "id": str(uuid.uuid4()),
        "email": data["email"],
        "password_hash": data.get("password_hash"),
        "full_name": data["full_name"],
        "phone": data.get("phone"),
        "role": data.get("role", "PATIENT"),
        "status": "ACTIVE",
        "avatar": data.get("avatar"),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }