import os

from dotenv import load_dotenv

from pymongo import MongoClient

from passlib.context import CryptContext

from datetime import datetime, timezone

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

print("MONGO_URL:", MONGO_URL)
print("DB_NAME:", DB_NAME)

client = MongoClient(MONGO_URL)

db = client[DB_NAME]

pwd = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

users = db.users

patient = {
    "full_name": "Paciente Teste",
    "email": "paciente@teste.com",
    "password_hash": pwd.hash("123456"),
    "role": "PATIENT",
    "created_at": datetime.now(timezone.utc),
}

doctor = {
    "full_name": "Dr. Guilherme Souza Maia",
    "email": "medico@teste.com",
    "password_hash": pwd.hash("123456"),
    "role": "PROVIDER",
    "created_at": datetime.now(timezone.utc),
}

if not users.find_one({
    "email": patient["email"]
}):
    users.insert_one(patient)
    print("✅ Paciente criado")
else:
    print("⚠️ Paciente já existe")

if not users.find_one({
    "email": doctor["email"]
}):
    users.insert_one(doctor)
    print("✅ Médico criado")
else:
    print("⚠️ Médico já existe")

print("✅ Seed finalizado")