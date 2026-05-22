import uuid

from fastapi import HTTPException
from datetime import datetime, timezone

from app.core.database import db


async def create_appointment(data, user):

    provider = await db.providers.find_one({
        "id": data.provider_id
    })

    if not provider:
        raise HTTPException(
            status_code=404,
            detail="Profissional não encontrado"
        )

    existing = await db.appointments.find_one({
        "provider_id": data.provider_id,
        "start_datetime": data.start_datetime,
        "status": {
            "$in": ["PENDING", "CONFIRMED"]
        }
    })

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Horário já reservado"
        )

    slot = await db.slots.find_one({
        "provider_id": data.provider_id,
        "start_datetime": data.start_datetime,
        "is_available": True
    })

    if not slot:
        raise HTTPException(
            status_code=400,
            detail="Horário indisponível"
        )

    appointment = {
        "id": str(uuid.uuid4()),

        "patient_id": user["id"],
        "patient_name": user.get("full_name"),

        "provider_id": provider["id"],
        "provider_name": provider.get("full_name"),

        "start_datetime": data.start_datetime,

        "modality": data.modality,

        "price": provider.get("base_price", 0),

        "status": "PENDING",

        "created_at": datetime.now(timezone.utc),
    }

    await db.appointments.insert_one(appointment)

    await db.slots.update_one(
        {
            "id": slot["id"]
        },
        {
            "$set": {
                "is_available": False
            }
        }
    )

    return appointment