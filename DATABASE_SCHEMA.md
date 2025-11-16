# 🗄️ Database Schema

## 📊 Tables

### 1. **user** table

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY | User ID (UUID) |
| `email` | VARCHAR | UNIQUE, NOT NULL | User email (từ Google) |
| `avatar` | VARCHAR | NULLABLE | Avatar URL (Google picture) |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation time |

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE: `email`

### 2. **file** table

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY | File ID (UUID) |
| `user_id` | VARCHAR | FOREIGN KEY → user(id) | Owner của file |
| `link_s3` | VARCHAR | NOT NULL | S3 storage link |
| `content` | VARCHAR | NOT NULL | File content/text |
| `createAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Upload time |

**Indexes:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` → `user(id)` ON DELETE CASCADE

**Relations:**
- `file.user_id` → `user.id` (Many-to-One)

## 📐 ER Diagram

```
┌─────────────────────┐
│      user           │
├─────────────────────┤
│ id (PK)             │
│ email (UNIQUE)      │
│ avatar              │
│ createdAt           │
└──────────┬──────────┘
           │
           │ 1
           │
           │ N
┌──────────┴──────────┐
│      file           │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ link_s3             │
│ content             │
│ createAt            │
└─────────────────────┘
```

## 🔗 Relations

- **User → Files**: One-to-Many
  - Một user có thể có nhiều files
  - Khi xóa user → cascade delete tất cả files của user đó

## 📝 Prisma Schema

```prisma
model User {
  id        String   @id @default(uuid()) @db.VarChar
  email     String   @unique @db.VarChar
  avatar    String?  @db.VarChar
  createdAt DateTime @default(now()) @db.Timestamp(6)

  files     File[]

  @@map("user")
}

model File {
  id        String   @id @default(uuid()) @db.VarChar
  user_id   String   @db.VarChar
  link_s3   String   @db.VarChar
  content   String   @db.VarChar
  createAt  DateTime @default(now()) @db.Timestamp(6)

  user      User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("file")
}
```

## 🔄 Authentication Flow với Database

### Login Flow:

```
1. User login với Google
   ↓
2. Backend nhận userInfo từ Google:
   { email, picture }
   ↓
3. Check user trong database:
   SELECT * FROM user WHERE email = ?
   ↓
   ├─ Nếu CHƯA có → INSERT INTO user (email, avatar)
   │
   └─ Nếu ĐÃ có → UPDATE user SET avatar = ? WHERE email = ?
   ↓
4. Lưu session vào Redis:
   { userId, email, avatar }
   ↓
5. Trả về accessToken
```

### API `/user/profile` Flow:

```
1. Frontend gọi với Bearer token
   ↓
2. authMiddleware verify token → lấy user từ Redis
   ↓
3. req.user = { userId, email, avatar }
   ↓
4. Return { email, picture: avatar }
```

## 💾 Storage Strategy

### PostgreSQL (Long-term):
- **user**: Thông tin users (persistent)
- **file**: Metadata của files

### Redis (Session):
- **Token → User mapping**: `{ userId, email, avatar, loginAt }`
- **TTL**: 7 ngày

### S3 (File storage):
- **PDF files**: Actual file content
- **link_s3**: URL to S3 object

## 🔍 Query Examples

### Create user:
```sql
INSERT INTO user (id, email, avatar, createdAt)
VALUES (uuid_generate_v4(), 'user@example.com', 'https://...', NOW());
```

### Get user files:
```sql
SELECT f.* 
FROM file f
JOIN user u ON f.user_id = u.id
WHERE u.email = 'user@example.com'
ORDER BY f.createAt DESC;
```

### Delete user (cascade delete files):
```sql
DELETE FROM user WHERE id = 'user-uuid';
-- Files automatically deleted via CASCADE
```

## 📊 Database Migrations

Nếu database đã tồn tại:

```bash
# Pull existing schema
npx prisma db pull

# Generate Prisma Client
npx prisma generate
```

Nếu database chưa có:

```bash
# Push schema to database
npx prisma db push

# Hoặc tạo migration
npx prisma migrate dev --name init
```

## 🎯 UserService Methods

```javascript
// User operations
await userService.findByEmail(email);
await userService.findById(id);
await userService.createUser({ email, avatar });
await userService.updateUser(email, { avatar });
await userService.deleteUser(email);
await userService.getOrCreateUser({ email, picture });

// File operations
await userService.getUserFiles(userId, skip, take);
await userService.createFile({ user_id, link_s3, content });
await userService.getFileById(fileId);
await userService.deleteFile(fileId);

// Stats
await userService.countUsers();
await userService.getAllUsers(skip, take);
```

## 🔐 Security Notes

- ✅ Email là UNIQUE constraint
- ✅ Foreign key với CASCADE DELETE
- ✅ UUID cho IDs (không đoán được)
- ✅ Timestamps cho audit
- ✅ Session trong Redis (có TTL)

---

**Last Updated:** 2024-11-16  
**Database:** PostgreSQL (Remote hosted)  
**ORM:** Prisma 5.7.0

