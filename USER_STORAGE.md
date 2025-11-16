# User Storage System

## 📦 Hệ thống lưu trữ Users

Backend hiện sử dụng **file-based storage** (JSON) để lưu trữ thông tin users.

### 📁 Vị trí file:
```
SnapPDF_Backend/
└── data/
    └── users.json    # File lưu tất cả users
```

### 🔄 Cách hoạt động:

#### 1. **Khi user login lần đầu:**
```
1. User login với Google
2. Backend nhận thông tin từ Google
3. Kiểm tra user đã tồn tại chưa (theo googleId)
4. Nếu CHƯA → Tạo user mới trong users.json
5. Nếu ĐÃ có → Cập nhật lastLoginAt
6. Lưu session vào Redis
7. Trả về accessToken
```

#### 2. **Khi user login lần sau:**
```
1. User login với Google
2. Backend tìm user trong users.json (theo googleId)
3. User đã tồn tại → Cập nhật thông tin nếu cần
4. Cập nhật lastLoginAt
5. Lưu session vào Redis
6. Trả về accessToken
```

### 📊 Cấu trúc User trong users.json:

```json
[
  {
    "id": "user_1234567890_abc123",
    "googleId": "1234567890",
    "email": "user@example.com",
    "emailVerified": true,
    "name": "John Doe",
    "picture": "https://lh3.googleusercontent.com/...",
    "givenName": "John",
    "familyName": "Doe",
    "locale": "en",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z",
    "lastLoginAt": "2024-01-02T10:30:00.000Z"
  }
]
```

### 🔍 UserService Methods:

| Method | Mô tả |
|--------|-------|
| `getOrCreateUser(googleUserData)` | Tìm hoặc tạo user |
| `findByGoogleId(googleId)` | Tìm user theo Google ID |
| `findByEmail(email)` | Tìm user theo email |
| `createUser(userData)` | Tạo user mới |
| `updateUser(googleId, data)` | Cập nhật user |
| `updateLastLogin(googleId)` | Cập nhật last login time |
| `deleteUser(googleId)` | Xóa user |
| `countUsers()` | Đếm số users |

### 🎯 Flow trong authController:

```javascript
// Trong /auth/google/login
const { userInfo } = await authService.exchangeCodeForToken(code);

// ✅ Check/Create user
const user = await userService.getOrCreateUser(userInfo);

// Lưu session vào Redis
await redisClient.setToken(serviceToken, tokenData, ttl);
```

### 📈 Logs khi login:

**User mới:**
```
🔍 Checking if user exists in system...
✨ New user, creating...
✅ User created: user@example.com
✅ User ready: user@example.com (ID: user_1234567890_abc123)
```

**User đã tồn tại:**
```
🔍 Checking if user exists in system...
👤 Existing user: user@example.com
✅ User ready: user@example.com (ID: user_1234567890_abc123)
```

### 🔐 Storage Layer:

```
┌─────────────────────────────────────┐
│   Google OAuth (Authentication)    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  UserService (users.json)           │
│  - Lưu users persistent             │
│  - Check user exists                │
│  - Create/Update user               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Redis (Session Storage)            │
│  - Lưu token → user mapping         │
│  - TTL: 7 ngày                      │
└─────────────────────────────────────┘
```

### ⚡ Ưu điểm file-based:

- ✅ Đơn giản, dễ setup
- ✅ Không cần database server
- ✅ Phù hợp cho development/testing
- ✅ Dễ debug (đọc trực tiếp JSON)

### ⚠️ Hạn chế:

- ❌ Không scale tốt với nhiều users
- ❌ Không có transaction
- ❌ Không có indexing
- ❌ Race condition nếu concurrent writes

### 🚀 Upgrade lên Database (Production):

#### Option 1: MongoDB

```javascript
// userService.js với MongoDB
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  // ... các fields khác
});

const User = mongoose.model('User', UserSchema);

async getOrCreateUser(googleUserData) {
  return await User.findOneAndUpdate(
    { googleId: googleUserData.googleId },
    {
      ...googleUserData,
      lastLoginAt: new Date()
    },
    { upsert: true, new: true }
  );
}
```

#### Option 2: PostgreSQL

```javascript
// userService.js với PostgreSQL (pg)
import pg from 'pg';

async getOrCreateUser(googleUserData) {
  const result = await pool.query(`
    INSERT INTO users (google_id, email, name, ...)
    VALUES ($1, $2, $3, ...)
    ON CONFLICT (google_id)
    DO UPDATE SET
      last_login_at = NOW(),
      updated_at = NOW()
    RETURNING *
  `, [googleUserData.googleId, googleUserData.email, ...]);
  
  return result.rows[0];
}
```

### 📝 Migration Plan:

1. **Setup Database**
   ```bash
   # MongoDB
   docker run -d -p 27017:27017 mongo
   
   # PostgreSQL
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres
   ```

2. **Install Dependencies**
   ```bash
   # MongoDB
   npm install mongoose
   
   # PostgreSQL
   npm install pg
   ```

3. **Update userService.js**
   - Thay file-based bằng database queries
   - Giữ nguyên interface methods

4. **Migrate existing data**
   ```javascript
   // Script migrate users.json → database
   const users = JSON.parse(fs.readFileSync('data/users.json'));
   await User.insertMany(users);
   ```

### 🧪 Testing:

```bash
# Test create user
curl -X POST http://localhost:3000/api/auth/google/login \
  -H "Content-Type: application/json" \
  -d '{"code": "google_auth_code"}'

# Check users.json
cat data/users.json
```

---

**Current Status:** File-based storage (Development)  
**Recommended for Production:** MongoDB or PostgreSQL

