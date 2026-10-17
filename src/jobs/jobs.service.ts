import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateJobDto } from './dto/create-job.dto';
import { Job } from './job.entity';
import { QueueService } from './queue.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private readonly jobs: Repository<Job>,
    private readonly queue: QueueService,
  ) {}

  async create(dto: CreateJobDto): Promise<Job> {
    if (!dto.type?.trim()) throw new Error('type is required');
    const job = this.jobs.create({
      type: dto.type.trim(),
      payload: dto.payload ?? {},
      status: 'queued',
      attempts: 0,
      runAt: dto.runAt ? new Date(dto.runAt) : null,
      lastError: null,
    });
    const saved = await this.jobs.save(job);
    await this.queue.enqueue(saved.id);
    return saved;
  }

  list(): Promise<Job[]> {
    return this.jobs.find({ order: { createdAt: 'DESC' }, take: 100 });
  }

  async get(id: string): Promise<Job> {
    const job = await this.jobs.findOne({ where: { id } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  async cancel(id: string): Promise<Job> {
    const job = await this.get(id);
    if (job.status === 'running') throw new Error('Running jobs cannot be cancelled by this demo API');
    job.status = 'failed';
    job.lastError = 'Cancelled by API request';
    return this.jobs.save(job);
  }
}
