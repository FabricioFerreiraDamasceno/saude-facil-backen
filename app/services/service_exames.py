from app.db.mongo import db


async def list_exams(
    q: str | None = None,
    category: str | None = None,
):
    query = {}

    if category and category != "ALL":
        query["category"] = category

    if q:
        query["$or"] = [
            {
                "name": {
                    "$regex": q,
                    "$options": "i",
                }
            },
            {
                "category": {
                    "$regex": q,
                    "$options": "i",
                }
            },
        ]

    exams = await db.exams.find(
        query,
        {"_id": 0},
    ).to_list(1000)

    return exams