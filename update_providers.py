# update_providers.py
import asyncio
from app.core.database import db
from app.core.config import settings

async def update_providers():
    await db.connect()
    
    # Adicionar campos approved e status para todos os providers existentes
    result = await db.providers.update_many(
        {},  # Todos os documentos
        {"$set": {"approved": True, "status": "ACTIVE"}}
    )
    
    print(f"✅ Atualizados {result.modified_count} providers")
    
    # Verificar um provider atualizado
    sample = await db.providers.find_one({})
    print(f"📋 Exemplo atualizado: {sample}")
    
    await db.close()

if __name__ == "__main__":
    asyncio.run(update_providers())