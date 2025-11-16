# 🗄️ Database Setup - Remote PostgreSQL

## ⚠️ QUAN TRỌNG: Update DATABASE_URL

### Bước 1: Update `.env` file

```bash
# SnapPDF_Backend/.env

DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE"
```

**Thay thế:**
- `USERNAME`: PostgreSQL username
- `PASSWORD`: PostgreSQL password  
- `HOST`: Database host (ví dụ: abc.supabase.co)
- `PORT`: Database port (thường là 5432)
- `DATABASE`: Database name (ví dụ: SnapPDF)

**Ví dụ:**
```env
DATABASE_URL="postgresql://postgres:mypassword@db.supabase.co:5432/SnapPDF"
```

### Bước 2: Verify Connection

```bash
# Test connection
npx prisma db pull
```

Nếu thành công → Prisma sẽ pull schema từ database.

## 📊 Nếu Database ĐÃ CÓ tables (user, file)

### Option A: Pull Schema từ Database

```bash
# 1. Pull schema từ remote database
npx prisma db pull

# 2. Generate Prisma Client
npx prisma generate

# 3. Done! Có thể start server
npm run dev
```

**Lưu ý:** Lệnh `prisma db pull` sẽ:
- ✅ Đọc schema từ database hiện tại
- ✅ Update file `prisma/schema.prisma`
- ✅ Preserve schema bạn đã có

### Option B: Push Schema lên Database (nếu DB rỗng)

```bash
# 1. Push schema lên database
npx prisma db push

# 2. Generate Prisma Client
npx prisma generate

# 3. Done! Có thể start server
npm run dev
```

## 🧪 Verify Setup

### 1. Check Connection

```bash
npx prisma db pull
```

**Expected:** `✔ Introspected 2 models and wrote them into prisma/schema.prisma`

### 2. Open Prisma Studio

```bash
npx prisma studio
```

Mở browser: `http://localhost:5555`

Bạn sẽ thấy tables: `user` và `file`

### 3. Check Tables

```bash
# Với psql
psql "postgresql://username:password@host:port/database" -c "\dt"

# Hoặc trong Prisma Studio
```

Expected tables:
- ✅ `user`
- ✅ `file`

### 4. Start Server

```bash
npm run dev
```

Expected console output:

```
🗄️  Connecting to PostgreSQL...
✅ PostgreSQL connected successfully
📦 Connecting to Redis...
✅ Redis connected successfully

✅ Server started successfully!
```

## 🔍 Troubleshooting

### Error: "Can't reach database server"

**Nguyên nhân:** DATABASE_URL sai hoặc network issue

**Giải pháp:**
1. Check DATABASE_URL format
2. Verify network connection
3. Check firewall/security groups

```bash
# Test connection với psql
psql "postgresql://username:password@host:port/database"
```

### Error: "Authentication failed"

**Nguyên nhân:** Username/password sai

**Giải pháp:**
1. Verify credentials
2. Check password có special characters → encode URL:
   - `@` → `%40`
   - `#` → `%23`
   - `:` → `%3A`

```env
# Example với special characters
DATABASE_URL="postgresql://user:p%40ssw%23rd@host:5432/db"
```

### Error: "Database does not exist"

**Nguyên nhân:** Database chưa được tạo

**Giải pháp:**
```sql
-- Connect to postgres database
psql "postgresql://username:password@host:5432/postgres"

-- Create database
CREATE DATABASE "SnapPDF";

-- Exit
\q
```

### Error: "SSL connection required"

**Nguyên nhân:** Remote database yêu cầu SSL

**Giải pháp:**
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

## 📝 Database Schema

### Expected Tables:

**user:**
```sql
CREATE TABLE user (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  avatar VARCHAR,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**file:**
```sql
CREATE TABLE file (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  link_s3 VARCHAR NOT NULL,
  content VARCHAR NOT NULL,
  "createAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## 🚀 Quick Commands

```bash
# View schema
npx prisma studio

# Pull latest schema from DB
npx prisma db pull

# Generate client after schema changes
npx prisma generate

# Push schema to DB (nếu DB rỗng)
npx prisma db push

# Reset database (⚠️ XÓA HẾT DATA)
npx prisma migrate reset
```

## ✅ Final Checklist

Before starting server:

- [ ] `.env` có DATABASE_URL đúng
- [ ] Database connection successful (`npx prisma db pull`)
- [ ] Prisma Client generated (`npx prisma generate`)
- [ ] Tables tồn tại: `user`, `file`
- [ ] Redis đang chạy
- [ ] Google OAuth credentials configured

## 🎯 Test Login Flow

```
1. Start backend:
   npm run dev

2. Start frontend:
   cd ../SnapPDF_Frontend
   npm run dev

3. Login với Google

4. Check Prisma Studio:
   npx prisma studio
   → Should see new user in "user" table

5. Check console logs:
   ✨ New user, creating...
   ✅ User created: user@example.com
```

---

**Remote Database:** ✅ Supported  
**Local Database:** ✅ Supported  
**SSL:** ✅ Supported

