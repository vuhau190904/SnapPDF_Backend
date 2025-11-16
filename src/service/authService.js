import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Auth Service
 * Chứa logic nghiệp vụ chính cho Google OAuth 2.0
 */
class AuthService {
  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];
  }

  /**
   * Tạo URL xác thực Google OAuth
   * @returns {string} - URL xác thực Google
   */
  createGoogleAuthUrl() {
    try {
      const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: this.scopes,
        prompt: 'consent',
        state: uuidv4()
      });
      console.log('✅ Google Auth URL created successfully');
      return authUrl;
    } catch (error) {
      console.error('❌ Error creating Google Auth URL:', error.message);
      throw new Error('Failed to create Google Auth URL');
    }
  }

  /**
   * Đổi authorization code lấy thông tin Google User
   * @param {string} code - Authorization code từ Google
   * @returns {Promise<object>} - Thông tin người dùng từ Google
   */
  async exchangeCodeForToken(code) {
    try {
      if (!code) {
        throw new Error('Authorization code is required');
      }

      // Đổi code lấy tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens || !tokens.id_token) {
        throw new Error('Failed to get tokens from Google');
      }

      // Verify và lấy thông tin user từ ID token
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();

      // Lấy thông tin user
      const userInfo = {
        email: payload.email,
        picture: payload.picture,
      };

      console.log('✅ Successfully exchanged code for user info:', userInfo.email);

      return { userInfo };
      
    } catch (error) {
      console.error('❌ Error exchanging code for token:', error.message);
      
      if (error.message.includes('invalid_grant')) {
        throw new Error('Authorization code is invalid or expired');
      }
      
      throw new Error(`Failed to authenticate with Google: ${error.message}`);
    }
  }

  /**
   * Tạo Access Token mới của dịch vụ (service token)
   * Token này sẽ được lưu trong Redis và dùng để xác thực các request sau
   * @returns {string} - Service access token (UUID)
   */
  generateServiceToken() {
    try {
      const token = uuidv4();
      console.log('✅ Service token generated successfully');
      return token;
    } catch (error) {
      console.error('❌ Error generating service token:', error.message);
      throw new Error('Failed to generate service token');
    }
  }
}

// Tạo instance singleton
const authService = new AuthService();

export default authService;

