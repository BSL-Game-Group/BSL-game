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
Otherwise start application:
```bash
docker compose up -d
```
Stop application:
```bash
docker compose down
```
Frontend is reachable at: [http://localhost:5173/](http://localhost:5173/) and backend at: [http://localhost:3001/](http://localhost:3001/)

### Testing

Run tests:
```bash
npm test
```

Run tests with UI:
```bash
npm run test:ui
```

## Work Management
[Backlog](https://docs.google.com/spreadsheets/d/1bEsBqh-Pxz0nya1yIio4sEbJgoIu545pj67PdxWBZqk/edit?pli=1&gid=215085718#gid=215085718)

[ToDo](https://helsinkifi-my.sharepoint.com/:w:/r/personal/kaeerola_ad_helsinki_fi/_layouts/15/Doc.aspx?sourcedoc=%7B057F66C8-1D9B-49ED-9733-FC9002613191%7D&file=To%20Do.docx&fromShare=true&action=default&mobileredirect=true)

## Used Technologies
- React (frontend)
- Express (backend)
- Node.js (backend)
