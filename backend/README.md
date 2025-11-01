# Personal Finance Management - Backend API

Backend API cho ứng dụng Quản lý Tài chính Cá nhân, được xây dựng với Express, TypeScript, Prisma và PostgreSQL.

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Database](#database)

---

## 🎯 Tổng quan

Backend API cung cấp các chức năng:
- ✅ Xác thực người dùng (Register/Login) với JWT
- ✅ Quản lý giao dịch tài chính (Transactions)
- ✅ Quản lý danh mục thu/chi (Categories)
- ✅ Thiết lập ngân sách (Budgets)
- ✅ Theo dõi mục tiêu tài chính (Goals)
- ✅ Tích hợp AI cho phân tích tài chính (OpenAI)

---

## 🛠 Công nghệ sử dụng

### Backend Framework & Runtime
- **Node.js** v20+ - JavaScript runtime
- **TypeScript** v5.2 - Type-safe development
- **Express** v4.21 - Web framework
- **tsx** - TypeScript executor với hot reload

### Database & ORM
- **PostgreSQL** v15 - Relational database
- **Prisma** v5.22 - Modern ORM
- **Docker** - Database containerization

### Authentication & Security
- **JWT (jsonwebtoken)** - Token-based authentication
- **bcrypt** - Password hashing
- **Zod** - Runtime validation

### Testing
- **Jest** v30 - Testing framework
- **Supertest** - HTTP testing
- **ts-jest** - TypeScript support for Jest

### Additional Libraries
- **cors** - CORS middleware
- **dotenv** - Environment variables
- **OpenAI** - AI integration

---

## 📦 Yêu cầu hệ thống

Trước khi cài đặt, đảm bảo bạn đã cài đặt:

- **Node.js** >= 20.x ([Download](https://nodejs.org/))
- **npm** >= 10.x (đi kèm với Node.js)
- **PostgreSQL** >= 15.x ([Download](https://www.postgresql.org/download/))
- **Docker** (tùy chọn, để chạy PostgreSQL) ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

---

## 🚀 Cài đặt

### 1. Clone Repository

```bash
git clone https://github.com/your-username/persional_finane_MW.git
cd persional_finane_MW/backend
```

### 2. Cài đặt Dependencies

```bash
npm install
```

Các package chính sẽ được cài đặt:
```json
{
  "@prisma/client": "^5.22.0",
  "bcrypt": "^6.0.0",
  "express": "^4.21.2",
  "jsonwebtoken": "^9.0.2",
  "prisma": "^5.22.0",
  "zod": "^3.22.4"
}
```

### 3. Setup Database

#### Option A: Sử dụng Docker (Khuyến nghị)

Từ thư mục gốc của project:

```bash
cd ..
docker-compose up -d db
```

Docker sẽ tạo PostgreSQL container với:
- **User:** finance_user
- **Password:** super-secure
- **Database:** finance_db
- **Port:** 5432

#### Option B: Sử dụng PostgreSQL Local

1. Tạo database mới:
```sql
CREATE DATABASE finance_db;
CREATE USER finance_user WITH PASSWORD 'super-secure';
GRANT ALL PRIVILEGES ON DATABASE finance_db TO finance_user;
```

2. Hoặc sử dụng database/user có sẵn và cập nhật `.env`

---

## ⚙️ Cấu hình

### 1. Tạo file Environment Variables

```bash
cp .env.example .env
```

### 2. Cập nhật file `.env`

```env
# Database
DATABASE_URL="postgresql://finance_user:super-secure@localhost:5432/finance_db?schema=public"

# Server
BACKEND_PORT=4000
CLIENT_ORIGIN=http://localhost:5173

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AI Integration
OPENAI_API_KEY=sk-your-openai-api-key
```

**⚠️ Quan trọng:**
- `JWT_SECRET`: Đổi thành chuỗi ngẫu nhiên mạnh trong production
- `OPENAI_API_KEY`: Lấy từ [OpenAI Platform](https://platform.openai.com/)
- `DATABASE_URL`: Cập nhật nếu dùng database khác

### 3. Chạy Database Migrations

```bash
npx prisma migrate dev
```

Lệnh này sẽ:
- ✅ Tạo tất cả tables trong database
- ✅ Generate Prisma Client
- ✅ Apply schema changes

### 4. (Optional) Seed Database

Nếu bạn muốn tạo dữ liệu mẫu:

```bash
npx prisma db seed
```

---

## 🏃 Chạy ứng dụng

### Development Mode (Hot Reload)

```bash
npm run dev
```

Server sẽ chạy tại: **http://localhost:4000**

### Production Build

```bash
# Build TypeScript
npm run build

# Run production server
npm start
```

### Available Scripts

```bash
npm run dev          # Start development server với hot reload
npm run build        # Compile TypeScript sang JavaScript
npm start            # Run production build
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests với coverage report
```

---

## 📁 Cấu trúc dự án

```
backend/
├── prisma/
│   ├── migrations/           # Database migration files
│   └── schema.prisma        # Database schema definition
├── src/
│   ├── config/              # Configuration files
│   │   ├── env.ts          # Environment variables
│   │   └── prisma.ts       # Prisma client instance
│   ├── modules/             # Feature modules (domain-driven)
│   │   ├── auth/           # Authentication module
│   │   │   ├── __tests__/  # Module tests
│   │   │   ├── index.ts    # Router & controllers
│   │   │   ├── service.ts  # Business logic
│   │   │   ├── validation.ts # Zod schemas
│   │   │   ├── middleware.ts # Auth guards
│   │   │   └── README.md   # API documentation
│   │   ├── users/          # User management
│   │   ├── transactions/   # Financial transactions
│   │   ├── categories/     # Transaction categories
│   │   ├── budgets/        # Budget management
│   │   ├── goals/          # Financial goals
│   │   └── ai/             # AI integration
│   ├── routes/
│   │   └── index.ts        # Route aggregator
│   ├── services/
│   │   └── openaiClient.ts # OpenAI service
│   ├── index.ts            # Application entry point
│   └── server.ts           # Express server factory
├── .env.example            # Environment template
├── jest.config.js          # Jest configuration
├── package.json
├── tsconfig.json           # TypeScript configuration
├── postman_collection.json # Postman API collection
└── README.md
```

### Module-Based Architecture

Mỗi module (`src/modules/*`) chứa:
- **Router** - HTTP endpoints
- **Service** - Business logic
- **Validation** - Request/response schemas
- **Tests** - Unit & integration tests
- **README** - API documentation

**Nguyên tắc:** Business logic nằm TRONG module, KHÔNG nằm ở router aggregator.

---

## 📚 API Documentation

### Base URL

```
http://localhost:4000/api
```

### Authentication Endpoints

Chi tiết đầy đủ: [`src/modules/auth/README.md`](src/modules/auth/README.md)

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"  // optional
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbG..."
}
```

#### Protected Endpoints

Thêm header Authorization:
```http
Authorization: Bearer <access_token>
```

### Postman Collection

Import file `postman_collection.json` vào Postman để test API nhanh chóng.

Collection bao gồm:
- ✅ Tất cả auth endpoints
- ✅ Tự động lưu tokens
- ✅ Test scripts
- ✅ Environment variables

---

## 🧪 Testing

### Chạy Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests với coverage
npm run test:coverage
```

### Test Coverage

Project có **25 tests** bao gồm:
- ✅ Unit tests cho auth service
- ✅ Integration tests cho auth endpoints
- ✅ Password hashing & verification
- ✅ JWT token generation & validation
- ✅ AuthGuard middleware
- ✅ Protected routes

### Test Structure

```
src/modules/auth/__tests__/
├── service.test.ts      # Unit tests
└── integration.test.ts  # API integration tests
```

---

## 💾 Database

### Schema Overview

6 Models chính:
- **User** - User accounts
- **Category** - Transaction categories (INCOME/EXPENSE/TRANSFER)
- **Transaction** - Financial transactions
- **Budget** - Budget allocations (MONTHLY/WEEKLY/ANNUAL)
- **Goal** - Financial goals
- **AIInsight** - AI-generated insights

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create new migration
npx prisma migrate dev --name <migration_name>

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Open Prisma Studio (Database GUI)
npx prisma studio
```

### Prisma Studio

GUI tool để quản lý database:

```bash
npx prisma studio
```

Mở browser tại: **http://localhost:5555**

---

## 🔒 Security

### Password Security
- Sử dụng bcrypt với 10 salt rounds
- Passwords KHÔNG BAO GIỜ được trả về trong API responses

### JWT Security
- Access tokens: 15 phút (configurable)
- Refresh tokens: 7 ngày (configurable)
- Token rotation khi refresh
- Token type validation (access vs refresh)

### Environment Variables
- ⚠️ KHÔNG commit file `.env` vào Git
- ✅ Sử dụng `.env.example` làm template
- ✅ Đổi `JWT_SECRET` trong production

---

## 🐛 Troubleshooting

### Port đã được sử dụng

```bash
# Windows
netstat -ano | findstr :4000
taskkill //PID <PID_NUMBER> //F

# Linux/Mac
lsof -ti:4000 | xargs kill -9
```

### Database connection error

1. Kiểm tra PostgreSQL đang chạy:
```bash
# Docker
docker ps

# Local
pg_isready
```

2. Kiểm tra `DATABASE_URL` trong `.env`

3. Test connection:
```bash
npx prisma db pull
```

### Prisma Client not generated

```bash
npx prisma generate
```

---

## 📝 Development Notes

- **ES Modules:** Project sử dụng ES modules (`"type": "module"`)
- **Hot Reload:** tsx watch tự động reload khi code thay đổi
- **Path Aliases:** TypeScript aliases configured (@config, @modules, @routes)
- **CORS:** Configured cho frontend origin
- **Health Check:** GET /health endpoint

---

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

ISC

---

## 👥 Authors

- Your Name - [GitHub Profile](https://github.com/your-username)

---

## 🙏 Acknowledgments

- Express.js team
- Prisma team
- OpenAI
- All contributors
-ai
---

## 📞 Support

Nếu gặp vấn đề, hãy [tạo issue](https://github.com/your-username/persional_finane_MW/issues) trên GitHub.
