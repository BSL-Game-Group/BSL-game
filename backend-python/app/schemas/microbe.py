from typing import Optional

from pydantic import BaseModel


class BSLClassOut(BaseModel):
    class_number: int
    description: str | None

    class Config:
        from_attributes = True


class MicrobeOut(BaseModel):
    id: int
    common_name: str
    scientific_name: str
    type: str
    bsl_level: int
    lecture_text: str
    feedback_correct: str
    feedback_incorrect: str

    bsl_class: Optional[BSLClassOut]

    class Config:
        from_attributes = True