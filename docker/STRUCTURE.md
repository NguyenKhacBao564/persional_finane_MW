# Docker Folder Structure

## Tổ chức file Docker

Tất cả các file liên quan đến Docker đã được tổ chức vào folder `docker/`:

```
docker/
├── backend/
│   └── Dockerfile              # Backend container config
├── frontend/
│   └── Dockerfile              # Frontend container config
├── pgadmin/
│   └── (reserved for future config)
├── scripts/
│   ├── docker-start.bat        # Windows: Start all services
│   ├── docker-stop.bat         # Windows: Stop all services
│   ├── docker-logs.bat         # Windows: View logs
│   └── docker-seed.bat         # Windows: Seed database
├── docker-compose.yml          # Main orchestration file
├── DOCKER_GUIDE.md             # Chi tiết đầy đủ
├── DOCKER_QUICKSTART.md        # Quick start guide
├── README.md                   # Hướng dẫn folder này
└── STRUCTURE.md                # File này - giải thích cấu trúc
```

## Services trong Docker Compose

### 1. db (PostgreSQL)
- **Image**: `postgres:15-alpine`
- **Port**: 5432
- **Volume**: `db_data` (persistent)
- **Network**: `pfm_network`

### 2. pgadmin (Database GUI)
- **Image**: `dpage/pgadmin4:latest`
- **Port**: 5050
- **Volume**: `pgadmin_data` (persistent - saves connections)
- **Network**: `pfm_network`
- **Access**: http://localhost:5050

### 3. backend (Express API)
- **Build**: `./backend` với Dockerfile từ `docker/backend/Dockerfile`
- **Port**: 4000
- **Volumes**:
  - `./backend:/app` (live reload)
  - `./Feature:/Feature` (database.json sync)
- **Network**: `pfm_network`
- **Depends on**: db

### 4. frontend (React + Vite)
- **Build**: `./frontend` với Dockerfile từ `docker/frontend/Dockerfile`
- **Port**: 5173
- **Volume**: `./frontend:/app` (live reload)
- **Network**: `pfm_network`
- **Depends on**: backend

## Docker Network

Tất cả services kết nối qua network: **`pfm_network`**

**Inter-container communication:**
- Backend → Database: `postgresql://finance_user:password@db:5432/finance_db`
- pgAdmin → Database: Host = `db` (service name)
- Frontend → Backend: `http://backend:4000` (internal) hoặc `http://localhost:4000` (from browser)

**External access (from host machine):**
- Database: `localhost:5432`
- pgAdmin: `localhost:5050`
- Backend: `localhost:4000`
- Frontend: `localhost:5173`

## Docker Volumes

### Persistent volumes (data survives `docker-compose down`)

1. **db_data**
   - Lưu PostgreSQL data files
   - Location: Docker managed volume
   - Backup: `docker volume inspect persional_finane_mw_db_data`

2. **pgadmin_data**
   - Lưu pgAdmin settings, saved servers, queries
   - Location: Docker managed volume
   - Reset để xóa saved connections: `docker volume rm persional_finane_mw_pgadmin_data`

### Bind mounts (sync với host filesystem)

1. `./backend:/app`
   - Backend source code
   - Changes sync immediately (hot reload)

2. `./frontend:/app`
   - Frontend source code
   - Changes sync immediately (hot reload)

3. `./Feature:/Feature`
   - AI Chatbot database.json
   - Auto-synced từ Prisma middleware

4. `/app/node_modules` (anonymous volume)
   - Prevents host node_modules from overriding container's
   - Each service has its own isolated node_modules

## Path References trong docker-compose.yml

```yaml
backend:
  build:
    context: ./backend           # Build context: backend folder
    dockerfile: ../docker/backend/Dockerfile  # Dockerfile location
  volumes:
    - ./backend:/app             # Bind mount: backend code

frontend:
  build:
    context: ./frontend          # Build context: frontend folder
    dockerfile: ../docker/frontend/Dockerfile # Dockerfile location
  volumes:
    - ./frontend:/app            # Bind mount: frontend code
```

**Lưu ý:**
- `context`: Thư mục chứa source code để build
- `dockerfile`: Đường dẫn tương đối từ context đến Dockerfile

## Environment Variables

Defined in `.env` file (project root):

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

