from alembic import command
from alembic.config import Config
from app.services.seed_service import seed_database


def main():
    print("Running migrations...")
    command.upgrade(Config("alembic.ini"), "head")

    print("Seeding database...")
    seed_database()

    print("Database initialized.")


if __name__ == "__main__":
    main()