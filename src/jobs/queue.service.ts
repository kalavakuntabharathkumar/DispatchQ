import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Small Redis-backed queue adapter. The DB remains the source of truth.
 * This demo intentionally uses a simple list + processing list; production systems
 * should use a proven queue library or Lua scripts for atomic claim/recovery.
 */
@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private client?: Redis;

  async onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    try {
      await this.client.connect();
      this.logger.log('Connected to Redis');
    } catch (error) {
      this.logger.warn(`Redis unavailable; DB-backed job records still work: ${String(error)}`);
      this.client.disconnect();
      this.client = undefined;
    }
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }

  async enqueue(jobId: string): Promise<void> {
    if (this.client) await this.client.lpush('dispatchq:queued', jobId);
  }

  async dequeue(): Promise<string | null> {
    if (!this.client) return null;
    return this.client.rpoplpush('dispatchq:queued', 'dispatchq:processing');
  }

  async acknowledge(jobId: string): Promise<void> {
    if (this.client) await this.client.lrem('dispatchq:processing', 1, jobId);
  }
}
