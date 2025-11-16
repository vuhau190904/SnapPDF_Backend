# 🗄️ Prisma + PostgreSQL Setup Guide

## 📋 Overview

Backend đã được upgrade từ file-based storage (users.json) sang **PostgreSQL** với **Prisma ORM**.

## 🚀 Quick Setup

### 1. **Cài đặt dependencies**

```bash
npm install
```

Dependencies đã thêm:
- `@prisma/client` - Prisma Client
- `prisma` (dev) - Prisma CLI

### 2. **Setup PostgreSQL**

#### Option A: Local PostgreSQL

```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database
createdb SnapPDF

# Or với psql
psql postgres
CREATE DATABASE "SnapPDF";
\q
```

#### Option B: Docker

```bash
docker run -d \
  --name snappdf-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=SnapPDF \
  -p 5432:5432 \
  postgres:15-alpine
```

### 3. **Configure DATABASE_URL**

File `.env` đã được update:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/SnapPDF"
```

**Format:** `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

### 4. **Run Prisma Migration**

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migration (tạo tables)
npm run prisma:migrate

# Hoặc dùng Prisma CLI trực tiếp
npx prisma migrate dev --name init
```

### 5. **Start Server**

```bash
npm run dev
```

## 📊 Database Schema

### User Model

```prisma
model User {
  id            String   @id @default(cuid())
  googleId      String   @unique
  email         String   @unique
  emailVerified Boolean  @default(false)
  name          String?
  picture       String?
  givenName     String?
  familyName    String?
  locale        String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLoginAt   DateTime @default(now())

  @@map("users")
}
```

### Fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key, auto-generated |
| `googleId` | String | Google user ID (unique) |
| `email` | String | User email (unique) |
| `emailVerified` | Boolean | Email verified status |
| `name` | String? | Full name |
| `picture` | String? | Avatar URL |
| `givenName` | String? | First name |
| `familyName` | String? | Last name |
| `locale` | String? | User locale (e.g., "en", "vi") |
| `createdAt` | DateTime | Account creation time |
| `updatedAt` | DateTime | Last update time |
| `lastLoginAt` | DateTime | Last login time |

## 🔧 Prisma Commands

```bash
# Generate Prisma Client (sau khi sửa schema)
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Open Prisma Studio (GUI để xem/edit database)
npm run prisma:studio

# Reset database (xóa hết data)
npx prisma migrate reset

# Push schema changes without migration
npx prisma db push

# Pull schema from existing database
npx prisma db pull
```

## 📁 File Structure

```
SnapPDF_Backend/
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Migration history (auto-generated)
├── src/
│   ├── database/
│   │   ├── redis.js           # Redis client
│   │   └── prisma.js          # Prisma client singleton
│   └── service/
│       └── userService.js     # User CRUD with Prisma
├── .env                        # DATABASE_URL
└── package.json
```

## 🔄 Migration từ File-based

Nếu bạn đã có data trong `data/users.json`, migrate bằng script:

```javascript
// migrate-users.js
import fs from 'fs/promises';
import prisma from './src/database/prisma.js';

async function migrateUsers() {
  try {
    // Đọc users từ JSON
    const data = await fs.readFile('./data/users.json', 'utf-8');
    const users = JSON.parse(data);

    // Insert vào PostgreSQL
    for (const user of users) {
      await prisma.user.create({
        data: {
          googleId: user.googleId,
          email: user.email,
          emailVerified: user.emailVerified,
          name: user.name,
          picture: user.picture,
          givenName: user.givenName,
          familyName: user.familyName,
          locale: user.locale,
          createdAt: new Date(user.createdAt),
          lastLoginAt: new Date(user.lastLoginAt)
        }
      });
    }

    console.log(`✅ Migrated ${users.length} users`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateUsers();
```

Chạy migration:

```bash
node migrate-users.js
```

## 🎯 UserService với Prisma

```javascript
// src/service/userService.js

// Tìm user
await userService.findByGoogleId(googleId);
await userService.findByEmail(email);

// Tạo user
await userService.createUser(userData);

// Update user
await userService.updateUser(googleId, updateData);

// Get or Create
await userService.getOrCreateUser(googleUserData);

// Delete user
await userService.deleteUser(googleId);

// Count users
await userService.countUsers();

// Get all users (pagination)
await userService.getAllUsers(skip, take);
```

## 🔍 Prisma Studio

GUI để xem và edit database:

```bash
npm run prisma:studio
```

Mở browser: `http://localhost:5555`

## 🐛 Troubleshooting

### Error: "Can't reach database server"

**Giải pháp:**
```bash
# Check PostgreSQL đang chạy
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Docker
docker ps | grep postgres
```

### Error: "Database does not exist"

**Giải pháp:**
```bash
# Tạo database
createdb SnapPDF

# Hoặc với psql
psql postgres
CREATE DATABASE "SnapPDF";
```

### Error: "Prisma Client not generated"

**Giải pháp:**
```bash
npm run prisma:generate
```

### Error: Migration failed

**Giải pháp:**
```bash
# Reset database và migration
npx prisma migrate reset

# Tạo lại migration
npx prisma migrate dev --name init
```

## 📊 Connection Pooling

Prisma tự động quản lý connection pool. Config trong schema:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pool settings (optional)
  // relationMode = "prisma"
}
```

## 🚀 Production Deployment

### 1. **Set DATABASE_URL**

```bash
# Railway, Render, etc.
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

### 2. **Run migration**

```bash
npx prisma migrate deploy
```

### 3. **Generate client**

```bash
npx prisma generate
```

## 🔐 Security

- ✅ Use environment variables cho DATABASE_URL
- ✅ Không commit `.env` file
- ✅ Use SSL trong production:
  ```
  DATABASE_URL="postgresql://...?sslmode=require"
  ```
- ✅ Limit connection pool size
- ✅ Use read replicas nếu có

## 📈 Performance Tips

1. **Indexing**: Schema đã có indexes cho `googleId` và `email` (unique)
2. **Select specific fields**:
   ```javascript
   await prisma.user.findUnique({
     where: { email },
     select: { email: true, picture: true }  // Only these fields
   });
   ```
3. **Batch operations**:
   ```javascript
   await prisma.user.createMany({
     data: users
   });
   ```

## ✅ Verify Setup

```bash
# 1. Check database connection
npx prisma db pull

# 2. Check tables
npx prisma studio

# 3. Test CRUD
npm run dev
# Login với Google → Check console logs
```

---

**Status:** ✅ Production Ready  
**Database:** PostgreSQL 15  
**ORM:** Prisma 5.7.0  
**Last Updated:** 2024-11-16

