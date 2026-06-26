from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Microbe(Base):
    __tablename__ = "microbes"

    id = Column(Integer, primary_key=True)

    common_name = Column(String, nullable=False)

    scientific_name = Column(String, nullable=False)

    type = Column(String, nullable=False)

    bsl_level = Column(
        Integer,
        ForeignKey("bsl_classes.class_number")
    )

    lecture_text = Column(Text, nullable=False)

    feedback_correct = Column(Text, nullable=False)

    feedback_incorrect = Column(Text, nullable=False)

    bsl_class = relationship(
        "BSLClass",
        back_populates="microbes"
    )