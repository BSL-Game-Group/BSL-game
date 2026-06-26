from datetime import datetime

from fastapi import APIRouter
from sqlalchemy import text

from app.database import SessionLocal

router = APIRouter()

@router.get("/test")
def test_db():
    db = SessionLocal()

    try:
        db.execute(text("SELECT 1"))

        return {
            "message": "Database connection works",
            "time": datetime.utcnow().isoformat()
        }

    finally:
        db.close()