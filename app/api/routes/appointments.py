from fastapi import APIRouter, Depends
from backend.app.api.deeps import get_current_user
from app.services.appointment_service import create_appointment
from app.schemas.appointment import AppointmentIn

router = APIRouter()

@router.post("")
async def create(body: AppointmentIn, user=Depends(get_current_user)):
    return await create_appointment(body, user)