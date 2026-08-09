# Installation

## Requirements

- Docker
- Docker Compose
- Node.js (recommended 18.x or later)
- npm

## Repository setup

1. Clone the repository:

```bash
git clone https://github.com/MildMunshin/BSL-game.git
cd BSL-game
```

2. Install root development dependencies for Playwright and project tooling:

```bash
npm install
```

3. Install frontend and backend dependencies separately if you want to work on either service directly:

```bash
npm --prefix frontend install
npm --prefix backend install
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

Read endpoints: `GET /api/bsl-classes`, `GET /api/microbes`, `GET /api/microbes/:id`.

## Notes

- The project includes ESLint for frontend and backend linting.
