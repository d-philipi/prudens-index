import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../lib/env.js';
import { getR2Client } from '../lib/r2-client.js';

export const r2StorageService = {
  buildObjectKey(companyId: string, jobId: string, filename: string): string {
    return `imports/${companyId}/${jobId}/${filename}`;
  },

  async getPresignedPutUrl(objectKey: string, contentType: string): Promise<string> {
    const cmd = new PutObjectCommand({
      Bucket: env.r2Bucket,
      Key: objectKey,
      ContentType: contentType,
    });
    return getSignedUrl(getR2Client(), cmd, { expiresIn: 900 });
  },

  async getPresignedGetUrl(objectKey: string): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: env.r2Bucket, Key: objectKey });
    return getSignedUrl(getR2Client(), cmd, { expiresIn: 900 });
  },
};
