# 🔧 Hướng Dẫn Cài Đặt - Personal Finance Management Web App

## 📋 Yêu Cầu Hệ Thống

Trước khi bắt đầu, hãy đảm bảo bạn đã cài đặt các công cụ sau:

- **Node.js** >= 20.x ([Tải tại đây](https://nodejs.org/))
- **Docker** và **Docker Compose** >= 2.20 ([Tải tại đây](https://www.docker.com/))
- **PostgreSQL** >= 14 (chỉ cần nếu chạy thủ công, không dùng Docker)
- **npm** hoặc **pnpm** (đi kèm Node.js)
- **Git** ([Tải tại đây](https://git-scm.com/))

### Kiểm Tra Phiên Bản

```bash
node --version    # Nên >= v20.x.x
npm --version     # Nên >= 9.x.x
docker --version  # Nên >= 24.x.x
docker compose version  # Nên >= 2.20.x
```

---

## 🚀 Cài Đặt Dự Án

### Bước 1: Clone Repository

```bash
git clone https://github.com/NguyenKhacBao564/persional_finane_MW.git
cd persional_finane_MW
```

### Bước 2: Cấu Hình Biến Môi Trường

1. Copy file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

2. Mở file `.env` và cấu hình các biến môi trường:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finance_db"

# JWT Secret (Tạo secret key mạnh)
JWT_SECRET="your-super-secret-key-here-change-this"
JWT_REFRESH_SECRET="your-refresh-secret-key-here-change-this"

# OpenAI API (Tùy chọn - Cho tính năng AI)
OPENAI_API_KEY="your-openai-api-key"

# Port Configuration
PORT=3000
FRONTEND_PORT=5173

# Environment
NODE_ENV=development
```

**Lưu ý quan trọng:**
- Đổi `JWT_SECRET` và `JWT_REFRESH_SECRET` thành chuỗi bí mật mạnh của bạn
- Nếu muốn sử dụng tính năng AI, cần API key từ [OpenAI](https://platform.openai.com/)

---

## 🐳 Chạy Dự Án Với Docker (Khuyên Dùng)

Đây là cách đơn giản nhất để chạy toàn bộ ứng dụng (Database, Backend, Frontend).

### Bước 1: Build và Khởi Động Containers

```bash
docker compose up --build
```

Lệnh này sẽ:
- Tạo PostgreSQL database container
- Build và chạy backend API (Express + Prisma)
- Build và chạy frontend (Vite + React)

### Bước 2: Truy Cập Ứng Dụng

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432

### Dừng Containers

```bash
# Dừng mà giữ lại dữ liệu
docker compose down

# Dừng và xóa toàn bộ dữ liệu
docker compose down -v
```

---

## 💻 Chạy Dự Án Thủ Công (Không Dùng Docker)

Nếu bạn muốn chạy từng phần riêng lẻ:

### Bước 1: Cài Đặt Dependencies

```bash
# Cài đặt dependencies cho backend
cd backend
npm install

# Cài đặt dependencies cho frontend
cd ../frontend
npm install
```

### Bước 2: Cài Đặt và Chạy PostgreSQL

1. **Cài đặt PostgreSQL** trên máy (hoặc dùng Docker riêng):

```bash
# Chạy PostgreSQL với Docker (nếu chỉ muốn dùng DB)
docker run --name finance-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=finance_db \
  -p 5432:5432 \
  -d postgres:14
```

2. **Kiểm tra kết nối**:

```bash
psql -h localhost -U postgres -d finance_db
```

### Bước 3: Chạy Migration Database

```bash
cd backend

# Tạo database schema
npx prisma migrate dev

# (Tùy chọn) Seed dữ liệu mẫu
npx prisma db seed
```

### Bước 4: Chạy Backend

```bash
cd backend

# Development mode (tự động reload khi code thay đổi)
npm run dev

# Production mode
npm run build
npm start
```

Backend sẽ chạy tại: http://localhost:3000

### Bước 5: Chạy Frontend

Mở terminal mới:

```bash
cd frontend

# Development mode (hot reload)
npm run dev

# Production build
npm run build
npm run preview
```

Frontend sẽ chạy tại: http://localhost:5173

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Chạy tất cả tests
npm test

# Chạy tests với watch mode
npm run test:watch

# Kiểm tra test coverage
npm run test:coverage
```

### Frontend Tests (Nếu có)

```bash
cd frontend
npm test
```

---

## 📊 Quản Lý Database

### Xem Database với Prisma Studio

```bash
cd backend
npx prisma studio
```

Prisma Studio sẽ mở tại: http://localhost:5555

### Chạy Migration

```bash
cd backend

# Tạo migration mới
npx prisma migrate dev --name your_migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (XÓA TẤT CẢ DỮ LIỆU)
npx prisma migrate reset
```

### Backup Database

Sử dụng script có sẵn:

```bash
# Backup local database
./scripts/backup.sh /path/to/backup/directory

# Backup từ Docker
docker exec finance-postgres pg_dump -U postgres finance_db > backup.sql
```

### Restore Database

```bash
# Restore từ file backup
psql -h localhost -U postgres -d finance_db < backup.sql

# Hoặc với Docker
docker exec -i finance-postgres psql -U postgres -d finance_db < backup.sql
```

---

## 🔧 Scripts Hữu Ích

### Backend Scripts

```bash
npm run dev          # Chạy dev server với nodemon
npm run build        # Build TypeScript sang JavaScript
npm start            # Chạy production server
npm test             # Chạy Jest tests
npm run lint         # Kiểm tra code style
npm run format       # Format code với Prettier
```

### Frontend Scripts

```bash
npm run dev          # Chạy Vite dev server
npm run build        # Build production bundle
npm run preview      # Preview production build
npm run lint         # Kiểm tra ESLint
```

---

## 🐛 Xử Lý Lỗi Thường Gặp

### 1. Port Already in Use

```bash
# Kiểm tra process đang dùng port
# Linux/Mac:
lsof -i :3000
lsof -i :5173

# Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Kill process (thay PID bằng process ID tìm được)
kill -9 PID         # Linux/Mac
taskkill /PID PID /F  # Windows
```

### 2. Database Connection Error

- Kiểm tra PostgreSQL đang chạy:
  ```bash
  docker ps | grep postgres
  ```
- Kiểm tra `DATABASE_URL` trong file `.env`
- Thử chạy lại migration:
  ```bash
  cd backend
  npx prisma migrate dev
  ```

### 3. Module Not Found

```bash
# Xóa node_modules và cài lại
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### 4. Prisma Client Issues

```bash
cd backend

# Regenerate Prisma Client
npx prisma generate

# Nếu vẫn lỗi, reset và migrate lại
npx prisma migrate reset
npx prisma migrate dev
```

### 5. Docker Build Fails

```bash
# Xóa tất cả containers và images cũ
docker compose down -v
docker system prune -a

# Build lại
docker compose up --build
```

---

## 🌐 Deploy Production

### Chuẩn Bị Production Environment

1. **Setup Production Database**:
   - Sử dụng managed PostgreSQL (AWS RDS, Supabase, Railway...)
   - Cập nhật `DATABASE_URL` trong production environment

2. **Build Production**:

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd ../frontend
npm run build
```

3. **Environment Variables**:

Đảm bảo set các biến môi trường production:
- `NODE_ENV=production`
- `DATABASE_URL` (production database)
- `JWT_SECRET` (secret mạnh, khác development)
- `OPENAI_API_KEY` (nếu dùng AI features)

### Deploy Options

- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Backend**: Railway, Render, Heroku, AWS EC2
- **Database**: Supabase, Railway, AWS RDS, DigitalOcean

---

## 📚 Tài Liệu Bổ Sung

- **Hướng dẫn sử dụng**: [USER_GUIDE.md](./USER_GUIDE.md)
- **API Documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Repository Guidelines**: [AGENTS.md](./AGENTS.md)

---

## 🤝 Đóng Góp

Nếu muốn đóng góp cho dự án:

1. Fork repository
2. Tạo branch mới: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add some feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Tạo Pull Request

---

## 📞 Hỗ Trợ

Gặp vấn đề? Tạo issue tại: [GitHub Issues](https://github.com/NguyenKhacBao564/persional_finane_MW/issues)

---

**Happy Coding! 🚀**
