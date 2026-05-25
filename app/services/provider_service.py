import uuid

from app.core.database import db


async def list_providers(
    q: str | None = None,
    type: str | None = None,
):
    query = {
        "approved": True,
        "status": "ACTIVE",
    }

    if type and type != "ALL":
        query["type"] = type

    if q:
        query["$or"] = [
            {
                "full_name": {
                    "$regex": q,
                    "$options": "i",
                }
            },
            {
                "specialty": {
                    "$regex": q,
                    "$options": "i",
                }
            },
        ]

    providers = await db.providers.find(
        query,
        {"_id": 0},
    ).to_list(200)

    return providers


async def create_provider(data):
    existing = await db.providers.find_one({
        "crm": data.crm
    })

    if existing:
        return existing

    provider = {
        "id": str(uuid.uuid4()),
        **data.dict(),
        "approved": True,
        "status": "ACTIVE",
        "rating": 5.0,
        "rating_count": 0,
    }

    await db["providers"].insert_one(provider)

    return provider