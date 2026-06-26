from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class BSLClass(Base):
    __tablename__ = "bsl_classes"

    class_number = Column(Integer, primary_key=True)
    description = Column(String)

    microbes = relationship(
        "Microbe",
        back_populates="bsl_class"
    )