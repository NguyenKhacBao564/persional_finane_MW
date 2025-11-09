# Database Ports & Connection Guide

## ⚠️ QUAN TRỌNG: Bạn có 2 PostgreSQL databases!

### 1️⃣ Docker PostgreSQL (Port 5432)
**Đây là database ĐÚNG mà backend Docker đang sử dụng!**

```
Host: localhost
Port: 5432
Database: finance_db
Username: finance_user
Password: super-secure-password-123
```

**Connection String:**
```
postgresql://finance_user:super-secure-password-123@localhost:5432/finance_db
```

**Đặc điểm:**
- ✅ Backend Docker ghi data vào đây
- ✅ Auto-sync sang database.json
- ✅ Chạy trong Docker container `pfm_db`
- ✅ Data persistence qua Docker volume `db_data`

---

### 2️⃣ Local PostgreSQL (Port 9018)
**Database LOCAL cài trên Windows - KHÔNG được backend Docker sử dụng!**

```
Host: localhost
Port: 9018
Database: finance_db (hoặc tên khác)
Username: postgres
Password: 123
```

**Connection String:**
```
postgresql://postgres:123@localhost:9018/finance_db
```

**Đặc điểm:**
- ❌ Backend Docker KHÔNG dùng database này
- ❌ Không có auto-sync
- ⚠️ Có thể có data CŨ từ development trước
- ⚠️ Nếu pgAdmin connect vào đây sẽ KHÔNG thấy data mới

---

## 🎯 Which Database Should You Use?

### Nếu chạy với Docker (RECOMMENDED)

