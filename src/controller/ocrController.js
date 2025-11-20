import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { upload } from '../middleware/fileMiddleware.js';
import ocrService from '../service/ocrService.js';
import awsService from '../service/awsService.js';

const router = express.Router();


router.post('/upload', authMiddleware, upload.array('images', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded',
        error: 'NO_IMAGES'
      });
    }

    const userEmail = req.user.email;
    console.log('userEmail', userEmail);
    const language = req.query.language || req.body.language || 'vie'; 
    
    await ocrService.processImages(req.files, userEmail, language);

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

export default router;
