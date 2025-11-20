import prisma from '../database/prisma.js';
import Constant from '../util/constant.js';
import fileService from './fileService.js';
import awsService from './awsService.js';
import crypto from 'crypto';


/**
 * User Service with Prisma
 * Quản lý users với PostgreSQL database
 * Schema: email (PK), avatar, created_at
 */
class UserService {
  /**
   * Tìm user theo email
   * @param {string} email - User email
   * @returns {Promise<object|null>} - User object hoặc null
   */
  async findByEmail(email) {
    try {
      const user = await prisma.users.findUnique({
        where: { email }
      });
      return user;
    } catch (error) {
      console.error('❌ Error finding user by email:', error);
      return null;
    }
  }


  /**
   * Tạo user mới
   * @param {object} userData - { email, avatar }
   * @returns {Promise<object>} - User đã tạo
   */
  async createUser(userData) {
    try {
      const newUser = await prisma.users.create({
        data: {
          email: userData.email,
          avatar: userData.avatar || null
        }
      });

      console.log('✅ User created:', newUser.email);
      return newUser;

    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  /**
   * Cập nhật thông tin user
   * @param {string} email - User email
   * @param {object} updateData - Dữ liệu cần cập nhật
   * @returns {Promise<object>} - User đã cập nhật
   */
  async updateUser(email, updateData) {
    try {
      const updatedUser = await prisma.users.update({
        where: { email },
        data: updateData
      });

      console.log('✅ User updated:', updatedUser.email);
      return updatedUser;

    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }

  /**
   * Xóa user
   * @param {string} email - User email
   * @returns {Promise<boolean>} - true nếu thành công
   */
  async deleteUser(email) {
    try {
      await prisma.users.delete({
        where: { email }
      });

      console.log('✅ User deleted:', email);
      return true;

    } catch (error) {
      console.error('❌ Error deleting user:', error);
      return false;
    }
  }

  /**
   * Get hoặc Create user (tìm hoặc tạo mới)
   * Dùng email làm unique identifier
   * @param {object} googleUserData - Dữ liệu user từ Google { email, picture }
   * @returns {Promise<object>} - User object
   */
  async getOrCreateUser(googleUserData) {
    try {
      const { email, picture } = googleUserData;

      // Tìm user theo email
      let user = await this.findByEmail(email);

      if (user) {
        // User đã tồn tại
        console.log('👤 Existing user:', user.email);

        // Cập nhật avatar nếu có thay đổi
        if (picture && user.avatar !== picture) {
          user = await this.updateUser(email, {
            avatar: picture
          });
          console.log('✅ User avatar updated');
        }
      } else {
        // User chưa tồn tại, tạo mới
        console.log('✨ New user, creating...');
        user = await this.createUser({
          email: email,
          avatar: picture
        });
      }

      return user;

    } catch (error) {
      console.error('❌ Error in getOrCreateUser:', error);
      throw error;
    }
  }

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

  async filterUniqueFiles(files) {
    const hashSet = new Set();
    const uniqueFiles = [];

    for (const file of files) {
      const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

      if (!hashSet.has(hash)) {
        hashSet.add(hash);
        uniqueFiles.push(file);
      }
    }

    return uniqueFiles;
  }

  async processFiles(files, userEmail) {
    const uniqueFiles = await this.filterUniqueFiles(files);

    const datas = uniqueFiles.map(file => ({
      id: file.originalname.split('.').slice(0, -1).join("."),
      user_email: userEmail,
      status: Constant.MANAGEMENT,
      extension: file.originalname.split('.').pop()
    }));

    console.log("datas", datas);

    await fileService.createFiles(datas);

    for (const image of uniqueFiles) {
      await awsService.uploadImage(
        'management',
        image.buffer,
        image.originalname,
        image.mimetype
      );
    }
  }

}

// Tạo instance singleton
const userService = new UserService();

export default userService;
