# Hướng dẫn Refresh Data trong pgAdmin

## Xác nhận: Database CÓ DATA

Database hiện tại có:
- ✅ **4 Users** (mới nhất: tam8@gmail.com)
- ✅ **10 Transactions** (mới nhất: transaction "9" với amount 100.00)
- ✅ **7 Categories**

**Vấn đề**: pgAdmin không hiển thị hoặc chưa cập nhật data

---

## Bước 1: Xác định bạn đang dùng pgAdmin nào?

### Option A: pgAdmin Local (Cài trên Windows)
- Mở qua Start Menu → pgAdmin 4
- URL: http://127.0.0.1:xxxx (port ngẫu nhiên)
- **Connection settings**: Host = `localhost` hoặc `127.0.0.1`

### Option B: pgAdmin trong Docker
- Mở qua browser: http://localhost:5050
- Cần start Docker container trước
- **Connection settings**: Host = `db`

---

## Bước 2: Hướng dẫn theo từng trường hợp

### 📌 CASE 1: Bạn đang dùng pgAdmin LOCAL

#### Kiểm tra kết nối

**Connection settings PHẢI là:**
```
Host: localhost         ← hoặc 127.0.0.1
Port: 5432
Database: finance_db
Username: finance_user
Password: super-secure-password-123
```

**⚠️ KHÔNG dùng `db` cho pgAdmin local!**
- `db` chỉ dùng cho containers trong Docker network
- pgAdmin local phải dùng `localhost` để kết nối từ host machine

#### Cách Refresh Data (pgAdmin Local)

**Method 1: Refresh Table**
1. Trong Browser panel bên trái
2. Navigate: `Servers > Your Server > Databases > finance_db > Schemas > public > Tables`
3. Right-click vào table (VD: `Transaction`)
4. Click **"Refresh"** hoặc nhấn **F5**

**Method 2: Refresh Data View**
1. Nếu đang mở View/Edit Data
2. Click icon **Refresh** trên toolbar (vòng tròn với mũi tên)
3. Hoặc đóng tab và mở lại: Right-click table → `View/Edit Data` → `All Rows`

**Method 3: Re-run Query**
1. Click `Tools` → `Query Tool`
2. Chạy query:
   ```sql
   SELECT * FROM "Transaction" ORDER BY "createdAt" DESC;
   ```
3. Click **Execute/Run** (F5)

#### Nếu vẫn không thấy data

**Disconnect và reconnect server:**
1. Right-click vào Server name
2. Click **"Disconnect Server"**
3. Right-click lại → **"Connect Server"**
4. Nhập password nếu cần
5. Navigate lại vào Tables và refresh

**Hoặc restart pgAdmin:**
1. Đóng pgAdmin hoàn toàn
2. Mở lại từ Start Menu
3. Kết nối lại server

---

### 📌 CASE 2: Bạn muốn dùng pgAdmin trong Docker

#### Bước 1: Start pgAdmin Container

**Vì pgAdmin container chưa được start**, cần restart Docker:

```bash
# Option 1: Restart toàn bộ (recommended)
cd D:\D\User\CODENODEJS\test\persional_finane_MW
docker-compose down
docker-compose up -d

# Option 2: Chỉ start pgAdmin
docker-compose up -d pgadmin
```

#### Bước 2: Verify pgAdmin Container Running

```bash
docker-compose ps
```

Phải thấy:
```
pfm_pgadmin   dpage/pgadmin4   Up   0.0.0.0:5050->80/tcp
```

#### Bước 3: Truy cập pgAdmin

1. Mở browser: **http://localhost:5050**
2. Đăng nhập:
   - Email: `admin@admin.com`
   - Password: `admin`

#### Bước 4: Thêm Server Connection (Lần đầu)

**Click "Add New Server":**

**General tab:**
```
Name: Personal Finance DB
```

**Connection tab:**
```
Host: db                          ← Dùng "db", KHÔNG phải "localhost"
Port: 5432
Maintenance database: finance_db
Username: finance_user
Password: super-secure-password-123
Save password: ✅ Check
```

**⚠️ Quan trọng**: Host = `db` (service name), vì containers communicate qua Docker network

#### Bước 5: Navigate và Refresh

**Navigate to tables:**
```
Servers
└── Personal Finance DB
    └── Databases
        └── finance_db
            └── Schemas
                └── public
                    └── Tables
```

**Refresh để thấy data:**
1. Right-click vào `Tables` → Refresh
2. Right-click vào table cụ thể (VD: `Transaction`) → `View/Edit Data` → `All Rows`
3. Nếu cần update: Click icon Refresh hoặc F5

---

## Bước 3: Test với Data Mới Nhất

### Verify Users

