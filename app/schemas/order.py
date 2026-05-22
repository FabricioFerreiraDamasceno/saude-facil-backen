from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class OrderItem(BaseModel):
    type: str  # 'consulta', 'exame', 'servico'
    reference_id: str
    title: str
    price: float
    quantity: int
    image: Optional[str] = None

class OrderIn(BaseModel):
    items: List[OrderItem]
    total: float
    provider_id: Optional[str] = None
    provider_name: Optional[str] = None

class OrderOut(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    items: List[OrderItem]
    total: float
    status: str
    payment_id: Optional[str] = None
    payment_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime