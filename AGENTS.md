0) Purpose

This document gives precise guardrails and playbooks so automated agents (and humans) can safely modify this monorepo. Follow it for file boundaries, API contracts, coding standards, migrations, testing, and verification.

1) Repository Map
/frontend               # Vite + React + TypeScript + Tailwind + shadcn/ui
/backend                # Express + TypeScript + Prisma + PostgreSQL
/.env*                  # not committed; see backend/.env.example, frontend/.env.example

1.1 Tech Versions (target for agents)

Node: 20.x or 22.x (do not assume 23+)

Prisma: ~5.22.x

TypeScript: strict mode both FE & BE

React Router: v6

TanStack Query: latest v5

UI: Tailwind + shadcn/ui (Radix primitives)

No MSW in this repo

2) Project Conventions (critical)
2.1 API Envelope (backend → frontend)

All HTTP responses MUST follow:

# Success
{ "success": true, "data": <payload> }

# Error
{ "success": false, "error": { "message": "human readable", "code": "OPTIONAL_CODE" } }


Do not return raw objects.

2.2 Transaction Date Contract

DB field: occurredAt (DateTime)

DTO to client: txDate as ISO string

Sorting param: sort=txDate:asc|desc → map to Prisma orderBy: { occurredAt: 'asc'|'desc' }

Never send non-ISO or locale strings to FE.

2.3 Required Fields

Transactions: { txDate, type: 'IN'|'OUT', amount, categoryId, accountId }

Category has { id, name, type: 'INCOME'|'EXPENSE', color? }

Account has { id, name, currency }

2.4 Errors & Logging

Use pino; no stack traces or secrets in responses.

Convert thrown errors to the error envelope.

2.5 TypeScript

No any. Use unknown + narrowing.

Keep functions pure; no global state.

2.6 Frontend Patterns

Data fetching via TanStack Query with stable keys.

Keep URL state in sync for filters/pagination.

Accessibility: keyboard focus, aria-* on interactive controls.

Feature flags via import.meta.env.* (e.g., VITE_SUGGESTIONS_LOCAL).

3) Environment & Run
3.1 Backend
cd backend
cp .env.example .env     # set DATABASE_URL, JWT_SECRET, CLIENT_ORIGIN
npm i
npx prisma generate
npm run dev


Database reset + seed (idempotent):

npx prisma migrate reset --force   # auto-runs seed


Migrations:

# after schema edit
npx prisma migrate dev --name <change_name>

3.2 Frontend
cd frontend
cp .env.example .env      # set VITE_API_BASE_URL=http://localhost:8080
npm i
npm run dev

4) File Boundaries (where to change things)
Backend

Routes & handlers: backend/src/modules/**/index.ts

Validation (Zod): backend/src/modules/**/validation.ts

DTO mappers: keep alongside module (e.g., toTxDto)

Prisma schema: backend/prisma/schema.prisma

Seed data: backend/prisma/seed.ts

Frontend

