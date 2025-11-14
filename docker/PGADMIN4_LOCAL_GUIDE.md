# Hướng dẫn sử dụng pgAdmin 4 Local với Docker Database

## ⚠️ Vấn đề: Host = "db" không hoạt động

**Nguyên nhân:**
- `db` là tên service TRONG Docker network
- pgAdmin 4 local chạy NGOÀI Docker (trên Windows)
- Phải dùng `localhost` để kết nối từ host machine

**Sơ đồ:**

```
┌─────────────────────────────────────────┐
│  Windows (Host Machine)                 │
│                                         │
│  ┌──────────────────┐                  │
│  │  pgAdmin 4       │                  │
│  │  (Local App)     │                  │
│  │                  │                  │
│  │  Host: localhost │──┐               │
│  └──────────────────┘  │               │
│                        │               │
│  ┌─────────────────────▼──────────────┐│
│  │  Docker Desktop                    ││
│  │                                    ││
│  │  ┌────────┐      ┌──────────┐    ││
│  │  │   db   │◄────►│ backend  │    ││
│  │  │ :5432  │      │          │    ││
│  │  └────────┘      └──────────┘    ││
│  │                                    ││
│  │  (Internal: host = "db")          ││
│  │  (External: host = "localhost")   ││
│  └────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

---

## 🛠️ Bước 1: Sửa Connection Settings

### Cách 1: Chỉnh sửa Server hiện tại

1. **Mở pgAdmin 4**
2. **Tìm server connection** trong Browser panel (bên trái)
   - Thường có tên như: "PostgreSQL 15", "finance_db", hoặc tên bạn đã đặt
3. **Right-click vào server** → chọn **"Properties"**
4. **Tab "Connection"**, sửa thành:

```
Host name/address: localhost     ← ĐỔI từ "db" về "localhost"
Port: 5432
Maintenance database: finance_db
Username: finance_user
Password: super-secure-password-123
Save password: ✅ Check
```

5. Click **"Save"**
6. **Disconnect server**: Right-click server → **"Disconnect Server"**
7. **Connect lại**: Right-click server → **"Connect Server"**
8. Nhập password nếu được hỏi

### Cách 2: Tạo Server mới (nếu Cách 1 không work)

1. **Xóa server cũ** (nếu cần):
   - Right-click server → **"Remove Server"**
   - Confirm "Yes"

2. **Click "Add New Server"** (hoặc Object → Register → Server)

3. **Tab "General":**
   ```
   Name: Personal Finance DB Local
   ```

4. **Tab "Connection":**
   ```
   Host name/address: localhost
   Port: 5432
   Maintenance database: finance_db
   Username: finance_user
   Password: super-secure-password-123
   Save password: ✅
   ```

5. **Tab "Advanced"** (optional):
   ```
   DB restriction: finance_db    (chỉ hiển thị finance_db)
   ```

6. Click **"Save"**

---

## ✅ Bước 2: Verify Kết nối

Sau khi save, bạn phải thấy:

```
Servers (1)
└── Personal Finance DB Local
    └── Databases (1)
        └── finance_db
            └── Schemas (1)
                └── public
                    └── Tables (6)
                        ├── User
                        ├── Transaction
                        ├── Category
                        ├── Budget
                        ├── Goal
                        └── AIInsight
