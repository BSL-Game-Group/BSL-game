import json

from sqlalchemy import select

from app.database import SessionLocal
from app.models.bsl_class import BSLClass
from app.models.microbe import Microbe

BSL_DESCRIPTIONS = {
    1: "BSL-1: Agents not known to consistently cause disease in healthy adults.",
    2: "BSL-2: Agents associated with human disease.",
    3: "BSL-3: Agents that may cause serious or potentially lethal disease via inhalation.",
    4: "BSL-4: Dangerous and exotic agents with high risk of life-threatening disease.",
}


def seed_database():
    session = SessionLocal()

    try:
        # Don't seed twice
        existing = session.scalar(select(BSLClass.class_number).limit(1))
        if existing is not None:
            print("Database already seeded.")
            return

        with open("data/microbes_eng_v2.json", encoding="utf-8") as f:
            microbes = json.load(f)

        # Create BSL classes
        for number, description in BSL_DESCRIPTIONS.items():
            session.add(
                BSLClass(
                    class_number=number,
                    description=description,
                )
            )

        session.flush()

        # Create microbes
        for m in microbes:
            session.add(
                Microbe(
                    id=m["id"],
                    common_name=m["common_name"],
                    scientific_name=m["scientific_name"],
                    type=m["type"],
                    bsl_level=m["bsl_level"],
                    lecture_text=m["lecture_text"],
                    feedback_correct=m["feedback_correct"],
                    feedback_incorrect=m["feedback_incorrect"],
                )
            )

        session.commit()
        print(f"Seeded {len(microbes)} microbes.")

    finally:
        session.close()


if __name__ == "__main__":
    seed_database()