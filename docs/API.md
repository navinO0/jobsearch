# API & Webhook Specifications

This document outlines all public and internal BFF routes, webhooks, payloads, and idempotency guarantees.

## 1. REST Endpoints (Next.js BFF)

### 1.1 `GET /api/health`
Returns system component liveness.
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-09-23T07:45:00.000Z"
}
```

### 1.2 `POST /api/trigger`
Triggers search pipeline or recovery sweeps.
```json
{
  "mode": "search",
  "batchSize": 25,
  "profileName": "Senior Backend"
}
```

### 1.3 `POST /api/generate`
Generates tailored resumes, cover letters, and application packages on demand.
```json
{
  "jobId": 1973,
  "type": "package" // 'resume' | 'cover' | 'package' | 'email'
}
```

### 1.4 `GET /api/resumes` & `POST /api/resumes`
Manages master factual candidate profiles and resume version trees.

### 1.5 `GET /api/emails` & `POST /api/emails`
Outbox queue management with manual approval gates:
```json
{
  "id": "outbox_uuid_123",
  "action": "approve" // 'approve' | 'cancel' | 'schedule'
}
```

### 1.6 `GET /api/applications` & `POST /api/applications`
Manages 18-stage Kanban lifecycle transitions with audit events:
```json
{
  "applicationId": "app_uuid_123",
  "newStatus": "INTERVIEW",
  "trigger": "UI",
  "notes": "First round recruiter screen scheduled"
}
```

---

## 2. Ingress Webhooks (n8n & External Systems)

### 2.1 `POST /webhook/job-search`
**Headers**: `X-Webhook-Secret: <token>`, `Idempotency-Key: <uuid>`
```json
{
  "profileId": "default",
  "titles": ["Backend Engineer", "Node.js Developer"],
  "locations": ["Remote", "India"],
  "remoteType": ["REMOTE", "HYBRID"],
  "sources": ["all"],
  "batchSize": 15
}
```

### 2.2 `POST /webhook/telegram-callback`
Receives opaque Telegram button callback interactions:
```json
{
  "callback_query": {
    "id": "cb_12345",
    "data": "job:1973:resume",
    "from": { "id": 617149298 }
  }
}
```
Payload format: `job:{id}:{view|resume|cover|package|email|schedule|apply|skip}`. No PII or candidate tokens are transmitted in callback payloads.
