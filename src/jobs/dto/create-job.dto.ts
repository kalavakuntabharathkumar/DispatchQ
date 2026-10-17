export class CreateJobDto {
  type!: string;
  payload?: Record<string, unknown>;
  runAt?: string;
}
