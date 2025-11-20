import express from 'express';
import authMiddleware, { basicAuthMiddleware } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/fileMiddleware.js';
import ocrService from '../service/ocrService.js';
import awsService from '../service/awsService.js';
import Constant from '../util/constant.js';
import fileService from '../service/fileService.js';

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
    const language = req.query.language || ''; 
    
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

router.get('', basicAuthMiddleware, async (req, res) => {
  console.log('req.params', req.query);
  if(!req.query.file_id)
    return res.status(400);
  console.log('req.query.file_id', req.query.file_id);
  const test = await fileService.updateFile(req.query.file_id, {
    status: Constant.COMPLETED
  });
  console.log('test', test);
  return res.status(200);
});

export default router;
