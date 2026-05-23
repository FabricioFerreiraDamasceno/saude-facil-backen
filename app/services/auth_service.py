# app/services/auth_service.py
from app.db.mongo import db
from passlib.context import CryptContext
from datetime import datetime, timedelta
from fastapi import HTTPException
import jwt
import os
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuração de hash de senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuração JWT
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    logger.error("❌ JWT_SECRET não definido! Usando valor padrão para desenvolvimento")
    JWT_SECRET = "dev_secret_key_change_in_production"

JWT_EXPIRE_MINUTES = 60 * 24  # 1 dia


# ========== FUNÇÕES AUXILIARES ==========

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    password = password[:72]
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain[:72], hashed)


def create_token(user_id: str, email: str) -> str:
    """Create a JWT token for a user"""
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


# ========== FUNÇÃO DE REGISTRO ==========

async def register_user(data):
    """Register a new user"""
    email = data.email.lower().strip()
    logger.info(f"📝 Tentativa de registro: {email}")
    
    try:
        # Verificar se usuário já existe
        existing_user = await db.users.find_one({"email": email})
        if existing_user:
            logger.warning(f"❌ Usuário já existe: {email}")
            raise HTTPException(status_code=400, detail="Usuário já existe")
        
        # Criar novo usuário
        new_user = {
            "full_name": data.full_name,
            "email": email,
            "password_hash": hash_password(data.password),
            "role": "USER",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.users.insert_one(new_user)
        logger.info(f"✅ Usuário criado com ID: {result.inserted_id}")
        
        # Criar token
        token = create_token(str(result.inserted_id), email)
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": str(result.inserted_id),
                "email": email,
                "full_name": data.full_name,
                "role": "USER"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao registrar usuário: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao registrar: {str(e)}")


# ========== FUNÇÃO DE LOGIN ==========

async def login_user(data):
    """Authenticate a user and return a token"""
    email = data.email.lower().strip()
    logger.info(f"🔐 Tentativa de login: {email}")
    
    try:
        # Buscar usuário
        user = await db.users.find_one({"email": email})
        
        if not user:
            logger.warning(f"❌ Usuário não encontrado: {email}")
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        
        # Verificar senha
        password_hash = user.get("password_hash") or user.get("password")
        
        if not password_hash:
            logger.error(f"❌ Usuário sem senha: {email}")
            raise HTTPException(status_code=401, detail="Erro na autenticação")
        
        if not verify_password(data.password, password_hash):
            logger.warning(f"❌ Senha inválida para: {email}")
            raise HTTPException(status_code=401, detail="Senha inválida")
        
        # Criar token
        token = create_token(str(user["_id"]), user["email"])
        
        # Atualizar último login
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        logger.info(f"✅ Login bem-sucedido: {email}")
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "full_name": user.get("full_name", user.get("fullName", "")),
                "role": user.get("role", "USER")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro no login: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


# ========== FUNÇÃO PARA OBTER USUÁRIO ATUAL ==========

async def get_current_user_from_token(token: str):
    """Get current user from JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id:
            return None
        
        from bson import ObjectId
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return None
        
        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user.get("full_name", user.get("fullName", "")),
            "role": user.get("role", "USER")
        }
        
    except jwt.ExpiredSignatureError:
        logger.warning("Token expirado")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Token inválido: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Erro ao obter usuário: {str(e)}")
        return None
