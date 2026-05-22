import os
import uuid

from datetime import datetime, timedelta

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

print("MONGO_URL:", MONGO_URL)
print("DB_NAME:", DB_NAME)

client = MongoClient(MONGO_URL)

db = client[DB_NAME]

provider = db.providers.find_one()

if not provider:
    print("❌ Nenhum provider encontrado")
    exit()

provider_id = provider["id"]

print("✅ Provider encontrado:", provider["full_name"])

slots = []

base_day = datetime.now().replace(
    hour=8,
    minute=0,
    second=0,
    microsecond=0,
)

for day in range(0, 7):

    current_day = base_day + timedelta(days=day)

    for hour in [8, 9, 10, 11, 14, 15, 16, 17]:

        slot_datetime = current_day.replace(
            hour=hour
        )

        exists = db.slots.find_one({
            "provider_id": provider_id,
            "start_datetime": slot_datetime.isoformat(),
        })

        if exists:
            continue

        slots.append({
            "id": str(uuid.uuid4()),
            "provider_id": provider_id,
            "start_datetime": slot_datetime.isoformat(),
            "is_available": True,
        })

if slots:
    db.slots.insert_many(slots)

print(f"✅ {len(slots)} slots criados")