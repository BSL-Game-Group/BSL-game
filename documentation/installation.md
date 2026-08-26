# Installation

## Requirements
- Docker
- Docker Compose
- Node.js 20.19+ or 22.12+, and npm — needed for the test suites and for running
  either service outside Docker. The images build on `node:22`.

## Repository setup

1. Clone the repository:

```bash
git clone https://github.com/BSL-Game-Group/BSL-game.git
cd BSL-game
```

## Run with Docker Compose

The easiest way to run the project is with Docker Compose. It starts PostgreSQL, runs database migrations and seeders, then launches the backend and frontend.

1. Build and start the stack:

```bash
docker compose up --build -d
```

2. To stop the stack:

```bash
docker compose down
```

3. To reset the database and re-seed data:

```bash
docker compose down -v && docker compose up --build -d
```

4. Access the running services:

    Frontend is reachable at:
    - [http://localhost:5173/](http://localhost:5173/)

    Backend is reachable at: 
    - [http://localhost:3001/](http://localhost:3001/)

### Database

The backend uses Sequelize against PostgreSQL. Schema lives in `backend/migrations/`, seed data in `backend/seeders/`.

Migrations and seeders run **automatically** when the stack starts: a one-off `migrate` service runs `npm run db:init` (`db:migrate && db:seed:all`) once Postgres is healthy, and the backend starts only after it finishes. Re-runs are safe — already-applied migrations and seeders are skipped.

```bash
docker compose up -d            # postgres → migrate (auto) → backend → frontend
```

Data persists in the `postgres_data` Docker volume across restarts. To wipe and re-seed from scratch:
```bash
docker compose down -v && docker compose up -d
```

The endpoints the backend serves are listed in
[architecture.md](architecture.md#database).

## Notes

- The project includes ESLint for frontend and backend linting.
