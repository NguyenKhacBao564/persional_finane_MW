# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal Finance Management web application with AI integration. Built as a full-stack TypeScript application with React frontend, Node.js/Express backend, and PostgreSQL database. Features include transaction management, budgeting, financial goals, and AI-powered insights.

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Radix UI
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL 15 (Dockerized)
- **AI Integration**: OpenAI API (main app) + AWS SageMaker (custom chatbot)
- **Testing**: Jest + Supertest (backend)
- **Deployment**: Docker + GitHub Actions CI/CD

## Development Commands

### Full Stack Development
```bash
# Start all services locally
docker-compose up -d

# Stop all services
docker-compose down
```

### Backend Development
```bash
cd backend
npm run dev          # Start with hot reload (tsx)
npm run build        # TypeScript compilation
npm run start        # Start production build
npm test             # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Frontend Development
```bash
cd frontend
npm run dev          # Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
```

### AI Chatbot Feature (Python)
```bash
cd Feature/AI_Chatbot
pip install -r requirement.txt    # Install Python dependencies
python respone_test.py            # Test SageMaker endpoint
```

## Architecture

### Backend Structure (Domain-Driven Design)
- `src/modules/`: Domain-specific modules (auth, users, transactions, categories, budgets, goals, ai)
- Each module contains: router → service → validation → tests → README
- `src/config/`: Environment and Prisma configuration
- `src/routes/`: Route aggregation
- `prisma/schema.prisma`: Database schema with 6 core models (User, Transaction, Category, Budget, Goal, AIInsight)

### Frontend Structure
- Modern React with functional components and hooks
- Radix UI primitives with custom Tailwind styling
- TanStack Query for server state, React Hook Form for forms
- Component-driven architecture with TypeScript

### Database Schema
Key models: User (auth), Transaction (financial data), Category (INCOME/EXPENSE/TRANSFER), Budget (planning), Goal (savings), AIInsight (AI-generated recommendations).

### AI Integration
Two separate AI systems:
1. **Main Application**: OpenAI API integration in backend for financial insights
2. **AI Chatbot Feature**: Custom Llama 3 8B model on AWS SageMaker with Python interface

## Testing

The backend includes comprehensive Jest tests (25 tests) covering:
- Authentication endpoints and middleware
- Service layer business logic
- API endpoint functionality
- Input validation and error handling

Run tests with `npm test` in the backend directory.

## Environment Configuration

Required environment variables (see `.env.example`):
- Database: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`
- Backend: `OPENAI_API_KEY`, `BACKEND_PORT`
- Frontend: `FRONTEND_PORT`
- AI Feature: AWS credentials in `/Feature/AI_Chatbot/.env`

## CI/CD Pipeline

GitHub Actions automatically:
- Installs dependencies for all services
- Runs database migrations
- Builds frontend and backend
- Runs test suites
- Deploys to production

## Key Files to Understand

- `docker-compose.yml`: Local development environment setup
- `backend/prisma/schema.prisma`: Complete database structure
- `backend/package.json`: Backend dependencies and scripts
- `frontend/package.json`: Frontend dependencies and scripts
- `Feature/AI_Chatbot/requirement.txt`: AI/ML Python dependencies

## Development Notes

- Use TypeScript throughout the main application
- Follow domain-driven design patterns in backend modules
- Frontend uses modern React patterns with hooks
- Database changes must be made through Prisma migrations
- AI features have separate Python environment with SageMaker integration
- All services run in Docker containers for consistency