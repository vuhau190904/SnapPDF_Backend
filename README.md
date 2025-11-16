# SnapPDF Backend - Google OAuth 2.0 Authentication

Backend service sử dụng Express.js (JavaScript ES6+) để quản lý quy trình đăng nhập thông qua Google OAuth 2.0 với Redis để lưu trữ session.

## 🚀 Tính năng

- ✅ Xác thực Google OAuth 2.0
- ✅ Quản lý session với Redis
- ✅ JWT-like token authentication
- ✅ Protected routes với middleware
- ✅ RESTful API design
- ✅ Graceful shutdown
- ✅ Error handling
- ✅ CORS support

## 📋 Yêu cầu hệ thống

- **Node.js**: >= 16.x
- **Redis**: >= 6.x
- **npm** hoặc **yarn**

## 📦 Cài đặt

### 1. Clone repository (nếu có)

```bash
git clone <repository-url>
cd SnapPDF_Backend
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình Google OAuth 2.0

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Enable **Google+ API**
4. Vào **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Chọn **Web application**
6. Thêm **Authorized redirect URIs**:
   - Development: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
7. Copy **Client ID** và **Client Secret**

### 4. Cài đặt Redis

#### macOS (sử dụng Homebrew)
```bash
brew install redis
brew services start redis
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

#### Windows
- Download từ [Redis for Windows](https://github.com/microsoftarchive/redis/releases)
- Hoặc sử dụng Docker: `docker run -d -p 6379:6379 redis:alpine`

#### Docker (Tất cả OS)
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

### 5. Cấu hình biến môi trường

Copy file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Sau đó chỉnh sửa file `.env`:

```env
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Google OAuth (QUAN TRỌNG: Thay đổi các giá trị này)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Redis
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=*
```

⚠️ **LƯU Ý**: Nhớ thay đổi `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` bằng thông tin từ Google Cloud Console!

## 🏃 Chạy ứng dụng

### Development mode (với nodemon)

```bash
npm run dev
```

### Production mode

```bash
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

## 📚 API Endpoints

### Public Endpoints (Không cần authentication)

#### 1. Get API Information
```http
GET /api
```

**Response:**
```json
{
  "success": true,
  "message": "SnapPDF Backend API",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

#### 2. Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 3. Get Google Auth URL
```http
GET /api/auth/google
```

**Response:**
```json
{
  "success": true,
  "message": "Google authentication URL generated successfully",
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
  }
}
```

#### 4. Login with Google
```http
POST /api/auth/google/login
Content-Type: application/json

{
  "code": "authorization_code_from_google"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "uuid-token",
    "tokenType": "Bearer",
    "expiresIn": 604800,
    "user": {
      "googleId": "...",
      "email": "user@example.com",
      "name": "User Name",
      "picture": "https://...",
      ...
    }
  }
}
```

### Protected Endpoints (Cần authentication)

**Header cần thiết:**
```
Authorization: Bearer <your_access_token>
```

#### 5. Get User Profile
```http
GET /api/user/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "googleId": "...",
      "email": "user@example.com",
      "name": "User Name",
      ...
    },
    "tokenInfo": {
      "expiresIn": 604800,
      "expiresAt": "2024-01-08T00:00:00.000Z"
    }
  }
}
```

#### 6. Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### 7. Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-uuid-token",
    "tokenType": "Bearer",
    "expiresIn": 604800
  }
}
```

#### 8. Get User Settings (Example)
```http
GET /api/user/settings
Authorization: Bearer <token>
```

## 🔄 Flow đăng nhập với Google OAuth

```
1. Frontend gọi GET /api/auth/google
   ↓
2. Backend trả về authUrl
   ↓
3. Frontend redirect user đến authUrl (Google login page)
   ↓
4. User đăng nhập với Google
   ↓
5. Google redirect về GOOGLE_REDIRECT_URI với code
   ↓
6. Frontend lấy code và gọi POST /api/auth/google/login
   ↓
7. Backend:
   - Đổi code lấy user info từ Google
   - Tạo service token (UUID)
   - Lưu user info vào Redis với token làm key
   - Trả về token cho frontend
   ↓
8. Frontend lưu token và dùng cho các request tiếp theo
   (Header: Authorization: Bearer <token>)
```

## 🏗️ Cấu trúc thư mục

```
SnapPDF_Backend/
├── src/
│   ├── controller/
│   │   └── authController.js       # Xử lý request/response
│   ├── database/
│   │   └── redis.js                # Redis client và operations
│   ├── middleware/
│   │   └── authMiddleware.js       # Middleware xác thực token
│   ├── service/
│   │   └── authService.js          # Logic nghiệp vụ Google OAuth
│   ├── routes.js                    # Định nghĩa API routes
│   └── server.js                    # Express app configuration
├── .env                             # Biến môi trường (không commit)
├── .env.example                     # Template biến môi trường
├── package.json                     # Dependencies
└── README.md                        # Documentation
```

## 🧪 Test API với cURL

### 1. Health check
```bash
curl http://localhost:3000/api/health
```

### 2. Get Google auth URL
```bash
curl http://localhost:3000/api/auth/google
```

### 3. Login (sau khi có code từ Google)
```bash
curl -X POST http://localhost:3000/api/auth/google/login \
  -H "Content-Type: application/json" \
  -d '{"code": "your_google_auth_code"}'
```

### 4. Get profile (với token)
```bash
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer your_access_token"
```

### 5. Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer your_access_token"
```

## 🐛 Troubleshooting

### Lỗi: "Redis is not connected"

**Nguyên nhân**: Redis server chưa chạy hoặc REDIS_URL không đúng.

**Giải pháp**:
```bash
# Kiểm tra Redis đang chạy
redis-cli ping
# Response: PONG

# Nếu không chạy, start Redis
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker start redis
```

### Lỗi: "Missing required environment variables"

**Nguyên nhân**: Chưa cấu hình file `.env` đúng.

**Giải pháp**:
1. Copy `.env.example` thành `.env`
2. Điền đầy đủ thông tin `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

### Lỗi: "Authorization code is invalid or expired"

**Nguyên nhân**: Code từ Google chỉ dùng được 1 lần và có thời gian sống ngắn.

**Giải pháp**:
- Lấy code mới từ Google OAuth flow
- Gọi API login ngay sau khi nhận được code

### Lỗi CORS

**Nguyên nhân**: Frontend domain không được phép gọi API.

**Giải pháp**:
- Thêm domain frontend vào `CORS_ORIGIN` trong file `.env`
- Ví dụ: `CORS_ORIGIN=http://localhost:3001,https://yourdomain.com`

## 🔐 Bảo mật

### Production Checklist

- [ ] Đổi `CORS_ORIGIN` từ `*` thành danh sách domain cụ thể
- [ ] Sử dụng HTTPS cho `GOOGLE_REDIRECT_URI`
- [ ] Enable Redis password: `REDIS_URL=redis://:password@host:port`
- [ ] Đặt `NODE_ENV=production`
- [ ] Không commit file `.env` (đã có trong `.gitignore`)
- [ ] Sử dụng environment variables từ hosting service
- [ ] Giới hạn rate limiting cho API
- [ ] Enable Redis persistence (RDB/AOF)

## 📝 License

ISC

## 👥 Author

SnapPDF Team

## 📧 Support

Nếu gặp vấn đề, vui lòng tạo issue hoặc liên hệ qua email.

---

**Happy Coding! 🚀**

