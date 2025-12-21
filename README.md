Personal Finance Management Web Application

  1. Project Overview

  This project is a comprehensive full-stack web application designed to assist
  individuals and students in managing their personal finances. The system
  provides a centralized platform for tracking income and expenses, setting budget
  limits, and visualizing financial health through interactive dashboards.

  A key differentiator of this application is the integration of an AI-powered
  financial assistant. Utilizing the Google Gemini API, the chatbot provides
  personalized financial guidance and answers questions based on the user's
  transaction history and context.

  2. Features

   * User Authentication: Secure registration and login functionality using JSON
     Web Tokens (JWT).
   * Transaction Management: Create, read, update, and delete (CRUD) income and
     expense transactions. Support for categorization, accounts, and notes.
   * Dashboard & Analytics: Interactive visualization of financial data, including
     Cash Flow Trends (Area Charts) and Spending Breakdown (Donut Charts).
   * Budgeting: functionality to set monthly spending limits per category and
     track progress.
   * AI Financial Assistant: An integrated chatbot capable of analyzing user data
     to provide insights, answer financial queries, and offer recommendations.
   * Responsive Design: A modern user interface built with Tailwind CSS, ensuring
     usability across devices.
   * Containerized Environment: Fully dockerized application ensuring consistency
     across development and production environments.

  3. Technology Stack

  Frontend
   * Framework: React (v18)
   * Language: TypeScript
   * Build Tool: Vite
   * Styling: Tailwind CSS, Shadcn/UI components
   * State Management: React Query (TanStack Query)
   * Data Visualization: Recharts
   * Form Handling: React Hook Form + Zod

  Backend
   * Runtime: Node.js
   * Framework: Express.js
   * Language: TypeScript
   * Database: PostgreSQL
   * ORM: Prisma
   * Authentication: JWT (JSON Web Tokens)
   * AI Integration: Google Gemini API (Generative AI)

  DevOps & Infrastructure
   * Containerization: Docker
   * Orchestration: Docker Compose

  4. System Architecture

  The application follows a standard Client-Server architecture:

   1. Presentation Layer (Frontend): The React application runs in the client's
      browser. It communicates with the backend via RESTful API endpoints. It
      handles user interactions, data validation, and visualization.
   2. Application Layer (Backend): The Node.js/Express server handles business
      logic, authentication, and data processing. It serves as the bridge between
      the frontend, the database, and external AI services. API keys for AI
      services are stored securely here and never exposed to the client.
   3. Data Layer (Database): A PostgreSQL database stores user profiles,
      transactions, categories, budgets, and system logs. It runs in an isolated
      Docker container with persistent volume storage.
   4. External Services (AI): The backend communicates with the Google Gemini API
      to process natural language queries. The backend "grounds" the AI by
      providing relevant, anonymized transaction context to ensure accurate and
      personalized responses.

  5. Getting Started

  Follow these instructions to set up and run the project locally using Docker.

  Prerequisites
   * Docker and Docker Compose installed on your machine.
   * Git for version control.
   * A web browser.

  Installation Steps

   1. Clone the Repository
   1     git clone <repository-url>
   2     cd Finance_management_web

   2. Environment Configuration
      The project requires environment variables to run. Locate the .env.example
  file in the backend directory and create a new .env file.

   1     cp backend/.env.example backend/.env

      Open backend/.env and update the values if necessary. For the AI features to
  work, you must provide a valid API key.

   3. Run with Docker Compose
      Build and start the services using the provided make scripts or docker
  commands directly.

   1     # Build and start all containers in detached mode
   2     docker-compose up -d --build

      This command will:
       * Pull the PostgreSQL image.
       * Build the Backend image.
       * Build the Frontend image.
       * Create a dedicated network.
       * Run database migrations (if configured in the entrypoint).

   4. Access the Application
      Once the containers are running:
       * Frontend: Access the web interface at http://localhost (or
         http://localhost:5173 depending on configuration).
       * Backend API: Running at http://localhost:4000.
       * Database: Accessible internally via the service name db.

   5. Stopping the Application
      To stop the containers:
   1     docker-compose down

  6. Environment Variables

  The application relies on several environment variables defined in backend/.env.

  Critical Variables:
   * DATABASE_URL: Connection string for PostgreSQL (e.g.,
     postgresql://user:password@db:5432/dbname).
   * JWT_SECRET: A long, random string used to sign authentication tokens.
   * PORT: The port the backend server listens on (default: 4000).

  Optional Variables (AI Features):
   * GEMINI_API_KEY: Your API key from Google AI Studio.

  Security Warning: The .env file contains sensitive secrets. It is included in
  .gitignore and must never be committed to the version control system.

  7. AI Chatbot Notes

  The AI Chatbot feature leverages the Google Gemini API.

   * Functionality: It serves as a financial advisor. When a user asks a question
     (e.g., "How much did I spend on food last month?"), the backend retrieves
     relevant transaction data and feeds it to the AI model as context.
   * Privacy: Only necessary transaction metadata is sent to the AI model for
     processing. No PII (Personally Identifiable Information) beyond the financial
     context is shared.
   * Missing Keys: If the GEMINI_API_KEY is not configured in the .env file, the
     chatbot feature will either be disabled in the UI or return a graceful error
     message indicating that the service is unavailable. The rest of the
     application (Transactions, Budgeting) will continue to function normally.

  8. Deployment Notes

  This project is optimized for deployment via Docker.

   * Production Build: The Dockerfile includes multi-stage builds to create
     optimized production images (e.g., using Nginx to serve the React frontend
     static files).
   * Server Requirements: Any VPS (Virtual Private Server) or cloud instance
     capable of running Docker Engine.
   * Reverse Proxy: In a production environment, it is recommended to set up a
     reverse proxy (like Nginx or Traefik) in front of the application to handle
     SSL/TLS termination (HTTPS).

  9. License & Disclaimer

  Disclaimer: This project is developed for educational and demonstration
  purposes. It is not intended to be a replacement for professional financial
  advice. Users should use the AI-generated advice with discretion.

  License: Proprietary / Educational Use Only.