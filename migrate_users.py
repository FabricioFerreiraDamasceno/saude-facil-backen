# migrate_users.py
import asyncio
from app.core.database import db
from app.core.config import settings

async def migrate_users():
    await db.connect()
    
    # Adicionar campo 'id' baseado no '_id' para todos os usuários
    users = await db.users.find().to_list(length=100)
    
    for user in users:
        if "id" not in user:
            user_id = str(user["_id"])
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"id": user_id}}
            )
            print(f"✅ Atualizado usuário {user.get('email')} com id: {user_id}")
    
    print("✅ Migração concluída!")
    await db.close()

if __name__ == "__main__":
    asyncio.run(migrate_users())