import { S3Client } from '@aws-sdk/client-s3';
import { resolveR2S3Endpoint } from './r2-endpoint.js';

let cached: S3Client | null = null;

export function getR2Client(): S3Client {
  if (cached) return cached;

  cached = new S3Client({
    region: 'auto',
    endpoint: resolveR2S3Endpoint(process.env.R2_ENDPOINT),
    forcePathStyle: true,
    credentials:
      process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
          }
        : undefined,
  });

  return cached;
}