```sql
-- Query Tool
SELECT id, email, name, "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;
```

**Kết quả mong đợi:**
```
tam8@gmail.com   | 2025-11-09
tam4@gmail.com   | 2025-11-08
test@example.com | 2025-11-08
demo@example.com | 2025-11-08
```

### Verify Transactions

```sql
SELECT id, description, amount, "occurredAt", "createdAt"
FROM "Transaction"
ORDER BY "createdAt" DESC
LIMIT 5;
```

**Kết quả mong đợi:**
```
description | amount  | occurredAt
------------|---------|------------
9           | 100.00  | 2025-11-09
8           | 1000.00 | 2025-11-09
7           | 100.00  | 2025-11-08
...
```

### Verify Categories

```sql
SELECT id, name, type, color
FROM "Category"
ORDER BY name;
```

**Kết quả mong đợi:** 7 categories

---

## Common Issues & Solutions

### ❌ Issue: "Server not found" hoặc "Could not connect"

**Nếu dùng pgAdmin Local:**
- ✅ Host = `localhost` hoặc `127.0.0.1`
- ❌ Không dùng `db`

**Nếu dùng pgAdmin Docker:**
- ✅ Host = `db`
- ❌ Không dùng `localhost`
- Verify container running: `docker-compose ps | grep pgadmin`

### ❌ Issue: Tables empty hoặc không thấy rows

**Nguyên nhân:** View đang cache

**Giải pháp:**
1. Close tab "View/Edit Data"
2. Right-click table → Refresh (F5)
3. Right-click table → `View/Edit Data` → `All Rows`
4. Data sẽ xuất hiện

### ❌ Issue: Thấy tables nhưng không thấy data

**Kiểm tra đang xem đúng database không:**
```
Are you viewing: finance_db > public > Tables?
```

**Chạy query thủ công:**
```sql
-- Kiểm tra có data không
SELECT COUNT(*) FROM "Transaction";  -- Phải là 10
SELECT COUNT(*) FROM "User";         -- Phải là 4
SELECT COUNT(*) FROM "Category";     -- Phải là 7
```

### ❌ Issue: Password authentication failed

**Kiểm tra password:**
- Từ file `.env` trong project root
- Default: `super-secure-password-123`
- Username: `finance_user`

**Reset password:**
```bash
# Vào database container
docker-compose exec db psql -U postgres

# Trong psql:
ALTER USER finance_user WITH PASSWORD 'super-secure-password-123';
\q
```

---

## Quick Reference: Refresh Methods

### Method 1: Refresh Browser Tree
```
Right-click "Tables" → Refresh (hoặc F5)
```

### Method 2: Refresh Data View
```
Trong View/Edit Data tab → Click icon Refresh
```

### Method 3: Close & Reopen
```
Close tab → Right-click table → View/Edit Data → All Rows
```

### Method 4: Run Query
```
Tools → Query Tool → SELECT * FROM "TableName"; → Execute (F5)
```

### Method 5: Reconnect Server
```
Right-click server → Disconnect → Right-click → Connect
```

---

## Auto-Sync Verification

Database auto-sync to JSON đang hoạt động:

```bash
# Check JSON file
cat Feature/AI_Chatbot/database/database.json

# Should contain latest data matching database
```

**⚠️ Lưu ý:**
- `database.json` sync TỰ ĐỘNG qua Prisma middleware
- pgAdmin cần REFRESH THỦ CÔNG

---

## Test Create New Transaction

Để test refresh, tạo transaction mới qua API:

```bash
# Từ backend folder
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 999.99,
    "currency": "USD",
    "description": "TEST from pgAdmin guide",
    "occurredAt": "2025-11-09T15:30:00.000Z"
  }'
```

**Sau đó trong pgAdmin:**
1. Navigate to Transaction table
2. Right-click → Refresh (F5)
3. Right-click → View/Edit Data → All Rows
4. Phải thấy transaction mới với description "TEST from pgAdmin guide"

---

## Checklist

- [ ] Xác định đang dùng pgAdmin local hay Docker
- [ ] Kiểm tra connection settings (Host = `localhost` hoặc `db`)
- [ ] Connect thành công đến server
- [ ] Navigate đến finance_db > public > Tables
- [ ] Refresh tables (F5)
- [ ] View data trong table
- [ ] Nếu không thấy: Close tab và mở lại
- [ ] Run query thủ công để verify
- [ ] Test tạo data mới và refresh

---

**Nếu làm theo hướng dẫn này mà vẫn không thấy data, vui lòng cung cấp:**
1. Screenshot pgAdmin showing connection settings
2. Screenshot của Tables view
3. Output của query: `SELECT COUNT(*) FROM "Transaction";`
4. Đang dùng pgAdmin local hay Docker?
