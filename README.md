# NyayAI — Indian Legal Contract Analyzer

AI-powered legal contract analyzer for the Indian legal context: paste or upload a
contract, get a clause-by-clause risk analysis grounded in the Indian Contract Act
1872 (and related statutes) with explainability, missing-clause and social-context
detection, and a downloadable risk-mitigated rewrite (PDF/TXT).


## Stack

- **MongoDB** + Mongoose — optional persistence layer for analysis history
- **Express** + TypeScript — REST/streaming API server
- **React 18** + Vite + TailwindCSS v4 + shadcn/radix UI — frontend
- **Node.js** ≥ 18.18
- Validation: Zod (hand-written schemas, shared shape between API and DB model)
- AI: Google Gemini (`@google/genai`), streamed NDJSON for the analysis endpoint
- PDF export: `pdfkit`

## Project structure

```
nyayai/
├── backend/                 # Express API server
│   └── src/
│       ├── config/env.ts    # Validates all env vars at boot (fail fast)
│       ├── db/connect.ts    # Optional Mongo connection, never blocks boot
│       ├── models/          # Mongoose schemas
│       ├── schemas/         # Zod request/response schemas (source of truth)
│       ├── routes/          # Thin route definitions
│       ├── controllers/     # Request handling / business logic
│       ├── middlewares/     # Error handling, 404
│       ├── lib/              # Gemini client, prompts, NDJSON parsing, PDF export
│       ├── app.ts           # Express app assembly (security, logging, routes)
│       └── index.ts         # Entrypoint, graceful shutdown
├── frontend/                # React + Vite SPA
│   └── src/
│       ├── components/      # App components + shadcn/ui primitives
│       ├── hooks/           # Data-fetching hooks (analyze stream, rewrite, history)
│       ├── pages/           # home, history, not-found
│       └── lib/             # Typed fetch wrapper, file parsers (pdf/docx/txt)
├── docker-compose.yml       # Optional local MongoDB
└── package.json             # npm workspaces root
```


## Setup

### 1. Prerequisites
- Node.js ≥ 18.18
- A [Gemini API key](https://aistudio.google.com/apikey)
- (Optional) MongoDB, local or Atlas — only needed for the history feature

### 2. Install
```bash
npm install
```
This installs both workspaces via npm's workspace hoisting.

### 3. Configure environment
```bash
cp backend/.env.example backend/.env
# edit backend/.env and set GEMINI_API_KEY (and MONGODB_URI if you want history)

cp frontend/.env.example frontend/.env   # optional, has sane defaults
```

Optional local Mongo:
```bash
docker compose up -d
# then in backend/.env:
# MONGODB_URI=mongodb://127.0.0.1:27017/nyayai
```

### 4. Run in development
```bash
npm run dev
```
This starts the API on `http://localhost:5000` and the Vite dev server on
`http://localhost:5173` (which proxies `/api/*` to the backend). Open
`http://localhost:5173`.

### 5. Build for production
```bash
npm run build
npm start   # serves the built API on PORT (frontend/dist should be served
            # by your static host / reverse proxy of choice, or via `npm run preview --workspace=frontend`)
```

## API

| Method | Path                    | Description                                   |
|--------|-------------------------|------------------------------------------------|
| GET    | `/api/healthz`          | Health check (includes DB connectivity status) |
| POST   | `/api/contracts/analyze`| Streamed NDJSON clause-by-clause analysis      |
| POST   | `/api/contracts/rewrite`| Generate a risk-mitigated full rewrite         |
| POST   | `/api/contracts/export` | Download report/contract as PDF or TXT         |
| GET    | `/api/history`          | List past analyses (requires `MONGODB_URI`)    |
| GET    | `/api/history/:id`      | Fetch one past analysis                        |
| DELETE | `/api/history/:id`      | Delete a past analysis                          |

## Notes

- This tool produces AI-generated legal analysis for informational purposes
  only — it is not a substitute for advice from a qualified advocate.
- Contract text sent to the analyze/rewrite endpoints is not logged verbatim
  anywhere in the backend (only length/metadata is logged on failures).
