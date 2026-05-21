import { Queue } from 'bullmq';
import { env } from '../lib/env.js';

export const IMPORT_QUEUE_NAME = 'process-import';

export const importQueue = new Queue<{ importJobId: string }>(IMPORT_QUEUE_NAME, {
  connection: { url: env.redisUrl },
});

export const queueService = {
  async enqueueProcessImport(importJobId: string) {
    await importQueue.add('process', { importJobId }, { removeOnComplete: 100, removeOnFail: 50 });
  },
};
