import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

db_url = os.getenv("DB_URL")

if db_url:
    DATABASE_URL = db_url
else:
    DATABASE_URL = (
        f"postgresql://"
        f"{os.getenv('DB_USER', 'bsluser')}:"
        f"{os.getenv('DB_PASSWORD', 'bslpassword')}@"
        f"{os.getenv('DB_HOST', 'localhost')}:"
        f"{os.getenv('DB_PORT', '5432')}/"
        f"{os.getenv('DB_NAME', 'bsldb')}"
    )

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()