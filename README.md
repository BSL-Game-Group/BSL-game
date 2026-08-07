[![Overall Coverage](https://codecov.io/github/BSL-Game-Group/BSL-game/branch/main/graph/badge.svg?token=7AAAO14S1O)](https://codecov.io/github/BSL-Game-Group/BSL-game)
[![Frontend Coverage](https://codecov.io/github/BSL-Game-Group/BSL-game/branch/main/graph/badge.svg?flag=frontend)](https://app.codecov.io/github/BSL-Game-Group/BSL-game/flags/frontend)
[![Backend Coverage](https://codecov.io/github/BSL-Game-Group/BSL-game/branch/main/graph/badge.svg?flag=backend)](https://app.codecov.io/github/BSL-Game-Group/BSL-game/flags/backend)
# BSL-game
Laboratories are classified into different biosafety levels depending on the types of organisms handled there. These different levels also require different types of clothing and protective gear. The idea is to develop a game in which users can practice which clothing and protective gear should be used.

## Instructions

### Run project with Docker

Requirements:
- Docker
- Docker Compose

Start application if you have made changes to the code:
```bash
docker compose up --build -d
```
Otherwise, start application:
```bash
docker compose up -d
```
Stop application:
```bash
docker compose down
```
Frontend is reachable at: [http://localhost:5173/](http://localhost:5173/) and backend at: [http://localhost:3001/](http://localhost:3001/)

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

### `JWT_SECRET`

The backend signs session tokens with `JWT_SECRET` and **refuses to start without
it**. There is deliberately no built-in default: a secret living in this repository
could be used to forge a session token for any account. The only exception is
`NODE_ENV=test`, so the backend suite runs unconfigured.

`docker compose up` sets it for you. Running `npm start` straight from `backend/`
needs it in your environment:

```bash
JWT_SECRET=anything-local npm start
```

**On OpenShift it comes from the `bsl-backend-secret` secret, and must be added
once before the next deploy** — `backend/manifests/deployment.yaml` requires the
key, so without it the pod fails with `CreateContainerConfigError`:

```bash
oc create secret generic bsl-backend-secret \
  --from-literal=JWT_SECRET="$(openssl rand -base64 32)" \
  --dry-run=client -o yaml | oc apply -f -
```

That form patches the existing secret without disturbing `DB_URL`. Rotating the
value signs everyone out; nothing else breaks.

### Testing

Install dependencies:
```bash
npm install
```
start the game:
```bash
docker compose up --build -d
```

Run  end-to-end tests:
```bash
npm test
```
Run tests with UI:
```bash
npm run test:ui
```
frontend unit tests (run from the repo root):
```bash
npm --prefix frontend test
```


Backend unit tests. **These talk to a real Postgres**, so start the database and
create the test database once:
```bash
docker compose up -d postgres
docker compose exec -T postgres psql -U bsluser -d bsldb -c "CREATE DATABASE bsldb_test"
```

Then, from `backend/`:
```bash
npm run test:db:prepare   # migrate + seed bsldb_test (re-run after new migrations)
npm test
```

`npm test` sets `NODE_ENV=test` and blanks `DB_URL`, so it can never touch the
development database — `bsldb_test` is separate from `bsldb` and is safe to drop
and rebuild at any time.

## Work Management
[Backlog](https://docs.google.com/spreadsheets/d/1bEsBqh-Pxz0nya1yIio4sEbJgoIu545pj67PdxWBZqk/edit?pli=1&gid=215085718#gid=215085718)

[ToDo](https://helsinkifi-my.sharepoint.com/:w:/r/personal/kaeerola_ad_helsinki_fi/_layouts/15/Doc.aspx?sourcedoc=%7B057F66C8-1D9B-49ED-9733-FC9002613191%7D&file=To%20Do.docx&fromShare=true&action=default&mobileredirect=true)

## Used Technologies
- React (frontend)
- Express (backend)
- Node.js (backend)
