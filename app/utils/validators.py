from fastapi import HTTPException

def validate_not_empty(value, message="Campo obrigatório"):
    if not value:
        raise HTTPException(status_code=400, detail=message)