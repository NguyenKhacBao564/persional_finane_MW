# Docker Configuration & Setup

Folder này chứa tất cả các file cấu hình Docker cho Personal Finance Manager project.

## Cấu trúc folder

```
docker/
├── backend/           # Backend Dockerfile
│   └── Dockerfile
├── frontend/          # Frontend Dockerfile
│   └── Dockerfile
├── pgadmin/           # pgAdmin configuration (reserved)
├── scripts/           # Docker utility scripts
│   ├── docker-start.bat
│   ├── docker-stop.bat
│   ├── docker-logs.bat
│   └── docker-seed.bat
├── docker-compose.yml      # Main orchestration file
├── DOCKER_GUIDE.md         # Chi tiết hướng dẫn
└── DOCKER_QUICKSTART.md    # Quick start guide
```

## Services

Project sử dụng 4 Docker containers:

| Service   | Port | Mô tả                          | URL                        |
|-----------|------|--------------------------------|----------------------------|
| **db**        | 5432 | PostgreSQL 15 database         | postgresql://localhost:5432|
| **pgadmin**   | 5050 | pgAdmin 4 (Web-based DB GUI)   | http://localhost:5050      |
| **backend**   | 4000 | Express API + Prisma           | http://localhost:4000      |
| **frontend**  | 5173 | React + Vite app               | http://localhost:5173      |

## Quick Start

### 1. Chuẩn bị

Từ **project root** (không phải folder docker):

```bash
# Copy environment file
copy .env.docker .env

# Chỉnh sửa .env nếu cần (đặc biệt là PGADMIN_EMAIL và PGADMIN_PASSWORD)
```

### 2. Khởi động tất cả services

```bash
# Option 1: Dùng script (Windows)
docker-start.bat

# Option 2: Manual command
docker-compose up --build -d
```

### 3. Truy cập services

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **pgAdmin**: http://localhost:5050

## Sử dụng pgAdmin

### Đăng nhập pgAdmin

1. Truy cập: **http://localhost:5050**
2. Đăng nhập với credentials từ file `.env`:
   - **Email**: `admin@admin.com` (hoặc giá trị `PGADMIN_EMAIL`)
   - **Password**: `admin` (hoặc giá trị `PGADMIN_PASSWORD`)

### Kết nối đến PostgreSQL Database

**Lần đầu tiên sử dụng**, bạn cần thêm server connection:

1. Click **"Add New Server"** hoặc `Object > Register > Server`

2. Tab **General**:
   - **Name**: `Personal Finance DB` (tên tùy ý)

3. Tab **Connection**:
   - **Host**: `db` ⚠️ (tên service trong docker-compose, KHÔNG phải localhost)
   - **Port**: `5432`
   - **Maintenance database**: `finance_db` (từ `POSTGRES_DB`)
   - **Username**: `finance_user` (từ `POSTGRES_USER`)
   - **Password**: `super-secure-password-123` (từ `POSTGRES_PASSWORD`)
   - ✅ Tick **"Save password"**

4. Click **Save**

### Xem và quản lý database

Sau khi kết nối thành công:

```
Servers
└── Personal Finance DB
    └── Databases
        └── finance_db
            └── Schemas
                └── public
                    └── Tables
                        ├── User
                        ├── Transaction
                        ├── Category
                        ├── Budget
                        ├── Goal
                        └── AIInsight
```

**Các thao tác thông dụng:**

- **Xem data**: Right-click table → `View/Edit Data` → `All Rows`
- **Chạy query**: Click `Tools` → `Query Tool`
- **Refresh**: Right-click table → `Refresh` (F5)
- **Export**: Right-click table → `Backup...`

### Tại sao pgAdmin không tự động cập nhật?

pgAdmin là **web-based GUI client**, nó **KHÔNG tự động refresh** data. Bạn cần:

1. **Manual refresh**: Click vào table → nhấn **F5** hoặc click icon Refresh
2. **Re-query**: Chạy lại query trong Query Tool để thấy data mới nhất
3. **Auto-refresh không có sẵn**: pgAdmin yêu cầu manual refresh để tránh tốn tài nguyên

**Giải pháp để thấy real-time updates:**

- Sau khi tạo/update/delete data qua API hoặc backend
- Vào pgAdmin → Click table → **Right-click → Refresh** (hoặc F5)
- Hoặc chạy lại `SELECT * FROM "TableName"`

## Commands

### Khởi động & Dừng

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart backend
```

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f pgadmin
```

### Database Operations

```bash
# Seed database with sample data
docker-compose exec backend npm run db:seed

# Run Prisma migrations
docker-compose exec backend npx prisma migrate deploy

# Open Prisma Studio (alternative to pgAdmin)
docker-compose exec backend npx prisma studio
```

### Rebuild & Clean

```bash
# Rebuild containers after Dockerfile changes
docker-compose up --build

# Remove all containers and volumes (⚠️ deletes data)
docker-compose down -v

# Remove unused images
docker image prune -a
```

## Troubleshooting

### pgAdmin không kết nối được database

**Lỗi**: `could not connect to server`

**Nguyên nhân**: Dùng `localhost` thay vì `db` trong connection settings

**Giải pháp**:
- Trong pgAdmin connection, **Host** phải là `db` (tên service trong docker-compose)
- KHÔNG dùng `localhost` hoặc `127.0.0.1`
- Containers communicate qua **internal Docker network** (`pfm_network`)

### Database bị trống sau khi start

```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed sample data
docker-compose exec backend npm run db:seed
```

### Port conflicts

Nếu port đã được sử dụng, edit file `.env`:

```env
POSTGRES_PORT=5433     # Thay vì 5432
PGADMIN_PORT=5051      # Thay vì 5050
BACKEND_PORT=4001      # Thay vì 4000
FRONTEND_PORT=5174     # Thay vì 5173
```

### Reset toàn bộ

```bash
# Stop and remove everything
docker-compose down -v

# Remove the .env file
del .env  # Windows
rm .env   # Linux/Mac

# Start fresh
copy .env.docker .env
docker-compose up --build -d
```

## Environment Variables

Tất cả environment variables được định nghĩa trong `.env`:

```env
# Database
POSTGRES_USER=finance_user
POSTGRES_PASSWORD=super-secure-password-123
POSTGRES_DB=finance_db
POSTGRES_PORT=5432

# pgAdmin
PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=admin
PGADMIN_PORT=5050

# Backend
BACKEND_PORT=4000
JWT_SECRET=your-jwt-secret
...
```

## Network

Tất cả services kết nối qua Docker network: **`pfm_network`**

- Services communicate bằng **service name** (db, backend, frontend)
- External access qua **localhost:port**

```yaml
networks:
  pfm_network:
    driver: bridge
```

## Data Persistence

Data được lưu trong Docker volumes:

- `db_data` - PostgreSQL data
- `pgadmin_data` - pgAdmin settings và saved connections

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect persional_finane_mw_db_data
```

## 📚 Tài liệu chi tiết

- **DOCKER_GUIDE.md** - Hướng dẫn chi tiết đầy đủ
- **DOCKER_QUICKSTART.md** - Quick start guide
- **docker-compose.yml** - Service orchestration config

---

**Lưu ý**: Tất cả Docker commands phải chạy từ **project root** (thư mục chứa docker-compose.yml), KHÔNG phải trong folder `docker/`
