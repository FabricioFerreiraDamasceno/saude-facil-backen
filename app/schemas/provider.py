from pydantic import BaseModel
from typing import Optional, Literal

class ProviderIn(BaseModel):
    full_name: str
    type: Literal["MEDIC", "DENTIST", "PSYCHOLOGIST", "NUTRITIONIST", "LAB", "PHARMACY"]
    specialty: str
    crm: Optional[str]
    bio: Optional[str]
    avatar: Optional[str]
    base_price: float = 0