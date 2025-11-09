# Database Management Guide

## 🤔 Tại sao clone về lại mất data?

### Database hoạt động như thế nào?

```
┌─────────────────────────────────────────────────────────┐
│  Git Repository (GitHub)                                │
│  ✅ Code, schema, migrations                            │
│  ❌ KHÔNG có database data                              │
└─────────────────────────────────────────────────────────┘
                         │
                    git clone
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Máy tính của bạn                                       │
│  ├── Code (từ Git) ✅                                   │
│  └── PostgreSQL Server (LOCAL)                          │
│      └── Database "pfm"                                 │
│          └── Data ❓ (PHẢI TỰ TẠO)                      │
└─────────────────────────────────────────────────────────┘
```

**Giải thích:**
- `prisma/schema.prisma` = Bản thiết kế (blueprint) của database
- PostgreSQL Server = Nơi lưu data THẬT SỰ
- Git KHÔNG đồng bộ database data, chỉ đồng bộ code

---

## ✅ Cách khôi phục data sau khi clone

### **Phương án 1: Seed Data (Khuyên dùng - Đã setup sẵn)**

#### Bước 1: Setup database
```bash
cd backend

# Tạo database và chạy migrations
npx prisma migrate deploy

# Hoặc trong dev mode
npx prisma migrate dev
```

#### Bước 2: Seed dữ liệu mẫu
```bash
npm run db:seed
```

**Kết quả:**
- ✅ Tạo 2 users mẫu
- ✅ Tạo 7 categories
- ✅ Tạo 3 sample transactions
- ✅ Tạo 1 sample budget
- ✅ Tạo 1 sample goal

**Demo credentials:**
- Email: `demo@example.com`
- Password: `password123`

---

### **Phương án 2: Export/Import Database**

#### Trên máy CŨ (có data):

**Windows:**
```bash
cd backend
export-db.bat
```

**Mac/Linux:**
```bash
cd backend
pg_dump -U postgres -h localhost -p 5432 pfm > database-backup.sql
```

**Commit file SQL:**
```bash
git add database-backup.sql
git commit -m "Add database backup"
git push
```

#### Trên máy MỚI (sau khi clone):

**Windows:**
```bash
cd backend
import-db.bat
```

**Mac/Linux:**
```bash
cd backend
# Tạo database
psql -U postgres -c "CREATE DATABASE pfm;"

# Import data
psql -U postgres pfm < database-backup.sql
```

---

### **Phương án 3: Docker (Best practice)**

Sử dụng Docker để database và code luôn đồng bộ:

**docker-compose.yml** (đã có sẵn ở project root):
```yaml
services:
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 123
      POSTGRES_DB: pfm

volumes:
  postgres_data:  # Data được lưu trong Docker volume
```

**Khởi động:**
```bash
# Từ project root
docker-compose up -d

# Chạy migrations
cd backend
npx prisma migrate deploy

# Seed data
npm run db:seed
```

**Lợi ích:**
- ✅ Database version control
- ✅ Dễ dàng reset về trạng thái sạch
- ✅ Consistent giữa dev environments
- ✅ Team members có cùng setup

---

## 🔄 Workflow sau khi clone

### Lần đầu setup (máy mới):

```bash
# 1. Clone repository
git clone <repo-url>
cd persional_finane_MW/backend

# 2. Install dependencies
npm install

# 3. Setup .env
cp .env.example .env
# Chỉnh sửa .env nếu cần

# 4. Setup database
npx prisma migrate deploy

# 5. Seed dữ liệu mẫu
npm run db:seed

# 6. Start backend
npm run dev
```

### Check database:
```bash
# Mở Prisma Studio
npx prisma studio

# Truy cập: http://localhost:5555
```

---

## 📊 Database Connection String

File `.env`:
```
DATABASE_URL=postgresql://postgres:123@localhost:5432/pfm?schema=public
              ↓        ↓    ↓           ↓     ↓
           username password host     port database_name
```

**Thay đổi theo môi trường:**

**Development (Local):**
```
DATABASE_URL=postgresql://postgres:123@localhost:5432/pfm?schema=public
```

**Docker:**
```
DATABASE_URL=postgresql://postgres:123@db:5432/pfm?schema=public
                                       ↑
                              Docker service name
```

**Production:**
```
DATABASE_URL=postgresql://user:pass@your-db-host.com:5432/pfm_prod?schema=public
```

---

## 🛠️ Useful Commands

### Prisma Commands:
```bash
# Xem database hiện tại
npx prisma studio

# Tạo migration mới
npx prisma migrate dev --name <migration_name>

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (XÓA TẤT CẢ DATA)
npx prisma migrate reset

# Regenerate Prisma client
npx prisma generate
```

### Custom Commands:
```bash
# Seed database
npm run db:seed

# Sync database to JSON (for AI Chatbot)
npm run db:sync

# Export database (Windows)
export-db.bat

# Import database (Windows)
import-db.bat
```

---

## ⚠️ Lưu ý quan trọng

### 1. **KHÔNG commit .env vào Git**
File `.env` chứa thông tin nhạy cảm (passwords, secrets)
- ✅ Commit: `.env.example`
- ❌ KHÔNG commit: `.env`

### 2. **KHÔNG commit database-backup.sql** (tùy chọn)
Nếu có data nhạy cảm, thêm vào `.gitignore`:
```
database-backup.sql
```

### 3. **Migrations phải được commit**
```
✅ Commit: prisma/migrations/*
```

### 4. **Database production**
- ⚠️ KHÔNG chạy `migrate reset` trên production
- ⚠️ KHÔNG seed data thật với data mẫu
- ✅ Luôn backup trước khi migrate

---

## 🔍 Troubleshooting

### "Database does not exist"
```bash
# Tạo database
psql -U postgres -c "CREATE DATABASE pfm;"

# Hoặc
docker-compose up -d db
```

### "Connection refused"
- Check PostgreSQL đang chạy: `pg_isready`
- Check port 5432 có bị block không
- Check credentials trong `.env`

### "Migration failed"
```bash
# Reset và chạy lại
npx prisma migrate reset
npx prisma migrate deploy
npm run db:seed
```

### Prisma Studio không hiện data
- Check connection string trong `.env`
- Check database có tồn tại không
- Restart Prisma Studio

---

## 📚 Tài liệu tham khảo

- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Seeding](https://www.prisma.io/docs/guides/database/seed-database)
- [PostgreSQL Backup/Restore](https://www.postgresql.org/docs/current/backup.html)
