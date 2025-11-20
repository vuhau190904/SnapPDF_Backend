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
   * Lấy files của user theo status
   * @param {string} userEmail - User email
   * @param {string} status - File status
   * @param {number} skip - Số records bỏ qua
   * @param {number} take - Số records lấy
   * @returns {Promise<Array>}
   */
  async getUserFilesByStatus(userEmail, status, skip = 0, take = 100) {
    try {
      const files = await prisma.files.findMany({
        where: {
          user_email: userEmail,
          status: status
        },
        skip,
        take,
        orderBy: {
          created_at: 'desc'
        }
      });
      return files;
    } catch (error) {
      console.error('❌ Error getting user files by status:', error);
      return [];
    }
  }

  /**
   * Đếm files của user theo status
   * @param {string} userEmail - User email
   * @param {string} status - File status
   * @returns {Promise<number>}
   */
  async countUserFilesByStatus(userEmail, status) {
    try {
      const count = await prisma.files.count({
        where: {
          user_email: userEmail,
          status: status
        }
      });
      return count;
    } catch (error) {
      console.error('❌ Error counting user files by status:', error);
      return 0;
    }
  }

  /**
   * Tạo file mới
   * @param {object} fileData - { id, user_email, status, extension }
   * @returns {Promise<object>}
   */
  async createFile(fileData) {
    try {
      const newFile = await prisma.files.create({
        data: {
          id: fileData.id,
          user_email: fileData.user_email,
          status: fileData.status || 'pending',
          extension: fileData.extension || null
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
   * Tạo nhiều files (bulk insert)
   * @param {Array} filesData - Array of { id, user_email, status }
   * @returns {Promise<number>} - Số files đã tạo
   */
  async createFiles(filesData) {
    try {
      const result = await prisma.files.createMany({
        data: filesData,
        skipDuplicates: true
      });

      console.log(`✅ Created ${result.count} files`);
      return result.count;

    } catch (error) {
      console.error('❌ Error creating files:', error);
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
   * Update file theo ID
   * @param {string} fileId - File ID
   * @param {object} updateData - { status, extension, etc. }
   * @returns {Promise<object|null>}
   */
  async updateFile(fileId, updateData) {
    try {
      const updatedFile = await prisma.files.update({
        where: { id: fileId },
        data: updateData
      });

      console.log('✅ File updated:', fileId);
      return updatedFile;

    } catch (error) {
      console.error('❌ Error updating file:', error);
      throw error;
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

