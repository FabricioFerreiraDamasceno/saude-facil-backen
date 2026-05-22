# init_orders_collection.py
import asyncio
import uuid
from datetime import datetime, timezone
from app.core.database import db
from app.core.config import settings

async def init_orders_collection():
    print("🔧 Inicializando coleção orders...")
    
    # Verificar se a coleção existe
    collections = await db.list_collection_names()
    
    if "orders" not in collections:
        print("📦 Criando coleção 'orders'...")
        await db.create_collection("orders")
        print("✅ Coleção 'orders' criada!")
    else:
        print("✅ Coleção 'orders' já existe!")
    
    # Criar índices
    print("🔍 Criando índices...")
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("user_id")
    await db.orders.create_index("status")
    await db.orders.create_index("created_at")
    await db.orders.create_index([("user_id", 1), ("created_at", -1)])
    print("✅ Índices criados!")
    
    # Inserir um pedido de teste
    test_order = {
        "id": str(uuid.uuid4()),
        "user_id": "69ff0c55e74cb31644f2bfa5",  # ID do usuário fabricio
        "user_name": "fabricio ferreira",
        "user_email": "darrewlbag@gmail.com",
        "items": [
            {
                "type": "exame",
                "reference_id": "69fbe355e0fd886eed61be85",
                "title": "Anti Cardiolipina",
                "price": 20.0,
                "quantity": 1,
                "image": None
            }
        ],
        "total": 20.0,
        "status": "PENDING",
        "payment_id": None,
        "payment_status": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    print("🧪 Inserindo pedido de teste...")
    result = await db.orders.insert_one(test_order)
    print(f"✅ Pedido de teste inserido com ID: {test_order['id']}")
    
    # Listar pedidos
    orders = await db.orders.find().to_list(length=10)
    print(f"\n📋 Total de pedidos na coleção: {len(orders)}")
    
    for order in orders:
        print(f"  - ID: {order['id']}, User: {order['user_name']}, Total: R${order['total']}, Status: {order['status']}")
    
    print("\n✅ Inicialização concluída!")

async def main():
    await init_orders_collection()

if __name__ == "__main__":
    asyncio.run(main())