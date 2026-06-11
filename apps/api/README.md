# @habit/api

Hono + tRPC v11 server on Postgres (Drizzle). Thin by design: routers validate
input (zod schemas from `@habit/shared`), enforce auth and ownership, read and
write facts — every gamification rule comes from `@habit/core`.

## Run

```bash
pnpm db:up                      # from repo root: Postgres in Docker
pnpm --filter @habit/api dev    # tsx watch, migrations apply at boot
```

Env (repo root `.env`): `DATABASE_URL`, `JWT_SECRET`, `API_PORT` (3001),
`ALLOW_MULTI_USER` (default false: registration locks after the first user).

## Migrations

Generated from `src/db/schema.ts` into `drizzle/` and applied automatically at
boot. After schema changes: `pnpm --filter @habit/api db:generate` and commit
the new migration.

## Smoke test (curl)

```bash
curl -s http://localhost:3001/health
# {"status":"ok","db":true}

curl -s -X POST http://localhost:3001/trpc/auth.register \
  -H 'content-type: application/json' \
  -d '{"email":"you@example.com","password":"password123","displayName":"Adam","creatureName":"Pix"}'
# → {"result":{"data":{"token":"...","user":{...}}}}

TOKEN=...   # from above

curl -s -X POST http://localhost:3001/trpc/habits.create \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"type":"daily","name":"Meditate"}'

curl -s "http://localhost:3001/trpc/stats.summary" \
  -H "authorization: Bearer $TOKEN"
```

## Tests

```bash
pnpm --filter @habit/api test   # needs the test DB (pnpm db:up)
```

Integration tests run against `TEST_DATABASE_URL` (default:
`postgres://habit:habit@localhost:5432/habitquest_test`, created by the
docker-compose init script), truncating all tables before each test.
