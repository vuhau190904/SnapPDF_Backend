import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Redis Client Configuration
 * Khởi tạo và kết nối Redis client
 */
class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Kết nối đến Redis server
   */
  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis connection error:', err.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('⚠️  Redis connection closed');
        this.isConnected = false;
      });

      // Đợi kết nối thành công
      await this.client.ping();
      
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      throw error;
    }
  }

  /**
   * Lưu token vào Redis với TTL (Time To Live)
   * @param {string} key - Key của token
   * @param {string} value - Giá trị token hoặc dữ liệu user (JSON string)
   * @param {number} ttl - Thời gian sống của token (giây), mặc định 7 ngày
   * @returns {Promise<string>} - 'OK' nếu thành công
   */
  async setToken(key, value, ttl = 60 * 60 * 24 * 7) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis is not connected');
      }

      // Nếu value là object, chuyển thành JSON string
      const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
      
      // Set với TTL
      const result = await this.client.setex(key, ttl, valueToStore);
      
      console.log(`✅ Token stored in Redis: ${key} (TTL: ${ttl}s)`);
      return result;
    } catch (error) {
      console.error('❌ Error setting token in Redis:', error.message);
      throw error;
    }
  }

  /**
   * Lấy token từ Redis
   * @param {string} key - Key của token
   * @returns {Promise<string|object|null>} - Giá trị token hoặc null nếu không tồn tại
   */
  async getToken(key) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis is not connected');
      }

      const value = await this.client.get(key);
      
      if (!value) {
        return null;
      }

      // Thử parse JSON nếu có thể
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('❌ Error getting token from Redis:', error.message);
      throw error;
    }
  }

  /**
   * Xóa token khỏi Redis
   * @param {string} key - Key của token
   * @returns {Promise<number>} - Số lượng key đã xóa
   */
  async deleteToken(key) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis is not connected');
      }

      const result = await this.client.del(key);
      console.log(`✅ Token deleted from Redis: ${key}`);
      return result;
    } catch (error) {
      console.error('❌ Error deleting token from Redis:', error.message);
      throw error;
    }
  }

  /**
   * Kiểm tra token có tồn tại không
   * @param {string} key - Key của token
   * @returns {Promise<boolean>} - true nếu tồn tại, false nếu không
   */
  async exists(key) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis is not connected');
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('❌ Error checking token existence in Redis:', error.message);
      throw error;
    }
  }

}

// Tạo instance singleton
const redisClient = new RedisClient();

export default redisClient;