```

**Nếu thấy lỗi "could not connect to server":**
- Kiểm tra Docker containers đang chạy: `docker-compose ps`
- Database container (pfm_db) phải đang Up
- Port 5432 không bị conflict

---

## 🔄 Bước 3: Refresh để thấy Data

### Method 1: Refresh Tables (Quick)

1. **Trong Browser panel**, navigate đến:
   ```
   Personal Finance DB Local > Databases > finance_db > Schemas > public > Tables
   ```

2. **Right-click vào "Tables"** → Click **"Refresh"** (hoặc nhấn **F5**)

3. **Right-click vào table cụ thể** (VD: `Transaction`)
   - Chọn **"View/Edit Data"** → **"All Rows"**

4. **Phải thấy data:**
   - Transaction table: 10 rows
   - User table: 4 rows
   - Category table: 7 rows

### Method 2: Refresh Data View

Nếu đang mở sẵn "View/Edit Data" tab:

1. **Click icon "Refresh"** trên toolbar (vòng tròn với mũi tên xoay)
2. Hoặc nhấn **F5** trong data grid
3. Data sẽ reload

### Method 3: Close & Reopen

1. **Đóng tab** "View/Edit Data"
2. **Right-click table** → **"View/Edit Data"** → **"All Rows"**
3. Tab mới sẽ fetch data từ database

### Method 4: Run Query (Most Reliable)

1. **Click "Tools"** menu → **"Query Tool"**
   - Hoặc right-click table → "Query Tool"

2. **Paste query:**
   ```sql
   -- Xem tất cả transactions
   SELECT * FROM "Transaction" ORDER BY "createdAt" DESC;

   -- Xem tất cả users
   SELECT * FROM "User" ORDER BY "createdAt" DESC;

   -- Xem tất cả categories
   SELECT * FROM "Category" ORDER BY name;
   ```

3. **Click "Execute/Run"** (icon ▶ hoặc nhấn **F5**)

4. **Kết quả phải hiển thị:**
   - Transaction: 10 rows (mới nhất: amount 100.00, occurredAt 2025-11-09)
   - User: 4 rows (mới nhất: tam8@gmail.com)
   - Category: 7 rows

---

## 📊 Bước 4: Kiểm tra Data Cụ thể

### Verify Recent Users

```sql
SELECT
    id,
    email,
    name,
    "createdAt"::date as created_date
FROM "User"
ORDER BY "createdAt" DESC;
```

**Expected output:**
```
email             | name      | created_date
------------------|-----------|-------------
tam8@gmail.com    | tam8      | 2025-11-09
tam4@gmail.com    | tam4      | 2025-11-08
test@example.com  | Test User | 2025-11-08
demo@example.com  | Demo User | 2025-11-08
```

### Verify Recent Transactions

```sql
SELECT
    id,
    description,
    amount,
    currency,
    "occurredAt"::date as occurred_date,
    "createdAt"::timestamp as created_at
FROM "Transaction"
ORDER BY "createdAt" DESC
LIMIT 5;
```

**Expected output:**
```
description | amount  | currency | occurred_date
------------|---------|----------|---------------
9           | 100.00  | USD      | 2025-11-09
8           | 1000.00 | USD      | 2025-11-09
7           | 100.00  | USD      | 2025-11-08
...
```

### Count Records

```sql
-- Đếm tổng số records mỗi table
SELECT
    'User' as table_name,
    COUNT(*) as total
FROM "User"
UNION ALL
SELECT
    'Transaction',
    COUNT(*)
FROM "Transaction"
UNION ALL
SELECT
    'Category',
    COUNT(*)
FROM "Category"
UNION ALL
SELECT
    'Budget',
    COUNT(*)
FROM "Budget"
UNION ALL
SELECT
    'Goal',
    COUNT(*)
FROM "Goal";
```

**Expected:**
```
table_name   | total
-------------|-------
User         | 4
Transaction  | 10
Category     | 7
Budget       | ?
Goal         | ?
```

---

## 🐛 Troubleshooting

### Issue 1: "could not connect to server: Connection refused"

**Nguyên nhân:** Database container không chạy

**Giải pháp:**
```bash
# Kiểm tra containers
docker-compose ps

# Nếu pfm_db không Up, start lại
docker-compose up -d db

# Chờ 5 giây cho DB ready
timeout 5

# Kết nối lại trong pgAdmin
```

### Issue 2: "password authentication failed"

**Nguyên nhân:** Password sai

**Giải pháp:**
1. Kiểm tra file `.env` trong project root:
   ```bash
   cat .env | grep POSTGRES_PASSWORD
   ```
2. Copy password chính xác
3. Trong pgAdmin: Right-click server → Properties → Connection → nhập lại password
4. Check "Save password"

### Issue 3: "FATAL: database 'finance_db' does not exist"

**Nguyên nhân:** Database chưa được tạo

**Giải pháp:**
```bash
# Run migrations để tạo database
docker-compose exec backend npx prisma migrate deploy

