import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsModule } from './jobs/jobs.module';
import { Job } from './jobs/job.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL ?? 'postgres://dispatchq:dispatchq_dev@localhost:5432/dispatchq',
      entities: [Job],
      synchronize: true,
    }),
    JobsModule,
  ],
})
export class AppModule {}
