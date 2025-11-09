# Frontend container for the Vite + React + Tailwind app.
FROM node:20-alpine AS base
WORKDIR /app

# Only copy manifest files for faster installs during development builds.
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies (keep devDependencies for Vite)
RUN npm install --legacy-peer-deps

# Copy source for the actual build step.
COPY . .

# Vite dev server entry point (overridden in production by `npm run build`).
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
