# 🐳 Docker Quick Start

## 🚀 Cách chạy nhanh nhất (3 bước)

### 1️⃣ Khởi động Docker
```bash
# Windows - Double click file:
docker-start.bat

# Hoặc command line:
docker-compose up --build -d
```

### 2️⃣ Đợi 2-3 phút
Docker sẽ:
- ✅ Tải images (node, postgres)
- ✅ Build backend + frontend
- ✅ Chạy migrations
- ✅ Khởi động 3 services

### 3️⃣ Seed dữ liệu mẫu
```bash
# Windows:
docker-seed.bat

# Hoặc:
docker-compose exec backend npm run db:seed
```

---

## 🌐 Truy cập ứng dụng

| Service   | URL                        | Mô tả                      |
|-----------|----------------------------|----------------------------|
| Frontend  | http://localhost:5173      | React app                  |
| Backend   | http://localhost:4000      | API server                 |
| Prisma    | http://localhost:5555      | Database GUI               |

### Demo Login
- Email: `demo@example.com`
- Password: `password123`

---

## 🛑 Dừng & Quản lý

```bash
# Xem logs
docker-logs.bat

# Dừng services
docker-stop.bat

# Restart
docker-compose restart

# Xóa hết và làm lại
docker-compose down -v
docker-start.bat
```

---

## 🔧 Troubleshooting

### Port đã được sử dụng?
Edit `.env` file:
```env
POSTGRES_PORT=5433  # Thay vì 5432
BACKEND_PORT=4001   # Thay vì 4000
FRONTEND_PORT=5174  # Thay vì 5173
```

### Backend không chạy?
```bash
# Xem logs
docker-compose logs backend

# Chạy lại migrations
docker-compose exec backend npx prisma migrate deploy
```

### Mất hết data?
Docker volumes bị xóa khi dùng `docker-compose down -v`.

Khôi phục:
```bash
docker-start.bat
docker-seed.bat
```

---

## 📚 Chi tiết đầy đủ

Xem file `DOCKER_GUIDE.md` để biết thêm:
- Database management
- Production deployment
- Advanced configurations

---

**Enjoy! 🎉**
