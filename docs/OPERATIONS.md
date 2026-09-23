# Operations, Monitoring & Runbook

## 1. Health Checks & Observability

### 1.1 Live Probes
- `GET /api/health`: Returns 200 OK if Next.js application, Postgres connection pool, and Redis connection are responsive.
- `GET /api/ready`: Verifies table availability and n8n webhook listener reachability.

```bash
# Query application health
curl -s http://127.0.0.1:3000/api/health | jq .
```

Expected output:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "n8n": "connected",
  "timestamp": "2026-09-23T08:00:00.000Z"
}
```

---

## 2. Common Operational Tasks

### 2.1 Triggering an Ad-Hoc Job Search Run
```bash
curl -X POST http://127.0.0.1:3000/api/trigger \
  -H "Content-Type: application/json" \
  -d '{"mode": "search", "batchSize": 25}'
```

### 2.2 Triggering Job Recovery for Undelivered Notifications
```bash
curl -X POST http://127.0.0.1:3000/api/trigger \
  -H "Content-Type: application/json" \
  -d '{"mode": "recovery"}'
```

### 2.3 Inspecting Recent Errors & Dead Letter Queue (DLQ)
```bash
docker exec -i postgresql-ktxhkuiuzp3gnwgrggc15ekz psql -U UZ2Dd4tp4eVRsS22 -d n8n -c \
  "SELECT id, error_type, message, source, timestamp FROM jobs.error_events ORDER BY timestamp DESC LIMIT 10;"
```

### 2.4 Unlocking Stalled Outbox Emails
If an email is stuck in `SENDING` due to a transient network timeout:
```bash
docker exec -i postgresql-ktxhkuiuzp3gnwgrggc15ekz psql -U UZ2Dd4tp4eVRsS22 -d n8n -c \
  "UPDATE jobs.email_outbox SET status = 'APPROVED' WHERE status = 'SENDING' AND updated_at < NOW() - INTERVAL '15 minutes';"
```

---

## 3. Incident Management & Recovery

### Scenario A: Rate Limit Encountered on Job Board (HTTP 429)
1. The source adapter flags the source as `RATE_LIMITED` in `jobs.source_health`.
2. Exponential backoff activates for the source (5s -> 15s -> 30s -> 60s).
3. The orchestrator continues processing remaining active sources without aborting.

### Scenario B: Telegram Rate Limiter / Flood Wait
1. If Telegram returns HTTP 429 with `retry_after`, the task waits the specified duration.
2. Unsent items remain in `jobs.jobs` with `telegram_sent = false` and are reprocessed during the next hourly recovery sweep.

### Scenario C: AI Provider Outage
1. If the primary provider (e.g. OpenRouter) returns 5xx or fails validation, the Next.js BFF automatically switches to the configured fallback model (`AI_FALLBACK_PROVIDER`).
2. If all providers fail, the job is saved with `match_status = 'PENDING'` for later automated evaluation.
