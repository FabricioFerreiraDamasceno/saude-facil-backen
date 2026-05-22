# app/core/security.py
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.core.database import db
from bson import ObjectId

JWT_ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_access_token(user_id: str, email: str):
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access"
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=JWT_ALGORITHM)

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Valida o token JWT e retorna o usuário
    """
    try:
        token = credentials.credentials
        print(f"🔍 Decodificando token: {token[:50]}...")
        
        # Decodificar token
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET, 
            algorithms=[JWT_ALGORITHM]
        )
        
        user_id = payload.get("sub")
        print(f"👤 User ID do token: {user_id}")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido: sem user_id")
        
        # Buscar usuário no banco - CORREÇÃO AQUI
        user = await db.users.find_one({"id": user_id})
        
        user = await db.users.find_one({"id": user_id})
        if not user:
            try:
                user = await db.users.find_one({"_id": ObjectId(user_id)})
                if user:
                    # Adicionar campo id para compatibilidade
                    user["id"] = str(user["_id"])
            except:
                pass
        
        if not user:
            print(f"❌ Usuário não encontrado: {user_id}")
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        
        print(f"✅ Usuário encontrado: {user.get('email')}")
        
        # Converter ObjectId para string
        if "_id" in user:
            user["_id"] = str(user["_id"])
        
        return user
        
    except jwt.ExpiredSignatureError:
        print("❌ Token expirado")
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError as e:
        print(f"❌ Token inválido: {e}")
        raise HTTPException(status_code=401, detail=f"Token inválido: {str(e)}")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        raise HTTPException(status_code=401, detail=f"Erro de autenticação: {str(e)}")