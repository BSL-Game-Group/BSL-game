from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BSLClass
from app.schemas.bsl_class import BSLClassOut

router = APIRouter(
    prefix="/api",
    tags=["BSL Classes"]
)

@router.get("/bsl-classes", response_model=list[BSLClassOut])
def get_bsl_classes(db: Session = Depends(get_db)):
    return db.query(BSLClass).order_by(BSLClass.class_number).all()