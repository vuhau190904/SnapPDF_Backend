import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import fileService from './fileService.js';
import awsService from './awsService.js';
import Constant from '../util/constant.js';


class OcrService {
  async filterUniqueImages(images) {
    const hashSet = new Set();
    const uniqueImages = [];

    for (const image of images) {
      const hash = crypto.createHash('sha256').update(image.buffer).digest('hex');
      
      if (!hashSet.has(hash)) {
        hashSet.add(hash);
        uniqueImages.push(image);
      } 
    }

    return uniqueImages;
  }

  async assignUuidAndSave(images, userEmail) {
    const imagesWithId = [];

    for (const image of images) {
      const id = uuidv4();
      
      const extension = image.originalname.split('.').pop();
      
      const imageWithId = {
        id,
        originalname: image.originalname,
        buffer: image.buffer,
        mimetype: image.mimetype,
        size: image.size,
        extension,
        fileName: `${id}.${extension}`
      };
      
      imagesWithId.push(imageWithId);
    }

    return imagesWithId;
  }

  async processImages(images, userEmail, language) {
    const uniqueImages = await this.filterUniqueImages(images);

    const processedImages = await this.assignUuidAndSave(uniqueImages, userEmail);

    const datas = processedImages.map(image => ({
      id: image.id,
      user_email: userEmail,
      status: Constant.PENDING,
      extension: image.extension
    }));

    await fileService.createFiles(datas);

    for (const image of processedImages) {
        await awsService.uploadImage(
          'images',
          image.buffer,
          image.fileName,  
          image.mimetype
        );
      }
  
      for (const image of processedImages) {
        const message = {
          id: image.id,
          language: language,
          extension: image.extension,
        };
        console.log("message", message);
        await awsService.sendMessage(message);
      }
  }
}

export default new OcrService();