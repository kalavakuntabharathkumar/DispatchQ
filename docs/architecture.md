# DispatchQ architecture

## Components
- **NestJS REST API** accepts jobs, lists jobs, reads job status, and marks queued jobs cancelled.
- **PostgreSQL** is the persistent source of truth for job state and metadata.
- **Redis lists** provide a lightweight queue adapter (`dispatchq:queued`, `dispatchq:processing`).
- **Worker skeleton** claims queued IDs, updates the job lifecycle, and runs a placeholder handler.

## API
- `POST /jobs` — JSON: `{"type":"email.send","payload":{"to":"demo@example.com"}}`
- `GET /jobs` — latest 100 jobs
- `GET /jobs/:id` — one job
- `POST /jobs/:id/cancel` — mark a non-running job cancelled/failed

## Local setup
1. Copy `.env.example` to `.env`.
2. Run `docker compose up -d`.
3. Run `npm install`.
4. Run `npm run start:dev`.
5. Submit a job using the example in `examples/requests.http`.

## Important engineering limitations
This is a portfolio learning implementation, not a claim of the production metrics in the supplied resume text. `synchronize: true` is for local development only. The queue adapter is deliberately simple: it does not provide robust atomic retries, visibility timeouts, dead-letter queues, distributed leases, or exactly-once execution. For production, prefer BullMQ or a broker with durable acknowledgements, add schema migrations, validation, authentication, rate limits, observability, and idempotent handlers. The included worker handler is a placeholder.
