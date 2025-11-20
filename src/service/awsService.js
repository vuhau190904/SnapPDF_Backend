import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import dotenv from 'dotenv';

dotenv.config();

class AwsService {
  constructor() {
    const awsConfig = {
      region: process.env.AWS_REGION || 'ap-southeast-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    };

    // S3 Client
    this.s3Client = new S3Client(awsConfig);
    this.s3Bucket = process.env.AWS_S3_BUCKET;

    // SQS Client
    this.sqsClient = new SQSClient(awsConfig);
    this.OcrSqsQueueUrl = process.env.AWS_SQS_OCR_QUEUE_URL;
  }

  async uploadImage(fileBuffer, fileName, mimeType) {
    try {
      const fileKey = `images/${fileName}`;
      console.log("bucket", this.s3Bucket);
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: mimeType
      }));
    } catch (error) {
      throw new Error(`Failed to upload to S3: ${error.message}`);
    }
  }

  async deleteImage(fileKey) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.s3Bucket,
        Key: fileKey
      });

      await this.s3Client.send(command);
      
      console.log('✅ Image deleted from S3:', fileKey);
      return true;

    } catch (error) {
      console.error('❌ Error deleting image from S3:', error);
      return false;
    }
  }

  async getFileStream(fileKey) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: fileKey
      });

      const response = await this.s3Client.send(command);
      
      console.log('✅ File stream retrieved from S3:', fileKey);
      
      return {
        stream: response.Body,
        contentType: response.ContentType || 'application/octet-stream',
        contentLength: response.ContentLength || 0,
        metadata: response.Metadata || {}
      };

    } catch (error) {
      console.error('❌ Error getting file stream from S3:', error);
      throw new Error(`Failed to get file from S3: ${error.message}`);
    }
  }

  async sendMessage(messageBody) {
    try {
      const command = new SendMessageCommand({
        QueueUrl: this.OcrSqsQueueUrl,
        MessageBody: JSON.stringify(messageBody),
      });

      const result = await this.sqsClient.send(command);
      
      console.log('✅ Message sent to SQS:', result.MessageId);

    } catch (error) {
      console.error('❌ Error sending message to SQS:', error);
      throw new Error(`Failed to send message to SQS: ${error.message}`);
    }
  }

}

// Tạo instance singleton
const awsService = new AwsService();

export default awsService;

