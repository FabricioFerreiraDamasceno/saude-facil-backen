# app/main.py
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import db
from app.api.routes import auth, providers, orders, payments

app = FastAPI(title="Saúde Fácil API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# ADICIONE ESTE ENDPOINT DE TESTE ANTES DOS ROUTERS
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "API está rodando", "cors": "enabled"}

# ✅ Rotas
print("📌 Registrando rota auth...")
app.include_router(auth.router, prefix="/auth", tags=["auth"])
print("✅ Auth registrado")

print("📌 Registrando rota providers...")
app.include_router(providers.router, prefix="/providers", tags=["providers"])
print("✅ Providers registrado")

print("📌 Registrando rota orders...")
app.include_router(orders.router, prefix="/orders", tags=["orders"])
print("✅ Orders registrado")

print("📌 Registrando rota payments...")
app.include_router(payments.router, prefix="/payments", tags=["payments"])
print("✅ Payments registrado")

# ✅ Eventos de startup/shutdown
@app.on_event("startup")
async def startup_event():
    await db.connect()
    print("🚀 API iniciada com sucesso!")
    print("📍 CORS configurado para aceitar todas as origens")

@app.on_event("shutdown")
async def shutdown_event():
    await db.close()

# ✅ Endpoints raiz
@app.get("/")
async def root():
    return {"message": "API Saúde Fácil", "status": "online"}

# ✅ Debug - listar todas as rotas
@app.get("/debug/routes")
async def list_all_routes():
    routes = []
    for route in app.routes:
        routes.append({
            "path": route.path,
            "methods": list(route.methods) if hasattr(route, 'methods') else [],
            "name": route.name if hasattr(route, 'name') else None
        })
    return routes
