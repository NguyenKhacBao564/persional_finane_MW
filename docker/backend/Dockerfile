# Backend container for Express + Prisma API server.
FROM node:20-slim AS base

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Install dependencies first to leverage Docker layer caching.
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy source code after dependencies are cached.
COPY . .

EXPOSE 4000

# Start script that runs migrations and seeds before starting server
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
