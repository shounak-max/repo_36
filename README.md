# Task Manager REST API

Next.js App Router implementation of the Task Manager API PRD. The service is deployable to Vercel serverless functions and uses PostgreSQL with direct `pg` queries.

## Features

- Task CRUD endpoints with filtering, pagination, sorting, and status transition enforcement.
- API-key authentication with bcrypt hashes and revocation support.
- Per-key sliding-window rate limiting.
- Aggregate task statistics.
- Consistent JSON error envelope.
- JSON request logging with method, path, status, latency, and key id.
- Health check, OpenAPI JSON, and Swagger UI routes.
- One-shot SQL migration script plus Vercel and Docker config.

## Local Setup

```bash
npm install
cp .env.example .env.local
docker compose up -d postgres
npm run migrate
npm run dev
```

Create an API key:

```bash
curl -X POST http://localhost:3000/api/admin/api-keys \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: replace-with-a-long-random-admin-secret" \
  -d '{"label":"local-dev"}'
```

Use the returned plaintext key against task endpoints:

```bash
curl http://localhost:3000/api/v1/tasks \
  -H "X-API-Key: <plaintext_key>"
```

## Routes

- `GET /health`
- `GET /api/openapi`
- `GET /api/docs`
- `POST /api/admin/api-keys`
- `DELETE /api/admin/api-keys/:key_id`
- `GET /api/v1/tasks`
- `POST /api/v1/tasks`
- `GET /api/v1/tasks/:id`
- `PUT /api/v1/tasks/:id`
- `PATCH /api/v1/tasks/:id`
- `DELETE /api/v1/tasks/:id`
- `GET /api/v1/tasks/stats`

`/api/v1/tasks/*` rewrites to the Vercel route handlers under `/api/tasks/*`.
