from pydantic import BaseModel
from datetime import datetime
from typing import Literal

class AppointmentIn(BaseModel):
    provider_id: str
    start_datetime: datetime
    modality: Literal["ONLINE", "PRESENTIAL"]