# Frontend
FRONTEND_PORT=5173
```

## Dockerfile Details

### backend/Dockerfile → docker/backend/Dockerfile

```dockerfile
FROM node:20-slim
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
```

**Features:**
- ✅ Installs OpenSSL for Prisma
- ✅ Layer caching for dependencies
- ✅ Generates Prisma Client
- ✅ Auto-runs migrations on startup
- ✅ Hot reload in development

### frontend/Dockerfile → docker/frontend/Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

**Features:**
- ✅ Lightweight Alpine image
- ✅ Layer caching for dependencies
- ✅ Binds to 0.0.0.0 (accessible from host)
- ✅ Hot reload in development

## Build Process Flow

### Initial Build

```
1. docker-compose up --build
2. Docker reads docker-compose.yml
3. For each service:
   a. Pull base image (postgres, node, etc.)
   b. Build custom images (backend, frontend)
   c. Create volumes (db_data, pgadmin_data)
   d. Create network (pfm_network)
   e. Start containers in dependency order:
      - db first
      - pgadmin (depends on db)
      - backend (depends on db)
      - frontend (depends on backend)
```

### Rebuild

```bash
# Full rebuild (after Dockerfile changes)
docker-compose up --build

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend
```

## Migration Strategy

### Từ setup cũ (Docker files scattered)

**Trước:**
```
project/
├── backend/
│   └── Dockerfile
├── frontend/
│   └── Dockerfile
├── docker-compose.yml
├── docker-start.bat
├── docker-stop.bat
└── ...
```

**Sau:**
```
project/
├── docker/                     # ← Tất cả Docker files
│   ├── backend/Dockerfile
│   ├── frontend/Dockerfile
│   ├── docker-compose.yml
│   ├── scripts/*.bat
│   └── docs (*.md)
├── backend/                    # Source code only
├── frontend/                   # Source code only
└── docker-compose.yml          # Symlink hoặc copy từ docker/
```

### Backwards Compatibility

Để maintain backwards compatibility:

1. **Option 1**: Keep `docker-compose.yml` in project root
   - Easy for existing workflows
   - Just point Dockerfiles to `docker/` folder

2. **Option 2**: Symlink
   ```bash
   # Windows (requires admin)
   mklink docker-compose.yml docker\docker-compose.yml
   ```

3. **Option 3**: Use docker-compose -f
   ```bash
   docker-compose -f docker/docker-compose.yml up
   ```

## Best Practices

### Development

1. **Always run from project root**
   ```bash
   # ✅ Correct
   docker-compose up

   # ❌ Wrong
   cd docker && docker-compose up
   ```

2. **Use scripts for convenience**
   ```bash
   docker-start.bat      # Start everything
   docker-logs.bat       # Monitor logs
   docker-stop.bat       # Stop everything
   ```

3. **Hot reload is enabled**
   - Sửa code trong backend/frontend
   - Changes auto-reflect, không cần rebuild

### Production

1. **Update environment variables**
   ```env
   NODE_ENV=production
   JWT_SECRET=<strong-random-value>
   POSTGRES_PASSWORD=<strong-password>
   ```

2. **Use production Dockerfiles**
   - Multi-stage builds
   - Smaller images
   - No dev dependencies

3. **Disable pgAdmin**
   ```bash
   # Comment out pgAdmin service in docker-compose.yml
   # Or use docker-compose.prod.yml
   ```

## Troubleshooting

### Common Issues

**Q: Làm sao biết containers đang chạy?**
```bash
docker-compose ps
```

**Q: View logs của service cụ thể?**
```bash
docker-compose logs -f backend
docker-compose logs -f pgadmin
```

**Q: Restart một service?**
```bash
docker-compose restart backend
```

**Q: Rebuild sau khi sửa Dockerfile?**
```bash
docker-compose up --build
```

**Q: Clean everything và start fresh?**
```bash
docker-compose down -v           # Stop và xóa volumes
docker-compose up --build -d      # Rebuild và start
```

## References

- **Main docs**: `docker/README.md`
- **Full guide**: `docker/DOCKER_GUIDE.md`
- **Quick start**: `docker/DOCKER_QUICKSTART.md`
- **pgAdmin docs**: See `docker/README.md` section "Sử dụng pgAdmin"

---

**Last updated**: 2025-11-09
