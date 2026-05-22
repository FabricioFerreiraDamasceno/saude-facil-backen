from datetime import datetime, timezone

def now_utc():
    return datetime.now(timezone.utc)

def serialize(doc: dict):
    if not doc:
        return doc
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return doc