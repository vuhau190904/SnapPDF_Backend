import express from 'express';
import redisClient from '../database/redis.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * User Controller with Routes
 * Chứa các routes và xử lý cho user
 * Tất cả routes đều cần authentication
 */

/**
 * GET /user/profile
 * Lấy thông tin profile của user hiện tại
 * Headers: Authorization: Bearer <token>
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        error: 'NOT_AUTHENTICATED'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: {
          email: user.email,
          picture: user.avatar  // Đổi từ picture thành avatar
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in getUserProfile:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile',
      error: error.message
    });
  }
});

export default router;
