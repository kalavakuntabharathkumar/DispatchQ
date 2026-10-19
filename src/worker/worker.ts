/**
 * Standalone worker loop. Run after building with:
 * node -e "require('./dist/worker/worker').runWorker()"
 * This is a teaching skeleton, not a production-safe distributed worker:
 * see docs/architecture.md for lease/retry/idempotency limitations.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';

export async function runWorker() {
  const db = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL ?? 'postgres://dispatchq:dispatchq_dev@localhost:5432/dispatchq',
    entities: [__dirname + '/../jobs/*.entity.js'],
    synchronize: true,
  });
  await db.initialize();
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  const repo = db.getRepository('Job');

  while (true) {
    const id = await redis.rpoplpush('dispatchq:queued', 'dispatchq:processing');
    if (!id) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      continue;
    }
    try {
      const job: any = await repo.findOneBy({ id });
      if (!job || job.status !== 'queued') {
        await redis.lrem('dispatchq:processing', 1, id);
        continue;
      }
      await repo.update({ id }, { status: 'running', attempts: job.attempts + 1 });
      // Replace this placeholder with a registered, idempotent job handler.
      await new Promise((resolve) => setTimeout(resolve, 100));
      await repo.update({ id }, { status: 'completed', lastError: null });
    } catch (error) {
      await repo.update({ id }, { status: 'failed', lastError: String(error) });
    } finally {
      await redis.lrem('dispatchq:processing', 1, id);
    }
  }
}
