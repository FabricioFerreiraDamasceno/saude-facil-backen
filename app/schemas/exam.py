from pydantic import BaseModel
from typing import Optional

class ExamIn(BaseModel):
    name: str
    price: float
    category: str
    description: Optional[str]
    image: Optional[str]