# Architecture & System Design
# Production Job Search & Application Automation Platform

## 1. High-Level Architecture Overview

The platform operates as a modern distributed multi-tier system combining Next.js 16 (App Router, BFF, SSR/Client UI, Server Actions), n8n Automation Engine (reusable sub-workflows, orchestrators, adapters), PostgreSQL 16 (authoritative transactional data store, state machine, JSONB document storage), and cloud providers (Google Drive, Gmail, Google Calendar, Telegram Bot API, AI providers).

```text
+-----------------------------------------------------------------------------------+
|                              Next.js 16 UI Layer                                  |
|  - Dashboard (/): Realtime metrics, funnel chart, source health, recent jobs      |
|  - Jobs (/jobs, /jobs/[id]): Filtering, ATS match analysis, document generation   |
|  - Search (/search, /search/profiles, /search/runs): Multi-mode orchestrator      |
|  - Resumes (/resumes, /resumes/[id], /resumes/[id]/versions): Master & tailored   |
|  - Applications (/applications, /applications/[id]): 18-stage Kanban board        |
|  - Emails (/emails, /emails/queue, /emails/scheduled): Outbox approval & schedule|
|  - Telegram (/telegram): Delivery logs, interactive callback dispatch             |
|  - Sources (/sources, /sources/[id]): 26-source registry & circuit breaker monitor|
|  - Settings & Health (/settings/*, /system-health, /logs): Config & live probes   |
+-----------------------------------------+-----------------------------------------+
                                          | HTTPS / Server Actions / BFF
                                          v
+-----------------------------------------------------------------------------------+
|                        Next.js Server API & BFF Layer                             |
|  - /api/search (orchestration trigger, CSV ingestion, manual URL parsing)         |
|  - /api/resumes (upload, PDF/DOCX text extraction, master resume versioning)      |
|  - /api/applications (Kanban state transitions, audit logging, follow-up events)  |
|  - /api/emails (outbox queuing, approval gate, scheduled execution, safety delay)  |
|  - /api/documents (ATS HTML->PDF/DOCX renderer, deterministic validation)        |
|  - /webhook/* (authenticated webhook ingress with idempotency keys & signatures)  |
+-----------------------------------------+-----------------------------------------+
                                          | HTTP / Internal Bridge
                                          v
+-----------------------------------------------------------------------------------+
|                        n8n Reusable Workflow Layer                                |
|  - WF-001..005: Orchestrators, Manual Webhook, CSV Ingestion, Hourly Trigger      |
|  - WF-010..022: Source Adapters (Greenhouse, Lever, Ashby, Adzuna, Remotive, etc.)|
|  - WF-030..036: Normalization, Deduplication, Filtering, Matcher & Resume Builder |
|  - WF-040..045: Recruiter Discovery, Draft Engine, Approval Gate, Outbox Sender  |
|  - WF-050..052: Telegram Single-Job Delivery, Callback & Approval Router          |
|  - WF-060..062: Google Drive Structure Organizer, Sheets Exporter, Calendar Events|
|  - WF-070..081: Application State Tracker, Follow-up Engine, DLQ Error Handler    |
+-----------------------------------------+-----------------------------------------+
                                          | SQL / API / Webhooks
        +------------------+--------------+-------------+------------------+
        |                  |                            |                  |
        v                  v                            v                  v
+---------------+  +---------------+            +---------------+  +---------------+
|  PostgreSQL   |  | Google Drive  |            |   Telegram    |  |  AI Provider  |
|  Authoritative|  | Hierarchical  |            |   Bot API     |  |  OpenRouter / |
|  Job & State  |  | Doc Storage & |            | One-by-One &  |  | Gemini /      |
|  Database     |  | Preview Links |            | Inline Actions|  | OpenAI Zod    |
+---------------+  +---------------+            +---------------+  +---------------+
```

## 2. Core Subsystems

### 2.1 Search Entry Modes
1. **UI Search**: Parameterized search triggered from the Next.js UI (`POST /api/search`).
2. **Hourly Scheduled Search**: Runs on an hourly cron (`0 * * * *`), querying active search profiles and eligible sources according to their refresh policies.
3. **CSV Bulk Import**: Ingests `.csv` files matching `examples/job-search.csv`, parsing rows into structured job queries and validating schemas.
4. **Webhook Search**: Secure ingress (`POST /webhook/job-search`) supporting external triggers with authentication and idempotency keys.
5. **Manual Job URL Ingestion**: Single job URL extraction respecting SSRF protections and domain allowlists.

### 2.2 Deduplication & Fingerprinting Engine
Jobs are uniquely identified using a deterministic SHA-256 fingerprint:
$$\text{fingerprint} = \text{SHA-256}(\text{company} + \text{normalized\_title} + \text{location} + \text{source\_id})$$
When duplicate jobs are encountered from multiple sources or subsequent runs, canonical job records are preserved and linked in `job_source_refs`.

### 2.3 ATS Match & Document Generation Engine
- **Deterministic Pre-filtering**: Disqualifies jobs missing hard requirements (locations, work modes, excluded keywords) prior to AI execution to conserve tokens.
- **AI Matching**: Evaluates candidate experience vs. job description, yielding numeric alignment scores and structured gap analyses without hallucinated experience.
- **Tailored Resume & Cover Letter Generation**: Generates ATS-optimized single-column formats with machine-readable metadata in PDF, DOCX, and HTML preview formats.

### 2.4 Safety-First Email Outbox Architecture
- Strict outbox pattern with statuses: `PENDING`, `APPROVAL_REQUIRED`, `APPROVED`, `SCHEDULED`, `SENDING`, `SENT`, `FAILED`.
- Enforces daily/hourly rate limits, minimum delays between messages, duplicate recipient checks, and cooldown intervals per company/job.
- Manual approval gating by default; never auto-sends without explicit user configuration.

### 2.5 Google Drive Hierarchical Storage
Organizes documents under `Job Search Assistant/`:
- `00_Profile/`: Master resumes and version history.
- `01_Job_Opening/YYYY/MM/DD/BATCH-xxxx/Company/Role/`: JDs, tailored resumes, cover letters, and email drafts.
- `02_Applications/`: Submitted application packages.
- `03_Scheduled_Email/`, `04_Followups/`, `05_Archive/`, `06_Errors/`.
- Folder IDs are cached in the PostgreSQL `drive_folders` table to eliminate repeated Drive API searches.
