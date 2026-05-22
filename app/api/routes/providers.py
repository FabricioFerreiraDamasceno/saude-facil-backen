from typing import Optional

from fastapi import APIRouter

from app.core.database import db

from app.schemas.provider import ProviderIn

from app.services.provider_service import (
    create_provider,
    list_providers,
)
print("✅ Imports concluídos")
router = APIRouter()


@router.get("")
async def providers(
    q: Optional[str] = None,
    type: Optional[str] = None,
):
    print(f"🎯 ROTA /providers CHAMADA! q={q}, type={type}")
    return await list_providers(
        
        q=q,
        type=type,
    )


@router.post("")
async def create(body: ProviderIn):
    return await create_provider(body)


@router.get("/{provider_id}/slots")
async def provider_slots(provider_id: str):

    slots = await db.slots.find({
        "provider_id": provider_id,
        "is_available": True
    }).to_list(100)

    result = []

    for slot in slots:

        slot["_id"] = str(slot["_id"])

        result.append({
            "id": slot.get("id"),
            "provider_id": slot.get("provider_id"),
            "start_datetime": slot.get("start_datetime"),
            "is_available": slot.get("is_available", True),
        })

    return result

@router.get("/{provider_id}")
async def provider_detail(provider_id: str):

    provider = await db.providers.find_one({
        "id": provider_id
    })

    if not provider:
        return {
            "error": "Provider não encontrado"
        }

    provider["_id"] = str(provider["_id"])

    return provider

from datetime import datetime, timedelta
import uuid

# ... (seus outros imports)

@router.put("/availability")
async def update_availability(body: dict):
    """
    Esta rota recebe a lista de regras do frontend e gera os slots de 30 min
    """
    rules = body.get("rules", [])
    # Aqui idealmente você pegaria o ID do médico pelo Token (current_user)
    # Como teste, vamos assumir que o frontend enviará ou que temos o contexto
    # Para produção, use o Depends(get_current_user)
    
    # Exemplo: pegando o primeiro provider do banco apenas para teste 
    # (O correto é usar o ID do médico logado)
    provider = await db.providers.find_one({"status": "ACTIVE"})
    if not provider:
        return {"error": "Nenhum provider encontrado"}
    
    provider_id = provider["id"]

    # 1. Limpar slots futuros existentes para não duplicar
    await db.slots.delete_many({
        "provider_id": provider_id,
        "is_available": True
    })

    new_slots = []
    
    # 2. Gerar slots baseados nas regras (Próximos 7 dias como exemplo)
    today = datetime.now()
    for i in range(7):
        current_date = today + timedelta(days=i)
        day_of_week = (current_date.weekday() + 1) % 7 # Ajuste para bater com o frontend (0=Dom)

        day_rules = [r for r in rules if r["day_of_week"] == day_of_week]
        
        for rule in day_rules:
            start_h = rule["start_hour"]
            end_h = rule["end_hour"]
            
            # Cria slots de 30 em 30 minutos
            current_time = current_date.replace(hour=start_h, minute=0, second=0, microsecond=0)
            end_time = current_date.replace(hour=end_h, minute=0, second=0, microsecond=0)
            
            while current_time < end_time:
                new_slots.append({
                    "id": str(uuid.uuid4()),
                    "provider_id": provider_id,
                    "start_datetime": current_time.isoformat(),
                    "is_available": True,
                    "created_at": datetime.now()
                })
                current_time += timedelta(minutes=30)

    if new_slots:
        await db.slots.insert_many(new_slots)

    return {"message": f"{len(new_slots)} horários gerados com sucesso"}