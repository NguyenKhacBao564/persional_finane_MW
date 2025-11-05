# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal Finance Management backend API built with Express, TypeScript, Prisma, and PostgreSQL. Integrates OpenAI for AI-powered financial insights and transaction categorization.

**Stack:** Node.js + Express + Prisma + PostgreSQL + OpenAI API

## Development Commands

### Setup
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### Running the Application
```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

### Database Operations
```bash
# Create and apply new migration
npx prisma migrate dev --name <migration_name>

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Docker
```bash
# From project root, start all services (db, backend, frontend)
docker-compose up

# Start only database
docker-compose up -d db

# Rebuild containers
docker-compose up --build

# Stop services
docker-compose down
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Architecture

### Module-Based Structure
The codebase follows a **domain-driven, module-based architecture**. Each business domain is isolated in `src/modules/`, containing its own router and business logic.

**Modules:**
- `auth` - User registration, login, password reset, token refresh
- `users` - User profile management
- `transactions` - Transaction CRUD, ingestion, and categorization
- `categories` - Category management (INCOME/EXPENSE/TRANSFER types)
- `budgets` - Budget creation and tracking (MONTHLY/WEEKLY/ANNUAL periods)
- `goals` - Financial goal setting and progress tracking
- `ai` - OpenAI integration for insights and categorization

**Key principle:** Business logic lives inside each module, NOT in the router aggregator (`src/routes/index.ts`).

### Entry Points
- `src/index.ts` - Bootstrap file that starts the server
- `src/server.ts` - Express app factory (for composability/testing)
- `src/routes/index.ts` - Aggregates all module routers under `/api`

### Configuration
- `src/config/env.ts` - Centralized environment variable management
- `src/config/prisma.ts` - Shared Prisma client instance
- TypeScript path aliases configured in `tsconfig.json`:
  - `@config/*` → `src/config/*`
  - `@modules/*` → `src/modules/*`
  - `@routes/*` → `src/routes/*`

### Database Schema (`prisma/schema.prisma`)
**Core Models:**
- `User` - User accounts with authentication
- `Transaction` - Financial transactions linked to users and categories
- `Category` - Transaction categories (typed as INCOME/EXPENSE/TRANSFER)
- `Budget` - Budget allocations per category with period tracking
- `Goal` - Savings/financial goals with progress tracking
- `AIInsight` - AI-generated insights linked to users/transactions

**Key relationships:**
- Users own transactions, budgets, goals, and insights
- Transactions optionally link to categories
- Budgets optionally link to categories
- AI insights optionally link to source transactions

### OpenAI Integration
- Centralized client in `src/services/openaiClient.ts`
- Currently has placeholder methods - actual prompts need implementation
- Used by `ai` module for categorization and insights

## Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `BACKEND_PORT` - Server port (default: 4000)
- `CLIENT_ORIGIN` - CORS origin for frontend (default: http://localhost:5173)
- `OPENAI_API_KEY` - OpenAI API key for AI features

## Development Guidelines

### Adding a New Module
1. Create `src/modules/<module-name>/index.ts`
2. Export a router and any handlers/services
3. Register the router in `src/routes/index.ts`
4. Keep business logic inside the module

### Database Changes
1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <description>`
3. Prisma client will auto-regenerate

### Module Structure Pattern
Each module exports:
```typescript
export default { router }
```

The router contains all HTTP handlers for that domain.

## Implementation Roadmap

### Phase 1: Infrastructure & Authentication
- [x] **Task 10:** Set up backend project structure with Express + Prisma + PostgreSQL
- [x] **Task 11:** Create User schema (id, email, passwordHash, name, createdAt)
- [x] **Task 12:** Build API POST /auth/register and POST /auth/login with JWT (access/refresh tokens)
- [x] **Task 13:** Add authGuard middleware + refresh token rotation
- [x] **Task 16:** Unit tests for auth module (backend) - 25 tests passing
- [x] **Task 17:** Documentation: README & Postman Collection for Auth API

### Phase 2: Core Financial Data
- [x] **Task 18:** Create Category (income/expense/transfer) & Transaction schemas
- [x] **Task 19:** CRUD APIs for /categories and /transactions
- [x] **Task 20:** API to filter transactions by time range, category, and keywords
- [x] **Task 24:** API for CSV upload + server-side parsing (using Multer + PapaParse)

### Phase 3: Budgets & Goals
- [x] **Task 29:** Create Budget & Goal schemas in Prisma
- [x] **Task 30:** CRUD APIs for /budgets and /goals
- [x] **Task 31:** API to calculate total spending by category/month

### Phase 4: Analytics & Reporting
- [ ] **Task 36:** API to aggregate statistical data (total income/expense, top categories)

## API Documentation

### Authentication Endpoints
Complete documentation available in `src/modules/auth/README.md`

**Endpoints:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/users/me` - Get current user (protected)

### Postman Collection
Import `postman_collection.json` into Postman for ready-to-use API testing. The collection includes:
- Pre-configured requests for all auth endpoints
- Automatic token management (saves tokens to variables)
- Test scripts to validate responses
- Environment variables setup

## Important Notes

- ES modules in use (`"type": "module"` in package.json)
- TypeScript compiled to `dist/` directory
- Hot reload in development via `tsx watch` (modern ES module support)
- CORS configured to allow `CLIENT_ORIGIN`
- Health check endpoint available at `/health`
- All API routes mounted under `/api` prefix
- Tests use Jest with ts-jest for TypeScript support
- Integration tests use real database (Docker PostgreSQL)
