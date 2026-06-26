from sqlalchemy.orm import Session, joinedload

from app.models.microbe import Microbe


def get_all_microbes(db: Session):
    return (
        db.query(Microbe)
        .options(joinedload(Microbe.bsl_class))
        .order_by(Microbe.id)
        .all()
    )


def get_microbe_by_id(
    db: Session,
    microbe_id: int
):
    return (
        db.query(Microbe)
        .options(joinedload(Microbe.bsl_class))
        .filter(Microbe.id == microbe_id)
        .first()
    )