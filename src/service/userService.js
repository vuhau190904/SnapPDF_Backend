import prisma from '../database/prisma.js';

/**
 * User Service with Prisma
 * Quản lý users với PostgreSQL database
 * Schema: id, email, avatar, createdAt
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
   * Tìm user theo ID
   * @param {string} id - User ID
   * @returns {Promise<object|null>} - User object hoặc null
   */
  async findById(id) {
    try {
      const user = await prisma.users.findUnique({
        where: { id }
      });
      return user;
    } catch (error) {
      console.error('❌ Error finding user by ID:', error);
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
   * Đếm tổng số users
   * @returns {Promise<number>}
   */
  async countUsers() {
    try {
      const count = await prisma.users.count();
      return count;
    } catch (error) {
      console.error('❌ Error counting users:', error);
      return 0;
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
   * Lấy tất cả users (với pagination)
   * @param {number} skip - Số records bỏ qua
   * @param {number} take - Số records lấy
   * @returns {Promise<Array>}
   */
  async getAllUsers(skip = 0, take = 100) {
    try {
      const users = await prisma.users.findMany({
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        }
      });
      return users;
    } catch (error) {
      console.error('❌ Error getting all users:', error);
      return [];
    }
  }

  /**
   * Lấy files của user
   * @param {string} userId - User ID
   * @param {number} skip - Số records bỏ qua
   * @param {number} take - Số records lấy
   * @returns {Promise<Array>}
   */
  async getUserFiles(userId, skip = 0, take = 100) {
    try {
      const files = await prisma.file.findMany({
        where: {
          user_id: userId
        },
        skip,
        take,
        orderBy: {
          createAt: 'desc'
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
   * @param {object} fileData - { user_id, link_s3, content }
   * @returns {Promise<object>}
   */
  async createFile(fileData) {
    try {
      const newFile = await prisma.file.create({
        data: {
          user_id: fileData.user_id,
          link_s3: fileData.link_s3,
          content: fileData.content || ''
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
      const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: {
          user: {
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
      await prisma.file.delete({
        where: { id: fileId }
      });

      console.log('✅ File deleted:', fileId);
      return true;

    } catch (error) {
      console.error('❌ Error deleting file:', error);
      return false;
    }
  }
}

// Tạo instance singleton
const userService = new UserService();

export default userService;
