from pydantic import BaseModel
from typing import Optional

class ProductIn(BaseModel):
    name: str
    price: float
    stock: int
    category: str
    description: Optional[str]
    image: Optional[str]