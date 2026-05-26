# app/db/mongo.py
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv(env_path)

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

print("📂 ENV PATH:", env_path)
print("🔌 MONGO_URL:", MONGO_URL)
print("🗄 DB_NAME:", DB_NAME)

if not MONGO_URL:
    raise Exception("❌ MONGO_URL não definido")
if not DB_NAME:
    raise Exception("❌ DB_NAME não definido")

class Database:
    """Classe de banco de dados com acesso às coleções"""
    
    def __init__(self):
        self.client = None
        self.db = None
    
    async def connect(self):
        """Conecta ao MongoDB"""
        self.client = AsyncIOMotorClient(MONGO_URL)
        self.db = self.client[DB_NAME]
        print(f"✅ Conectado ao MongoDB: {DB_NAME}")
    
    async def close(self):
        """Fecha a conexão"""
        if self.client:
            self.client.close()
            print("✅ Conexão MongoDB fechada")
    
    @property
    def users(self):
        return self.db.users
    
    @property
    def orders(self):
        return self.db.orders
    
    @property
    def providers(self):
        return self.db.providers
    
    @property
    def payments(self):
        return self.db.payments
    
    @property
    def webhook_events(self):
        return self.db.webhook_events
    
    @property
    def consultations(self):
        return self.db.consultations

# Instância global do banco de dados
db = Database()