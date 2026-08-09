# Testing

## Structure

The game has end-to-end tests made with Jest. Playwright and React testing library tests are for frontend logic and component behavior.

## Coverage

GOAL coverage?

[![Overall Coverage](https://codecov.io/github/BSL-Game-Group/BSL-game/branch/main/graph/badge.svg?token=7AAAO14S1O)](https://codecov.io/github/BSL-Game-Group/BSL-game)
[![Frontend Coverage](https://codecov.io/github/BSL-Game-Group/BSL-game/branch/main/graph/badge.svg?flag=frontend)](https://app.codecov.io/github/BSL-Game-Group/BSL-game/flags/frontend)
[![Backend Coverage](https://codecov.io/github/BSL-Game-Group/BSL-game/branch/main/graph/badge.svg?flag=backend)](https://app.codecov.io/github/BSL-Game-Group/BSL-game/flags/backend)

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
