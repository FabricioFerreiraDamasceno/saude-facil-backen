from fastapi import APIRouter, Depends, HTTPException
from app.schemas.auth import RegisterIn, LoginIn
from app.services.auth_service import register_user, login_user
from app.core.security import get_current_user, create_access_token
from app.core.config import settings
from app.core.database import db
from pydantic import BaseModel
from jose import JWTError, jwt
from datetime import datetime, timedelta

router = APIRouter()

class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/register")
async def register(body: RegisterIn):
    return await register_user(body)


@router.post("/login")
async def login(body: LoginIn):
    return await login_user(body)


@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return current_user


@router.post("/refresh")
async def refresh_token(request: RefreshTokenRequest):
    """Renovar token de acesso usando refresh token"""
    try:
        # Decodifica o refresh token
        payload = jwt.decode(
            request.refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        user_id = payload.get("sub")
        token_type = payload.get("type")
        
        if not user_id or token_type != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        # Busca usuário no banco
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Gera novo access token (short-lived)
        access_token = create_access_token(
            data={"sub": user_id, "type": "access"},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
        
    except JWTError as e:
        print(f"JWT Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")