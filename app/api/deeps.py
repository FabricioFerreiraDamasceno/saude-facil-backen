from fastapi import Depends, HTTPException, Request
from app.core.security import get_current_user
from app.core.database import db
from app.core.security import jwt
import os
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

security = get_current_user(auto_error=False)  

async def get_user(request: Request, token: str = Depends(security)):
    """
    Valida o token JWT e retorna o usuário
    """
    logger.info("=" * 50)
    logger.info("🔐 AUTHENTICATION STARTED")
    
    # 1. Verificar se o token foi enviado
    if not token:
        logger.error("❌ No token provided")
        raise HTTPException(status_code=401, detail="No authentication token provided")
    
    logger.info(f"✅ Token received: {token.credentials[:50]}...")
    
    # 2. Verificar headers da requisição
    auth_header = request.headers.get("authorization")
    logger.info(f"📋 Authorization header: {auth_header[:50] if auth_header else 'None'}...")
    
    try:
        # 3. Tentar decodificar o token
        logger.info("🔓 Attempting to decode token...")
        secret_key = os.environ.get("JWT_SECRET")
        logger.info(f"🔑 JWT_SECRET exists: {bool(secret_key)}")
        
        if not secret_key:
            logger.error("❌ JWT_SECRET not configured!")
            raise HTTPException(status_code=500, detail="Server configuration error")
        
        payload = jwt.decode(
            token.credentials, 
            secret_key, 
            algorithms=["HS256"]
        )
        
        logger.info(f"✅ Token decoded successfully")
        logger.info(f"📦 Payload: {payload}")
        
        user_id = payload.get("sub")
        logger.info(f"👤 User ID from token: {user_id}")
        
        if not user_id:
            logger.error("❌ No 'sub' field in token payload")
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # 4. Buscar usuário no banco de dados
        logger.info(f"🔍 Looking for user with id: {user_id}")
        user = await db.users.find_one({"id": user_id})
        
        if not user:
            logger.error(f"❌ User not found with id: {user_id}")
            raise HTTPException(status_code=401, detail="User not found")
        
        logger.info(f"✅ User found: {user.get('email')}")
        logger.info("=" * 50)
        
        # Converter ObjectId para string para serialização
        if "_id" in user:
            user["_id"] = str(user["_id"])
        
        return user
        
    except jwt.ExpiredSignatureError:
        logger.error("❌ Token has expired")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        logger.error(f"❌ Invalid token: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Unexpected error: {str(e)}")
        raise HTTPException(status_code=401, detail=str(e))