# Hoặc reset database
docker-compose exec backend npx prisma migrate reset
```

### Issue 4: Tables empty (0 rows) nhưng query có data

**Nguyên nhân:** pgAdmin cache

**Giải pháp:**
1. **Đóng tab** "View/Edit Data"
2. **Right-click "Tables"** → **Refresh** (F5)
3. **Right-click table** → **"View/Edit Data"** → **"All Rows"**
4. Nếu vẫn không work:
   - **Disconnect server**: Right-click server → Disconnect
   - **Connect lại**: Right-click server → Connect Server
   - Mở table lại

### Issue 5: Không thấy tables trong schema

**Nguyên nhân:** Đang xem sai schema hoặc database

**Giải pháp:**
1. Verify đang ở: `finance_db > Schemas > public > Tables`
2. **Right-click "Tables"** → **Refresh**
3. Nếu vẫn không thấy, check migration:
   ```bash
   docker-compose exec backend npx prisma migrate status
   ```

---

## 🔄 Workflow: Sau khi tạo/sửa data qua API

**Khi bạn tạo data mới qua backend API:**

1. Data được lưu vào PostgreSQL database ✅
2. Database auto-sync sang `database.json` ✅
3. **pgAdmin KHÔNG tự động refresh** ❌

**Để thấy data mới trong pgAdmin:**

```
Option A (Quick):
  Right-click table → Refresh (F5)
  → Right-click table → View/Edit Data → All Rows

Option B (Reliable):
  Tools → Query Tool
  → SELECT * FROM "Transaction" ORDER BY "createdAt" DESC;
  → Execute (F5)

Option C (Fresh view):
  Close tab
  → Right-click table → View/Edit Data → All Rows
```

---

## 📋 Quick Reference Card

### Connection Settings
```
Host: localhost         ← KHÔNG phải "db"
Port: 5432
Database: finance_db
Username: finance_user
Password: super-secure-password-123
```

### Refresh Shortcuts
- **F5** - Refresh current view
- **Ctrl+R** - Refresh (alternative)
- **Right-click → Refresh** - Explicit refresh

### Useful Queries
```sql
-- Count all records
SELECT COUNT(*) FROM "Transaction";

-- Latest transactions
SELECT * FROM "Transaction" ORDER BY "createdAt" DESC LIMIT 10;

-- Check database size
SELECT pg_size_pretty(pg_database_size('finance_db'));
```

---

## 🎯 Checklist - Làm theo thứ tự

- [ ] **Bước 1:** Mở pgAdmin 4
- [ ] **Bước 2:** Right-click server → Properties
- [ ] **Bước 3:** Connection tab → Host = `localhost` (ĐỔI từ "db")
- [ ] **Bước 4:** Save → Disconnect → Connect lại
- [ ] **Bước 5:** Navigate: finance_db > Schemas > public > Tables
- [ ] **Bước 6:** Right-click "Tables" → Refresh (F5)
- [ ] **Bước 7:** Right-click "Transaction" → View/Edit Data → All Rows
- [ ] **Bước 8:** Phải thấy 10 transactions
- [ ] **Bước 9:** Nếu không thấy: Tools → Query Tool → Run `SELECT * FROM "Transaction";`
- [ ] **Bước 10:** Nếu query thấy data nhưng View/Edit không thấy → Close tab và mở lại

---

## 💡 Pro Tips

### 1. Tự động refresh query
```sql
-- Trong Query Tool, bạn có thể re-run query bất cứ lúc nào
-- Nhấn F5 hoặc click icon Execute
SELECT * FROM "Transaction" ORDER BY "createdAt" DESC;
```

### 2. Filter data trong View/Edit
```
Click icon "Filter" trong toolbar
→ Nhập condition: amount > 100
→ Click OK
```

### 3. Export data
```
Right-click table → Backup...
→ Chọn Format: Plain
→ Chọn path và filename
→ Backup
```

### 4. View connection info
```
Right-click server → Dashboard
→ Xem connections, activity, database size
```

---

## 📞 Nếu vẫn không work

**Thu thập thông tin sau:**

1. **Test connection từ command line:**
   ```bash
   # Test từ host machine
   docker-compose exec db psql -U finance_user -d finance_db -c "SELECT COUNT(*) FROM \"Transaction\";"
   ```

2. **Screenshot pgAdmin:**
   - Connection settings (Properties → Connection tab)
   - Tables tree view
   - Query result khi chạy `SELECT * FROM "Transaction";`

3. **Docker status:**
   ```bash
   docker-compose ps
   ```

4. **Database logs:**
   ```bash
   docker-compose logs db | tail -50
   ```

Cung cấp thông tin này để tôi debug tiếp!

---

**Tóm lại: Host = `localhost`, KHÔNG phải `db`!**
