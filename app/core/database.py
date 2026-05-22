# app/core/database.py
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None
    
    async def connect(self):
        """Conecta ao MongoDB"""
        self.client = AsyncIOMotorClient(settings.MONGO_URL)
        self.db = self.client[settings.DB_NAME]
        print(f"✅ Conectado ao MongoDB: {settings.DB_NAME}")
        
    async def close(self):
        """Fecha conexão com MongoDB"""
        if self.client:
            self.client.close()
            print("❌ Conexão com MongoDB fechada")
    
    # Propriedades para acessar as coleções
    @property
    def users(self):
        return self.db.users
    
    @property
    def providers(self):
        return self.db.providers
    
    @property
    def slots(self):
        return self.db.slots
    
    @property
    def exams(self):
        return self.db.exams
    
    @property
    def orders(self):
        return self.db.orders
    
    @property
    def payments(self):
        return self.db.payments

# Instância global
db = Database()