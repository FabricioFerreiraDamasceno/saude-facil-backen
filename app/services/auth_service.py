from app.db.mongo import db
from passlib.context import CryptContext
from datetime import datetime, timedelta
from fastapi import HTTPException
import jwt
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise Exception("JWT_SECRET não definido")

JWT_EXPIRE_MINUTES = 60 * 24  # 1 dia


# 🔐 PASSWORD
def hash_password(password: str) -> str:
    password = password[:72]
    return pwd_context.hash(password)


def verify_password(plain, hashed):
    return pwd_context.verify(plain[:72], hashed)


# 🔑 TOKEN
def create_token(user_id: str, email: str):
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


# 🧾 REGISTER
async def register_user(data):
    email = data.email.lower().strip()

    user = await db.users.find_one({"email": email})
    if user:
        raise HTTPException(status_code=400, detail="Usuário já existe")

    new_user = {
        "full_name": data.full_name,
        "email": email,
        "password": hash_password(data.password),
        "role": "USER",
        "created_at": datetime.utcnow()
    }

    result = await db.users.insert_one(new_user)

    token = create_token(str(result.inserted_id), email)

    return {
        "access_token": token,
        "user": {
            "id": str(result.inserted_id),
            "email": email,
            "full_name": data.full_name,
            "role": "USER"
        }
    }


# 🔓 LOGIN
async def login_user(data):
    email = data.email.lower().strip()

    user = await db.users.find_one({"email": email})

    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")

    if not verify_password(
    data.password,
    user["password_hash"]
):
        raise HTTPException(status_code=401, detail="Senha inválida")

    token = create_token(str(user["_id"]), user["email"])

    return {
        "access_token": token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user.get("role", "USER")
        }
    }