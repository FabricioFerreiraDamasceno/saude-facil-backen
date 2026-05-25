# app/services/auth_service.py

from app.db.mongo import db
from passlib.context import CryptContext
from datetime import datetime, timedelta
from fastapi import HTTPException
import jwt
import os
import logging
from bson import ObjectId

logger = logging.getLogger(__name__)

# =====================================================
# CONFIGURAÇÃO DE SENHA (BCRYPT)
# =====================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# =====================================================
# CONFIGURAÇÃO JWT
# =====================================================

JWT_SECRET = os.getenv(
    "JWT_SECRET",
    "dev_secret_key_change_in_production"
)

JWT_EXPIRE_MINUTES = 60 * 24  # 1 dia


# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================

def normalize_password(password: str) -> str:
    """
    Garante compatibilidade com bcrypt.
    bcrypt suporta no máximo 72 bytes.
    """

    encoded = password.encode("utf-8")

    if len(encoded) > 72:
        encoded = encoded[:72]

    return encoded.decode(
        "utf-8",
        errors="ignore"
    )


def hash_password(password: str) -> str:
    """
    Gera hash da senha.
    """

    normalized = normalize_password(
        password
    )

    return pwd_context.hash(
        normalized
    )


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """
    Verifica senha.
    """

    try:
        normalized = normalize_password(
            plain_password
        )

        return pwd_context.verify(
            normalized,
            hashed_password
        )

    except Exception as e:
        logger.error(
            f"❌ Erro ao verificar senha: {str(e)}"
        )
        return False


def create_token(
    user_id: str,
    email: str
) -> str:
    """
    Cria JWT do usuário.
    """

    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow()
        + timedelta(
            minutes=JWT_EXPIRE_MINUTES
        )
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm="HS256"
    )


# =====================================================
# REGISTRO
# =====================================================

async def register_user(data):
    """
    Registra novo usuário.
    """

    email = data.email.lower().strip()
    password = data.password

    logger.info(
        f"📝 Tentativa de registro: {email}"
    )

    try:
        # verificar usuário existente
        existing_user = (
            await db.users.find_one({
                "email": email
            })
        )

        if existing_user:
            logger.warning(
                f"❌ Usuário já existe: {email}"
            )

            raise HTTPException(
                status_code=400,
                detail="Usuário já existe"
            )

        # criar usuário
        new_user = {
            "full_name": data.full_name,
            "email": email,
            "password_hash": hash_password(
                password
            ),
            "role": "PATIENT",
            "created_at":
                datetime.utcnow(),
            "updated_at":
                datetime.utcnow()
        }

        result = (
            await db.users.insert_one(
                new_user
            )
        )

        logger.info(
            f"✅ Usuário criado: "
            f"{result.inserted_id}"
        )

        token = create_token(
            str(result.inserted_id),
            email
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id":
                    str(result.inserted_id),
                "email": email,
                "full_name":
                    data.full_name,
                "role": "PATIENT"
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(
            f"❌ Erro ao registrar: {str(e)}",
            exc_info=True
        )

        raise HTTPException(
            status_code=500,
            detail=f"Erro ao registrar: {str(e)}"
        )


# =====================================================
# LOGIN
# =====================================================

async def login_user(data):
    """
    Autentica usuário.
    """

    email = data.email.lower().strip()

    password = normalize_password(
        data.password
    )

    logger.info(
        f"🔐 Tentativa login: "
        f"{email} "
        f"(bytes="
        f"{len(password.encode('utf-8'))})"
    )

    try:
        # buscar usuário
        user = await db.users.find_one({
            "email": email
        })

        if not user:
            logger.warning(
                f"❌ Usuário não encontrado: "
                f"{email}"
            )

            raise HTTPException(
                status_code=401,
                detail="Usuário não encontrado"
            )

        # compatibilidade legado
        password_hash = (
            user.get("password_hash")
            or user.get("password")
        )

        if not password_hash:
            logger.error(
                f"❌ Usuário sem senha: "
                f"{email}"
            )

            raise HTTPException(
                status_code=401,
                detail="Erro na autenticação"
            )

        # validar senha
        valid_password = (
            verify_password(
                password,
                password_hash
            )
        )

        if not valid_password:
            logger.warning(
                f"❌ Senha inválida: "
                f"{email}"
            )

            raise HTTPException(
                status_code=401,
                detail="Senha inválida"
            )

        # gerar token
        token = create_token(
            str(user["_id"]),
            user["email"]
        )

        # atualizar login
        await db.users.update_one(
            {
                "_id":
                user["_id"]
            },
            {
                "$set": {
                    "last_login":
                        datetime.utcnow()
                }
            }
        )

        logger.info(
            f"✅ Login realizado: "
            f"{email}"
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id":
                    str(user["_id"]),
                "email":
                    user["email"],
                "full_name":
                    user.get(
                        "full_name",
                        user.get(
                            "fullName",
                            ""
                        )
                    ),
                "role":
                    user.get(
                        "role",
                        "PATIENT"
                    )
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(
            f"❌ Erro login: {str(e)}",
            exc_info=True
        )

        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )


# =====================================================
# USUÁRIO ATUAL PELO TOKEN
# =====================================================

async def get_current_user_from_token(
    token: str
):
    """
    Busca usuário pelo JWT.
    """

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"]
        )

        user_id = payload.get("sub")

        if not user_id:
            return None

        user = await db.users.find_one({
            "_id":
            ObjectId(user_id)
        })

        if not user:
            return None

        return {
            "id":
                str(user["_id"]),
            "email":
                user["email"],
            "full_name":
                user.get(
                    "full_name",
                    user.get(
                        "fullName",
                        ""
                    )
                ),
            "role":
                user.get(
                    "role",
                    "PATIENT"
                )
        }

    except jwt.ExpiredSignatureError:
        logger.warning(
            "⚠️ Token expirado"
        )
        return None

    except jwt.InvalidTokenError as e:
        logger.warning(
            f"⚠️ Token inválido: "
            f"{str(e)}"
        )
        return None

    except Exception as e:
        logger.error(
            f"❌ Erro usuário token: "
            f"{str(e)}"
        )
        return None