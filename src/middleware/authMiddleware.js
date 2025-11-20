import redisClient from '../database/redis.js';
import dotenv from 'dotenv';
dotenv.config();

const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME || 'admin';
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD || 'password';

/**
 * Middleware xác thực token
 * Kiểm tra token từ header Authorization và xác thực với Redis
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 1. Lấy token từ header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No authorization header provided',
        error: 'MISSING_AUTH_HEADER'
      });
    }

    // Kiểm tra format: "Bearer <token>"
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid authorization format. Expected: Bearer <token>',
        error: 'INVALID_AUTH_FORMAT'
      });
    }

    // Lấy token (bỏ "Bearer " prefix)
    const token = authHeader.substring(7);

    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Token is empty',
        error: 'EMPTY_TOKEN'
      });
    }

    // 2. Kiểm tra token trong Redis
    const userData = await redisClient.getToken(token);

    if (!userData) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Token is invalid or expired',
        error: 'INVALID_TOKEN'
      });
    }

    // 3. Token hợp lệ, gắn thông tin user vào request
    req.user = userData;
    req.token = token;

    // Log để debug (có thể tắt ở production)
    console.log(`✅ User authenticated: ${userData.email}`);

    // 4. Tiếp tục xử lý request
    next();

  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);

    // Xử lý lỗi Redis
    if (error.message.includes('Redis is not connected')) {
      return res.status(503).json({
        success: false,
        message: 'Service unavailable: Database connection error',
        error: 'SERVICE_UNAVAILABLE'
      });
    }

    // Lỗi chung
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      error: 'AUTHENTICATION_ERROR'
    });
  }
};

// Basic Authentication middleware
export const basicAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Missing or malformed Authorization header',
      error: 'MISSING_BASIC_AUTH'
    });
  }

  // Decode base64 credentials
  const base64Credentials = authHeader.slice(6);
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [username, password] = credentials.split(':');
  // For demo purposes, replace with your own logic or configuration
  if (
    username !== BASIC_AUTH_USERNAME ||
    password !== BASIC_AUTH_PASSWORD
  ) {
    console.log("FAIL");
    console.log('password', password);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid basic authentication credentials',
      error: 'INVALID_BASIC_AUTH'
    });
  }
  console.log("SUCCESS");

  next();
};


export default authMiddleware;