API clients: frontend/src/api/*.ts (use axiosClient with interceptors)

Pages: frontend/src/pages/*.tsx

Reusable components: frontend/src/components/**

Feature modules: frontend/src/features/**

Utilities/formatters: frontend/src/lib/*.ts

UI re-exports: frontend/src/ui/* (shadcn/ui wrappers)

5) Common Playbooks
5.1 Add a DB field (with seed and DTO)

Edit prisma/schema.prisma.

npx prisma migrate dev --name <name>.

Update seed (prisma/seed.ts) using upserts (idempotent).

Update DTO mapper(s) to include new field(s) and keep the envelope.

Reset & verify:

npx prisma migrate reset --force
npx prisma studio  # spot-check

5.2 Implement a new endpoint

Add route in correct module.

Validate with Zod in validation.ts.

Use Prisma in service/handler.

Return envelope. Add toDto() mapper.

Add minimal Jest test (unit or integration).

Document query params (types + defaults) as comments.

5.3 Fix seed failures

Prefer prisma.model.upsert({ where:{id}, update:{...}, create:{...} }).

Ensure all required fields exist (e.g., category.type, account.currency).

Never assume optional columns that aren’t in schema.

5.4 Harden date handling (FE)

formatDate(input?: string | number | Date) must never throw; returns '-' on invalid.

Always display tx.txDate ?? '-' in UI. Do not directly render raw Date objects.

6) Quality Gates (what Codex must check before finishing)

TypeScript passes (npx tsc --noEmit) in both apps.

API envelope is used in every changed BE handler.

DTO has txDate (ISO) for transactions.

No any added; no disabled lint/ts rules.

Prisma migrate completes; reset --force + seed works.

Frontend builds (npm run build) and dev route guard works.

Accessibility: buttons/links have labels; focus visible.

7) Route Protection (FE)

Only /login and /register are public.

Guard others with a small wrapper that checks token presence (via tokens.ts):

function Protected({ children }: { children: React.ReactNode }) {
  return hasTokens() ? <>{children}</> : <Navigate to="/login" replace />;
}


In router, wrap /dashboard, /transactions, budgets/insights pages with Protected.

8) API Shape (reference)
8.1 Transactions

GET /api/transactions?search=&type=&categoryId=&accountId=&min=&max=&start=&end=&page=1&limit=10&sort=txDate:desc

data: { items: TxDto[], total, page, limit }

POST /api/transactions

Body: { txDate: ISO, type: 'IN'|'OUT', amount: number, categoryId: string, accountId: string, note?: string }

data: TxDto

PATCH /api/transactions/:id → data: TxDto

DELETE /api/transactions/:id → data: { id }

TxDto:

{
  id: string;
  txDate: string;            // ISO
  type: 'IN'|'OUT';
  amount: number;
  note: string | null;
  currency?: string;
  category?: { id: string; name: string; color?: string | null } | null;
  account?: { id: string; name: string } | null;
}

9) Feature Flags

VITE_SUGGESTIONS_LOCAL (frontend): when true, use local heuristics for category suggestions.

Do not introduce new flags without documenting them here.

10) Testing & Verification
Backend
cd backend
npm test
curl -sS http://localhost:8080/health
curl -sS "http://localhost:8080/api/transactions?page=1&limit=5&sort=txDate:desc" \
  -H "Authorization: Bearer <access>"

Frontend

npm run build must succeed.

Manual smoke:

Login → redirected to /transactions.

Create a transaction → list updates; no date crash.

Filters & pagination update query string and fetch correctly.

(If enabled) suggestions chips render for uncategorized rows.

11) Don’ts (for agents)

Don’t bypass the envelope or return raw Prisma objects.

Don’t change DB column names without a migration + mapper updates.

Don’t use any or suppress TS/lint rules.

Don’t reintroduce MSW or other mock service workers.

Don’t log secrets or full error stacks to clients.

12) PR / Change Note Template
### Summary
Short description of the change.

### Scope
- [ ] Backend
- [ ] Frontend
- [ ] Prisma schema/migration
- [ ] Seed

### Contracts
- API envelope respected: yes/no
- Transactions DTO includes `txDate` (ISO): yes/no

### Tests & Checks
- [ ] npx tsc --noEmit (be + fe)
- [ ] npx prisma migrate dev / reset --force (seed OK)
- [ ] npm run build (frontend)
- [ ] Manual smoke (create/list tx)

### Risks
List breaking changes or data migrations.

13) Known Pitfalls & Quick Fixes

Seed fails with missing required field → ensure type on Category, currency on Account, and required relations are set in create branch of upserts.

Invalid time value on FE → the API likely returned occurredAt or non-ISO date; ensure mapper returns txDate ISO and FE uses formatDate with guards.

401 loops → verify axios refresh interceptor and backend /api/auth/refresh envelope.


