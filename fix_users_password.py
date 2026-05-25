# fix_users_password.py
import asyncio
import os
from datetime import datetime
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Carregar variáveis de ambiente
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "saude_facil")

async def fix_users():
    print("🔌 Conectando ao MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Encontrar usuários com campo 'password' (antigo)
    users_with_old_field = await db.users.find({"password": {"$exists": True}}).to_list(None)
    
    print(f"📊 Encontrados {len(users_with_old_field)} usuários com campo 'password'")
    
    for user in users_with_old_field:
        # Mover 'password' para 'password_hash'
        result = await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$rename": {"password": "password_hash"},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        print(f"✅ Corrigido: {user.get('email')}")
    
    print(f"✅ Total corrigido: {len(users_with_old_field)}")
    
    # Verificar se há usuários sem campo de senha
    users_without_password = await db.users.find({
        "$and": [
            {"password_hash": {"$exists": False}},
            {"password": {"$exists": False}}
        ]
    }).to_list(None)
    
    if users_without_password:
        print(f"⚠️ Usuários sem senha encontrados: {len(users_without_password)}")
        for user in users_without_password:
            print(f"  - {user.get('email')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_users())