**Backend:** Docker container
**Database:** Docker PostgreSQL (port 5432)
**pgAdmin:** Connect đến `localhost:5432`

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      DATABASE_URL: postgresql://finance_user:super-secure@db:5432/finance_db
```

**pgAdmin Connection:**
```
Host: localhost
Port: 5432
Username: finance_user
Password: super-secure-password-123
```

---

### Nếu chạy Local Development (Không dùng Docker)

**Backend:** `npm run dev` trong folder backend
**Database:** Local PostgreSQL (port 9018)
**pgAdmin:** Connect đến `localhost:9018`

**File .env trong backend/:**
```env
DATABASE_URL=postgresql://postgres:123@localhost:9018/finance_db
```

**pgAdmin Connection:**
```
Host: localhost
Port: 9018
Username: postgres
Password: 123
```

---

## 🔧 Cách Kiểm Tra Đang Dùng Database Nào

### Method 1: Check Backend Logs

**Docker backend:**
```bash
docker-compose logs backend | grep "Datasource"
```

**Expected output:**
```
Datasource "db": PostgreSQL database "finance_db" at "db:5432"
```

**Local backend:**
```bash
# Nếu đang chạy npm run dev
# Check console output
# Should see: localhost:9018
```

### Method 2: Check Environment Variable

**Docker:**
```bash
docker-compose exec backend printenv DATABASE_URL
```

**Output:**
```
postgresql://finance_user:super-secure-password-123@db:5432/finance_db
```

**Local:**
```bash
# Trong folder backend
cat .env | grep DATABASE_URL
```

**Output:**
```
DATABASE_URL=postgresql://postgres:123@localhost:9018/finance_db
```

### Method 3: Count Records

**Docker database:**
```bash
docker-compose exec db psql -U finance_user -d finance_db -c "SELECT COUNT(*) FROM \"Transaction\";"
```

**Local database:**
```bash
psql -U postgres -h localhost -p 9018 -d finance_db -c "SELECT COUNT(*) FROM \"Transaction\";"
```

Nếu 2 con số khác nhau → Chứng tỏ 2 databases riêng biệt!

---

## 🛠️ Fix: Đổi pgAdmin sang Đúng Database

### Nếu Backend chạy Docker → pgAdmin phải connect port 5432

**Bước 1:** Mở pgAdmin 4

**Bước 2:** Right-click server → Properties

**Bước 3:** Tab "Connection", sửa:
```
Port: 5432         ← ĐỔI từ 9018
Username: finance_user    ← ĐỔI từ postgres
Password: super-secure-password-123
```

**Bước 4:** Save → Disconnect → Connect lại

**Bước 5:** Refresh tables (F5)

**Bước 6:** View data → Phải thấy data mới!

---

## 📋 Quick Reference

### Docker Setup (Current)

| Service | Host (from container) | Host (from Windows) | Port |
|---------|----------------------|---------------------|------|
| Database | `db` | `localhost` | 5432 |
| Backend | `backend` | `localhost` | 4000 |
| Frontend | `frontend` | `localhost` | 5173 |

### Connection Matrix

| From | To | Host | Port |
|------|-----|------|------|
| Backend container | Database container | `db` | 5432 |
| pgAdmin local | Docker database | `localhost` | 5432 |
| pgAdmin local | Local database | `localhost` | 9018 |
| Windows app | Backend API | `localhost` | 4000 |

---

## ⚠️ Common Mistakes

### ❌ Mistake 1: Wrong Port
**Problem:** pgAdmin connect port 9018, backend dùng port 5432
**Solution:** Đổi pgAdmin sang port 5432

### ❌ Mistake 2: Wrong Username
**Problem:** Docker database dùng `finance_user`, pgAdmin dùng `postgres`
**Solution:** Đổi username sang `finance_user`

### ❌ Mistake 3: Wrong Password
**Problem:** Docker database password khác Local
**Solution:** Dùng password: `super-secure-password-123`

### ❌ Mistake 4: Wrong Host in pgAdmin
**Problem:** pgAdmin dùng `db` instead of `localhost`
**Solution:** Dùng `localhost` (vì pgAdmin local không trong Docker network)

---

## 🔍 Troubleshooting

### Issue: "Password authentication failed"

**Check password:**
```bash
# Docker database password
docker-compose exec backend printenv DATABASE_URL
# Extract password from connection string
```

**Reset password:**
```bash
docker-compose exec db psql -U postgres -c "ALTER USER finance_user WITH PASSWORD 'super-secure-password-123';"
```

### Issue: "Database does not exist"

**Check database name:**
```bash
docker-compose exec db psql -U finance_user -l
```

**Create database if needed:**
```bash
docker-compose exec db psql -U finance_user -c "CREATE DATABASE finance_db;"
```

### Issue: Data không match giữa pgAdmin và database.json

**Nguyên nhân:** pgAdmin đang xem sai database

**Giải pháp:**
1. Check backend đang connect đến đâu:
   ```bash
   docker-compose logs backend | grep Datasource
   ```
2. Đổi pgAdmin connection sang đúng port
3. Refresh data

---

## 📊 Data Comparison Script

Tạo file `compare-databases.js`:

```javascript
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// Docker database
const dockerPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://finance_user:super-secure-password-123@localhost:5432/finance_db'
    }
  }
});

// Local database
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:123@localhost:9018/finance_db'
    }
  }
});

async function compare() {
  console.log('Docker Database:');
  const dockerCount = await dockerPrisma.transaction.count();
  console.log(`  Transactions: ${dockerCount}`);

  console.log('\nLocal Database:');
  const localCount = await localPrisma.transaction.count();
  console.log(`  Transactions: ${localCount}`);

  await dockerPrisma.$disconnect();
  await localPrisma.$disconnect();
}

compare();
```

---

## 💡 Best Practice

### Development với Docker (Recommended)

1. ✅ Chạy tất cả services qua Docker
   ```bash
   docker-compose up -d
   ```

2. ✅ pgAdmin connect port 5432
   ```
   Host: localhost
   Port: 5432
   Username: finance_user
   ```

3. ✅ Đóng local PostgreSQL (port 9018) để tránh nhầm lẫn
   ```
   # Windows Services → PostgreSQL → Stop
   ```

4. ✅ Chỉ dùng 1 database duy nhất
   - Ít confusing hơn
   - Dễ debug
   - Data consistency

---

**TÓM LẠI:**
- Backend Docker → Port 5432 ✅
- pgAdmin phải connect → Port 5432 ✅
- KHÔNG dùng port 9018 nếu backend chạy Docker ❌
