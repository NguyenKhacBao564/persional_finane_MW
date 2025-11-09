# 🐳 Docker Setup Guide

## Prerequisites

1. **Install Docker Desktop:**
   - Windows: https://www.docker.com/products/docker-desktop/
   - Ensure Docker is running (check system tray icon)

2. **Verify installation:**
   ```bash
   docker --version
   docker-compose --version
   ```

---

## 🚀 Quick Start (Recommended)

### Method 1: Using Scripts (Windows)

1. **Start all services:**
   ```bash
   docker-start.bat
   ```

2. **Seed database with sample data:**
   ```bash
   docker-seed.bat
   ```

3. **View logs:**
   ```bash
   docker-logs.bat
   ```

4. **Stop services:**
   ```bash
   docker-stop.bat
   ```

### Method 2: Manual Commands

1. **Create .env file:**
   ```bash
   copy .env.docker .env
   # Edit .env with your settings
   ```

2. **Start services:**
   ```bash
   docker-compose up --build -d
   ```

3. **Seed database:**
   ```bash
   docker-compose exec backend npm run db:seed
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f
   ```

5. **Stop services:**
   ```bash
   docker-compose down
   ```

---

## 📋 Services

Docker will start 3 services:

| Service   | Port | Description                    | URL                        |
|-----------|------|--------------------------------|----------------------------|
| Frontend  | 5173 | React + Vite app               | http://localhost:5173      |
| Backend   | 4000 | Express API + Prisma           | http://localhost:4000      |
| Database  | 5432 | PostgreSQL 15                  | postgresql://localhost:5432|

---

## 🔧 Configuration

### Environment Variables (.env)

Create `.env` file in project root:

```env
# PostgreSQL
POSTGRES_USER=finance_user
POSTGRES_PASSWORD=super-secure-password-123
POSTGRES_DB=finance_db
POSTGRES_PORT=5432

# Backend
BACKEND_PORT=4000
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173

# OpenAI (optional)
OPENAI_API_KEY=sk-your-key-here

# Frontend
FRONTEND_PORT=5173
VITE_API_URL=http://localhost:4000
```

**⚠️ Important:** Change default passwords in production!

---

## 📊 Database Management

### Access Database

**Option 1: Prisma Studio (Recommended)**
```bash
# Run Prisma Studio inside container
docker-compose exec backend npx prisma studio

# Access: http://localhost:5555
```

**Option 2: PostgreSQL Client**
```bash
# Connect to database
docker-compose exec db psql -U finance_user -d finance_db

# Or from host machine
psql -h localhost -p 5432 -U finance_user -d finance_db
```

### Seed Sample Data

```bash
# Windows
docker-seed.bat

# Or manually
docker-compose exec backend npm run db:seed
```

**Sample credentials:**
- Email: `demo@example.com`
- Password: `password123`

### Run Migrations

```bash
# Apply migrations
docker-compose exec backend npx prisma migrate deploy

# Create new migration
docker-compose exec backend npx prisma migrate dev --name <migration_name>

# Reset database (⚠️ DELETES ALL DATA)
docker-compose exec backend npx prisma migrate reset
```

### Sync to JSON (for AI Chatbot)

```bash
docker-compose exec backend npm run db:sync
```

---

## 🔍 Troubleshooting

### Port Already in Use

**Error:** `Bind for 0.0.0.0:5432 failed: port is already allocated`

**Solution:**
```bash
# Stop local PostgreSQL
# Windows: Services > PostgreSQL > Stop

# Or change port in .env
POSTGRES_PORT=5433
```

### Backend Won't Start

**Check logs:**
```bash
docker-compose logs backend
```

**Common issues:**
1. **Database not ready:** Wait 10 seconds after `docker-compose up`
2. **Missing migrations:** Run `docker-compose exec backend npx prisma migrate deploy`
3. **Node modules:** Rebuild `docker-compose up --build`

### Database Connection Failed

**Verify database is running:**
```bash
docker-compose ps
```

**Check connection:**
```bash
docker-compose exec backend npx prisma db pull
```

### Reset Everything

```bash
# Stop and remove containers + volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Start fresh
docker-compose up --build -d
docker-compose exec backend npm run db:seed
```

---

## 📝 Useful Commands

### Container Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart specific service
docker-compose restart backend

# View running containers
docker-compose ps

# View logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f db

# Execute command in container
docker-compose exec backend sh
docker-compose exec db psql -U finance_user -d finance_db
```

### Development

```bash
# Rebuild containers
docker-compose up --build

# Install new npm package
docker-compose exec backend npm install <package>
docker-compose exec frontend npm install <package>

# Run tests
docker-compose exec backend npm test

# Access backend shell
docker-compose exec backend sh
```

### Database Operations

```bash
# Backup database
docker-compose exec db pg_dump -U finance_user finance_db > backup.sql

# Restore database
docker-compose exec -T db psql -U finance_user finance_db < backup.sql

# View database size
docker-compose exec db psql -U finance_user -d finance_db -c "SELECT pg_size_pretty(pg_database_size('finance_db'));"
```

---

## 🎯 Production Deployment

### Build for Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production

Update `.env`:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-host:5432/finance_db
JWT_SECRET=<strong-random-secret>
OPENAI_API_KEY=<production-key>
```

### Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Set NODE_ENV=production
- [ ] Use HTTPS/SSL certificates
- [ ] Restrict database access
- [ ] Enable Docker logging
- [ ] Regular backups scheduled

---

## 🔄 Data Persistence

### Docker Volumes

Data is persisted in Docker volume `db_data`:

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect persional_finane_mw_db_data

# Backup volume
docker run --rm -v persional_finane_mw_db_data:/data -v $(pwd):/backup alpine tar czf /backup/db-backup.tar.gz /data

# Restore volume
docker run --rm -v persional_finane_mw_db_data:/data -v $(pwd):/backup alpine tar xzf /backup/db-backup.tar.gz -C /
```

### Data Locations

```
Docker Volumes:
└── db_data/
    └── PostgreSQL data (persisted even after docker-compose down)

Bind Mounts:
├── ./backend → /app (live reload)
├── ./frontend → /app (live reload)
└── Feature/AI_Chatbot/database/database.json (auto-synced)
```

---

## 🆚 Docker vs Local Development

| Feature              | Docker                          | Local                    |
|----------------------|---------------------------------|--------------------------|
| Setup time           | 5 minutes                       | 15-30 minutes            |
| Consistency          | ✅ Same on all machines         | ⚠️ May differ            |
| Database isolation   | ✅ Containerized                | ❌ Uses system DB        |
| Port conflicts       | ✅ Easy to change               | ⚠️ Manual resolution     |
| Data persistence     | ✅ Docker volumes               | ✅ Local PostgreSQL      |
| Performance          | ⚠️ Slightly slower (Windows)    | ✅ Native speed          |
| Cleanup              | ✅ `docker-compose down -v`     | ⚠️ Manual cleanup        |

---

## 🎓 Learning Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

## 🐛 Debug Mode

Enable debug logs:

```bash
# In docker-compose.yml, add to backend environment:
DEBUG: "*"
LOG_LEVEL: "debug"

# Or run with verbose logs
docker-compose up --verbose
```

---

## ✅ Health Checks

Check service health:

```bash
# Backend API
curl http://localhost:4000/health

# Database
docker-compose exec db pg_isready -U finance_user

# Frontend
curl http://localhost:5173
```

---

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify .env configuration
3. Ensure Docker Desktop is running
4. Try rebuilding: `docker-compose up --build`
5. Reset everything: `docker-compose down -v && docker-compose up --build`

---

**Happy Dockerizing! 🐳**
