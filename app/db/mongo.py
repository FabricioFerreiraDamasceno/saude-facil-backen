import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))


env_path = os.path.join(BASE_DIR, ".env")

load_dotenv(env_path)

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

print("📂 ENV PATH:", env_path)
print("🔌 MONGO_URL:", MONGO_URL)
print("🗄 DB_NAME:", DB_NAME)

if not MONGO_URL:
    raise Exception("❌ MONGO_URL não definido")

if not DB_NAME:
    raise Exception("❌ DB_NAME não definido")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]