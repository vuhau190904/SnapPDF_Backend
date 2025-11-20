import express from 'express';
import redisClient from '../database/redis.js';
import authMiddleware from '../middleware/authMiddleware.js';
import fileService from '../service/fileService.js';
import awsService from '../service/awsService.js';
import userService from '../service/userService.js';
import Constant from '../util/constant.js';
import { uploadManagement } from '../middleware/fileMiddleware.js';



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

/**
 * GET /user/files
 * Lấy danh sách files với Presigned URLs cho cả image và PDF
 * Headers: Authorization: Bearer <token>
 * Query params: skip, take (pagination), expiresIn (URL expiry in seconds, default 3600)
 */
router.get('/files', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const skip = parseInt(req.query.skip) || 0;
    const take = parseInt(req.query.take) || 100;
    const expiresIn = 60; // 1 hour default for presigned URLs

    // Lấy danh sách files từ database  
    const files = await fileService.getUserFiles(userEmail, skip, take);
    const totalCount = await fileService.countUserFiles(userEmail);

    // Generate presigned URLs cho mỗi file
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        // Tạo presigned URL cho image
        // Nếu có extension field trong DB thì dùng, không thì thử các extension phổ biến
        const extension = file.extension || 'jpg'; // Default to jpg if no extension
        const imageKey = `images/${file.id}.${extension}`;
        const pdfKey = `pdf/${file.id}.pdf`;

        // Generate presigned URLs (trả về null nếu file không tồn tại)
        const [imageUrl, pdfUrl] = await Promise.all([
          awsService.getPresignedUrl(imageKey, expiresIn),
          awsService.getPresignedUrl(pdfKey, expiresIn)
        ]);

        return {
          id: file.id,
          status: file.status,
          created_at: file.created_at,
          extension: extension,
          urls: {
            image: imageUrl, // null if not exists
            pdf: pdfUrl       // null if not exists or not processed yet
          }
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Files with presigned URLs retrieved successfully',
      data: {
        files: filesWithUrls,
        total: totalCount,
        skip,
        take,
        expiresIn // URL expiration time in seconds
      }
    });

  } catch (error) {
    console.error('❌ Error getting files with URLs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve files with URLs',
      error: error.message
    });
  }
});   

router.post('/files/upload', authMiddleware, uploadManagement.array('images', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded',
        error: 'NO_IMAGES'
      });
    }

    const userEmail = req.user.email;


    
    await userService.processFiles(req.files, userEmail);

    return res.status(200).json({
      message: 'Images uploaded successfully',
    });

  } catch (error) {
    console.error('❌ Error processing images:', error.message);
    
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'INVALID_FILE_TYPE'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to process images',
      error: error.message
    });
  }
});

/**
 * GET /user/management-files
 * Lấy danh sách files MANAGEMENT với Presigned URLs
 * Headers: Authorization: Bearer <token>
 * Query params: skip, take (pagination)
 */
router.get('/management-files', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const skip = parseInt(req.query.skip) || 0;
    const take = parseInt(req.query.take) || 100;
    const expiresIn = 60; // 1 minute for presigned URLs

    // Lấy files có status = 'management' từ database
    const files = await fileService.getUserFilesByStatus(userEmail, 'management', skip, take);
    const totalCount = await fileService.countUserFilesByStatus(userEmail, 'management');

    // Generate presigned URLs cho mỗi file từ S3 management folder
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const extension = file.extension || 'jpg';
        // Lấy từ management prefix thay vì images/pdfs
        const fileKey = `management/${file.id}.${extension}`;

        // Generate presigned URL
        const fileUrl = await awsService.getPresignedUrl(fileKey, expiresIn);

        return {
          id: file.id,
          status: file.status,
          created_at: file.created_at,
          extension: extension,
          url: fileUrl // Single URL from management folder
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Management files retrieved successfully',
      data: {
        files: filesWithUrls,
        total: totalCount,
        skip,
        take,
        expiresIn
      }
    });

  } catch (error) {
    console.error('❌ Error getting management files:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve management files',
      error: error.message
    });
  }
});

export default router;
