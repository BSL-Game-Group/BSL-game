# Testing

## Structure

The game has end-to-end tests made with Jest. Playwright and React testing library tests are for frontend logic and component behavior.

## Coverage

Test coverage goal: 80%

[![Overall Coverage](https://codecov.io/github/BSL-Game-Group/BSL-game/branch/main/graph/badge.svg?token=7AAAO14S1O)](https://codecov.io/github/BSL-Game-Group/BSL-game)
[![Frontend Coverage](https://codecov.io/github/BSL-Game-Group/BSL-game/branch/main/graph/badge.svg?flag=frontend)](https://app.codecov.io/github/BSL-Game-Group/BSL-game/flags/frontend)
[![Backend Coverage](https://codecov.io/github/BSL-Game-Group/BSL-game/branch/main/graph/badge.svg?flag=backend)](https://app.codecov.io/github/BSL-Game-Group/BSL-game/flags/backend)

Frontend:
![Frontend Coverage](./images/frontend-coverage.png)
Backend:
![Backend Coverage](./images/backend-coverage.png)

## Test instrunctions:

Install dependencies:
```bash
npm install
```
start the game:
```bash
docker compose up --build -d
```

Run  end-to-end Jest tests:
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


Backend unit tests (run from the repo root, no database required):
```bash
npm --prefix backend test
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
