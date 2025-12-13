# Repository Guidelines

## Project Structure & Module Organization
- `backend/` holds the Express + Prisma API. Domain logic lives in `src/modules`, shared setup in `src/config`, and routing glue in `src/routes`. Jest integration tests sit under `src/modules/**/__tests__`.
- `frontend/` contains the Vite + React client. Route shells live in `src/pages` and `src/routes`, shared providers in `src/app`, reusable UI primitives in `src/ui`, and MSW mocks in `src/mocks`.
- `infra/` stores environment notes, while repeatable automation scripts live in `scripts/` (migrations, backups, deploy skeletons). `docker-compose.yml` orchestrates db, API, and web for local work.

## Build, Test, and Development Commands
- `docker compose up --build` boots Postgres, API, and UI with shared hot reloads.
- `cd backend && npm install && npm run dev` starts the API; `npm run build` compiles the production bundle.
- `npm test`, `npm run test:watch`, and `npm run test:coverage` execute the backend Jest suites.
- `cd frontend && npm install && npm run dev` serves Vite at `5173`; `npm run build` emits the static bundle. Toggle MSW with `VITE_ENABLE_MSW=false`.
- `./scripts/migrate.sh --local` runs Prisma migrations locally (omit the flag for Docker); `./scripts/backup.sh <dir>` snapshots the Postgres schema.

## Coding Style & Naming Conventions
- TypeScript everywhere with ES modules and 2-space indentation. Keep semicolons, single quotes in the backend, and follow current import ordering (stdlib, third-party, local).
- Backend files mirror their module names (`auth`, `transactions`, etc.); surface shared types and helpers via named exports.
- React components use PascalCase symbols even when files are lowercase (`ui/button.tsx`). Co-locate hooks and utilities with their feature folders.

## Testing Guidelines
- Co-locate tests beside the code in `__tests__` directories and name files `*.test.ts`. Cover both service logic and HTTP routes with Jest + Supertest.
- Run `npx prisma migrate dev` before integration suites and clean fixtures using the module helpers.
- Maintain or improve coverage; run `npm run test:coverage` before committing and document any intentional gaps.

## Commit & Pull Request Guidelines
- Use concise, imperative commits such as `feat(auth): add MFA enrollment`. Group related changes; avoid multi-feature dumps.
- PRs should include a purpose summary, test commands run, database migration notes, and screenshots for UI changes. Link issues with `Closes #id` where applicable.
- Ensure build and test commands above pass before requesting review, and surface any deferred work
 instead of leaving TODOs.
