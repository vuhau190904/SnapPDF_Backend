import express from 'express';
import authService from '../service/authService.js';
import userService from '../service/userService.js';
import redisClient from '../database/redis.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /auth/google
 * Trả về URL xác thực Google
 */
router.get('/google', async (req, res) => {
  try {
    const authUrl = authService.createGoogleAuthUrl();
    console.log(authUrl);
    return res.status(200).json({
      success: true,
      message: 'Google authentication URL generated successfully',
      data: { authUrl }
    });

  } catch (error) {
    console.error('❌ Error in getAuthUrl:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to generate Google authentication URL',
      error: error.message
    });
  }
});

/**
 * POST /auth/google/login
 * Xử lý callback từ Google và trả về Access Token của dịch vụ
 * Body: { code: string }
 */
router.post('/google/login', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required',
        error: 'MISSING_CODE'
      });
    }

    // 1. Đổi code lấy thông tin Google User
    const { userInfo } = await authService.exchangeCodeForToken(code);

    if (!userInfo || !userInfo.email) {
      return res.status(400).json({
        success: false,
        message: 'Failed to retrieve user information from Google',
        error: 'INVALID_USER_INFO'
      });
    }

    // 2. Kiểm tra user có trong hệ thống chưa, nếu chưa thì tạo mới
    console.log('🔍 Checking if user exists in system...');
    const user = await userService.getOrCreateUser({
      email: userInfo.email,
      picture: userInfo.picture
    });
    console.log(`✅ User ready: ${user.email} (ID: ${user.id})`);

    // 3. Tạo Service Access Token
    const serviceToken = authService.generateServiceToken();

    // 4. Lưu thông tin user vào Redis với token làm key (cho session)
    const tokenData = {
      userId: user.id,
      email: user.email,
      avatar: user.avatar,
      loginAt: new Date().toISOString()
    };

    // TTL: 7 ngày (7 * 24 * 60 * 60 = 604800 giây)
    const ttl = 7 * 24 * 60 * 60;
    await redisClient.setToken(serviceToken, tokenData, ttl);

    // 5. Trả về Access Token và thông tin user
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: serviceToken,
        tokenType: 'Bearer',
        expiresIn: ttl,
        user: {
          id: user.id,
          email: user.email,
          avatar: user.avatar
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in handleLogin:', error.message);

    if (error.message.includes('invalid or expired')) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is invalid or expired',
        error: 'INVALID_CODE'
      });
    }

    if (error.message.includes('Redis')) {
      return res.status(503).json({
        success: false,
        message: 'Service unavailable: Database connection error',
        error: 'SERVICE_UNAVAILABLE'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// ==================== Protected Routes ====================

/**
 * POST /auth/logout
 * Đăng xuất - xóa token khỏi Redis
 * Headers: Authorization: Bearer <token>
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No token provided',
        error: 'MISSING_TOKEN'
      });
    }

    await redisClient.deleteToken(token);

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('❌ Error in logout:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

export default router;
