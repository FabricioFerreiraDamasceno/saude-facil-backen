from typing import Optional

from fastapi import APIRouter

from app.db.mongo import db
from app.services.service_exames import (
    list_exams,
)

# PUBLIC ROUTER
router = APIRouter()


@router.get("")
async def exams(
    q: Optional[str] = None,
    category: Optional[str] = None,
):
    return await list_exams(
        q=q,
        category=category,
    )


admin_router = APIRouter(prefix="/admin/batch")


@admin_router.post("/exams")
async def batch_exams(payload: dict):
    exams = payload.get("exams", [])

    if not exams:
        return {"inserted": 0}

    result = await db.exams.insert_many(exams)

    return {
        "inserted": len(result.inserted_ids)
    }