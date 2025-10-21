# DevChallenge McCarren

Company intelligence builder powered by an OpenAI-backed backend and a React + TypeScript frontend.

## Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in OPENAI_API_KEY and DATABASE_URL (Postgres connection string)
npm run dev
```

The API listens on `http://localhost:4000`. Primary endpoint: `POST /api/analyze` with a JSON body such as `{ "url": "https://example.com" }`. For production builds run `npm run build` followed by `npm run start`.

## Frontend

```bash
cd frontend
npm install
npm start
```

Starts the UI on `http://localhost:3000`. Configure a different backend host by setting `REACT_APP_API_BASE_URL` in `frontend/.env`. TypeScript sources are compiled on the fly by Create React App.

## Development Notes

- Backend expects Node.js 18.17+ and is implemented in TypeScript (`tsconfig.json` included).
- Backend persists profiles in Postgres (`DATABASE_URL`) and reuses cached intelligence on repeat lookups.
- Frontend uses React 19 with Create React App + TypeScript tooling.
- Remember to keep `.env` files private; samples are provided for reference.
