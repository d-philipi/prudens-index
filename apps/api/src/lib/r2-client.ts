import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';
import { resolveR2S3Endpoint } from './r2-endpoint.js';

let cached: S3Client | null = null;

export function getR2Client(): S3Client {
  if (cached) return cached;

  const endpoint = resolveR2S3Endpoint(env.r2Endpoint);
  cached = new S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: true,
    credentials:
      env.r2AccessKeyId && env.r2SecretAccessKey
        ? { accessKeyId: env.r2AccessKeyId, secretAccessKey: env.r2SecretAccessKey }
        : undefined,
  });

  return cached;
}
