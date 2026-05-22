import uuid
from datetime import datetime, timezone

def appointment_model(user, provider, data):
    return {
        "id": str(uuid.uuid4()),
        "patient_id": user["id"],
        "patient_name": user["full_name"],
        "provider_id": provider["id"],
        "provider_name": provider["full_name"],
        "start_datetime": data.start_datetime,
        "modality": data.modality,
        "status": "PENDING",
        "price": provider.get("base_price", 0),
        "created_at": datetime.now(timezone.utc),
    }