import prisma from '../database/prisma.js';

/**
 * Files Service with Prisma
 * Quản lý files với PostgreSQL database
 * Schema: id (PK), user_email, created_at
 */
class FileService {
  /**
   * Lấy files của user
   * @param {string} userEmail - User email
   * @param {number} skip - Số records bỏ qua
   * @param {number} take - Số records lấy
   * @returns {Promise<Array>}
   */
  async getUserFiles(userEmail, skip = 0, take = 100) {
    try {
      const files = await prisma.files.findMany({
        where: {
          user_email: userEmail
        },
        skip,
        take,
        orderBy: {
          created_at: 'desc'
        } 
      });
      return files;
    } catch (error) {
      console.error('❌ Error getting user files:', error);
      return [];
    }
  }

  /**
   * Tạo file mới
   * @param {object} fileData - { id, user_email }
   * @returns {Promise<object>}
   */
  async createFile(fileData) {
    try {
      const newFile = await prisma.files.create({
        data: {
          id: fileData.id,
          user_email: fileData.user_email
        }
      });

      console.log('✅ File created:', newFile.id);
      return newFile;

    } catch (error) {
      console.error('❌ Error creating file:', error);
      throw error;
    }
  }

  /**
   * Lấy file theo ID
   * @param {string} fileId - File ID
   * @returns {Promise<object|null>}
   */
  async getFileById(fileId) {
    try {
      const file = await prisma.files.findUnique({
        where: { id: fileId },
        include: {
          users: {
            select: {
              email: true,
              avatar: true
            }
          }
        }
      });
      return file;
    } catch (error) {
      console.error('❌ Error getting file:', error);
      return null;
    }
  }

  /**
   * Xóa file
   * @param {string} fileId - File ID
   * @returns {Promise<boolean>}
   */
  async deleteFile(fileId) {
    try {
      await prisma.files.delete({
        where: { id: fileId }
      });

      console.log('✅ File deleted:', fileId);
      return true;

    } catch (error) {
      console.error('❌ Error deleting file:', error);
      return false;
    }
  }

  /**
   * Đếm tổng số files của user
   * @param {string} userEmail - User email
   * @returns {Promise<number>}
   */
  async countUserFiles(userEmail) {
    try {
      const count = await prisma.files.count({
        where: {
          user_email: userEmail
        }
      });
      return count;
    } catch (error) {
      console.error('❌ Error counting user files:', error);
      return 0;
    }
  }

  /**
   * Xóa tất cả files của user
   * @param {string} userEmail - User email
   * @returns {Promise<number>} - Số files đã xóa
   */
  async deleteUserFiles(userEmail) {
    try {
      const result = await prisma.files.deleteMany({
        where: {
          user_email: userEmail
        }
      });

      console.log(`✅ Deleted ${result.count} files for user:`, userEmail);
      return result.count;

    } catch (error) {
      console.error('❌ Error deleting user files:', error);
      return 0;
    }
  }
}

// Tạo instance singleton
const fileService = new FileService();

export default fileService;

