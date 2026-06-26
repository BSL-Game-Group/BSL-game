from pydantic import BaseModel


class BSLClassOut(BaseModel):
    class_number: int
    description: str | None

    class Config:
        from_attributes = True
