import uuid
from datetime import datetime, timezone

def commission_rule_model(module: str, percentage: float, fixed_fee: float = 0.0):
    """
    Regras globais de comissionamento da plataforma.
    Coleção recomendada: db.commission_rules
    """
    return {
        "id": str(uuid.uuid4()),
        "module": module,  # 'ODONTOLOGIA', 'FARMACIA', 'LABORATORIO', 'IMAGEM', 'CONSULTA'
        "percentage": float(percentage),
        "fixed_fee": float(fixed_fee),
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }