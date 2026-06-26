from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.microbe import MicrobeOut
from app.services.microbe_service import get_all_microbes, get_microbe_by_id

router = APIRouter(
    prefix="/api",
    tags=["Microbes"]
)



@router.get("/microbes", response_model=list[MicrobeOut])
def get_microbes(db: Session = Depends(get_db)):
    return get_all_microbes(db)


@router.get("/microbes/{microbe_id}", response_model=MicrobeOut)
def get_microbe(microbe_id: int, db: Session = Depends(get_db)):
    return get_microbe_by_id(db, microbe_id)