# 🚀 Quick Start - Prisma + PostgreSQL

## Bước 1: Cài đặt dependencies

```bash
cd SnapPDF_Backend
npm install
```

## Bước 2: Setup PostgreSQL

### Option A: Docker (Khuyến nghị - Dễ nhất)

```bash
docker run -d \
  --name snappdf-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=SnapPDF \
  -p 5432:5432 \
  postgres:15-alpine
```

### Option B: Local PostgreSQL

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15
createdb SnapPDF

# Ubuntu/Debian
sudo apt install postgresql
sudo systemctl start postgresql
sudo -u postgres createdb SnapPDF
```

## Bước 3: Configure .env

File `.env` đã được tạo với:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/SnapPDF"
```

⚠️ **Quan trọng:** Thay đổi `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET`!

## Bước 4: Generate Prisma Client & Run Migration

```bash
# Generate Prisma Client
npx prisma generate

# Run migration (tạo tables trong database)
npx prisma migrate dev --name init
```

Lệnh này sẽ:
- ✅ Tạo table `users` trong PostgreSQL
- ✅ Generate Prisma Client
- ✅ Lưu migration history

## Bước 5: Start Redis

```bash
# macOS
brew services start redis

# Ubuntu/Debian  
sudo systemctl start redis

# Docker
docker run -d --name redis -p 6379:6379 redis:alpine
```

## Bước 6: Start Server

```bash
npm run dev
```

Expected output:

```
🗄️  Connecting to PostgreSQL...
✅ PostgreSQL connected successfully
📦 Connecting to Redis...
✅ Redis connected successfully

✅ Server started successfully!

═══════════════════════════════════════════════════
📍 Server running at: http://0.0.0.0:3000
🌍 Environment: development
🗄️  PostgreSQL: Connected
📦 Redis: Connected
═══════════════════════════════════════════════════

📚 API Endpoints:
   GET  /api/auth/google        - Get Google auth URL
   POST /api/auth/google/login  - Login with Google
   GET  /api/user/profile       - Get user profile [Protected]
   POST /api/auth/logout        - Logout [Protected]

✨ Ready to accept requests!
```

## Bước 7: Test API

### 1. Health check

```bash
curl http://localhost:3000/api/health
```

### 2. Login flow

Mở Frontend và test login với Google.

### 3. Check database với Prisma Studio

```bash
npx prisma studio
```

Mở browser: `http://localhost:5555`

## ✅ Checklist

- [ ] PostgreSQL đang chạy (port 5432)
- [ ] Redis đang chạy (port 6379)
- [ ] `.env` đã configure đúng
- [ ] `npx prisma generate` đã chạy
- [ ] `npx prisma migrate dev` đã chạy
- [ ] Server start thành công (port 3000)
- [ ] Google OAuth credentials đã config

## 🐛 Troubleshooting

### Error: "Can't reach database server"

```bash
# Check PostgreSQL
docker ps | grep postgres
# hoặc
brew services list | grep postgresql
```

### Error: "Database does not exist"

```bash
# Docker
docker exec -it snappdf-postgres psql -U postgres -c "CREATE DATABASE \"SnapPDF\";"

# Local
createdb SnapPDF
```

### Error: "Prisma Client not generated"

```bash
npx prisma generate
```

### Error: "Redis connection failed"

```bash
# Start Redis
brew services start redis
# hoặc
docker start redis
```

## 📊 Verify Everything Works

```bash
# 1. Check PostgreSQL
docker exec -it snappdf-postgres psql -U postgres -d SnapPDF -c "\dt"
# Should show "users" table

# 2. Check Redis
redis-cli ping
# Should return "PONG"

# 3. Check API
curl http://localhost:3000/api/health
# Should return success

# 4. Login & Check Database
# - Login qua Frontend
# - Check Prisma Studio để thấy user mới
npx prisma studio
```

## 🎉 Done!

Backend đã sẵn sàng với:
- ✅ PostgreSQL + Prisma
- ✅ Redis
- ✅ Google OAuth
- ✅ User management

Next: Start Frontend và test login flow!

```bash
cd ../SnapPDF_Frontend
npm install
npm run dev
```

