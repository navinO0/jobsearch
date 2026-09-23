# n8n v2 Production Workflow Catalog & Operational Manual

This manual provides an exhaustive, node-by-node, input/output, and operational specification for all **43 production v2 workflows** powering the **Job Search & Application Automation Platform**.

All workflows are modular, standalone, testable, and adhere to strict JSON contracts.

---

## Table of Contents

1. [Orchestration & Ingestion Workflows (WF-001 - WF-005)](#1-orchestration--ingestion-workflows)
2. [Source Adapters (WF-010 - WF-022)](#2-source-adapters)
3. [Normalization, Deduplication & AI Matching (WF-030 - WF-036)](#3-normalization-deduplication--ai-matching)
4. [Recruiter Outreach & Guarded Email Outbox (WF-040 - WF-045)](#4-recruiter-outreach--guarded-email-outbox)
5. [Telegram Alerts & Interactive Callbacks (WF-050 - WF-052)](#5-telegram-alerts--interactive-callbacks)
6. [Google Workspace Integrations (WF-060 - WF-062)](#6-google-workspace-integrations)
7. [Status Lifecycle, Recovery & Maintenance (WF-070 - WF-081)](#7-status-lifecycle-recovery--maintenance)
8. [Import, Deployment & Credentials Setup](#8-import-deployment--credentials-setup)

---

## 1. Orchestration & Ingestion Workflows

### `WF-001_Search_Orchestrator.json`
- **Purpose**: Master orchestrator controlling the end-to-end ingestion, filtering, scoring, and notification pipeline.
- **Triggers**:
  - `Webhook`: Production endpoint `POST /webhook/job-search`.
  - `Schedule`: Hourly cron trigger (`0 * * * *`).
  - `Manual Trigger`: UI test execution button.
- **Inputs**:
  ```json
  {
    "profileId": "uuid-optional",
    "titles": ["Backend Engineer", "Full Stack Developer"],
    "locations": ["Remote", "Bengaluru", "Hyderabad"],
    "sources": ["all"],
    "batchSize": 25,
    "minScore": 70
  }
  ```
- **Execution Flow**:
  1. **Initialize Run**: Generates `run_id` (UUIDv4) and inserts record into `jobs.job_runs` with status `RUNNING`.
  2. **Fetch Resume**: Retrieves master candidate profile from `jobs.resumes` WHERE `is_default = true`.
  3. **Call Source Router**: Executes `WF-005_Job_Source_Router` via `Execute Sub-workflow`.
  4. **Normalize**: Pipes raw jobs through `WF-030_Normalize_Job`.
  5. **Deduplicate**: Pipes through `WF-031_Deduplicate_Job` to filter existing fingerprints.
  6. **Filter**: Applies hard criteria via `WF-032_Filter_Job`.
  7. **AI Match**: Scores remaining jobs with `WF-033_Match_Resume`.
  8. **Notify**: Routes jobs with `match_score >= minScore` to `WF-050_Telegram_Job_Notification`.
  9. **Finalize**: Updates `jobs.job_runs` with `completed_at`, `jobs_found`, `jobs_matched`, status `COMPLETED`.
- **Outputs**:
  ```json
  {
    "runId": "6b2a488f-6218-4721-a39c-e3661eb1bb5d",
    "status": "COMPLETED",
    "totalFound": 48,
    "totalProcessed": 48,
    "totalMatched": 14,
    "completedAt": "2026-09-23T09:30:00.000Z"
  }
  ```

---

### `WF-002_Manual_Search_Webhook.json`
- **Purpose**: Ingestion endpoint for ad-hoc UI search submissions and single job URL parsing.
- **Triggers**:
  - `Webhook`: `POST /webhook/manual-search`
  - `Webhook`: `POST /webhook/job-url`
- **Inputs**:
  - For query: `{ "query": "Staff Go Engineer", "location": "Remote" }`
  - For URL: `{ "url": "https://boards.greenhouse.io/example/jobs/12345" }`
- **Execution Flow**:
  - Validates request payload against Zod schema.
  - For single URLs: Performs SSRF-safe HTTP GET, extracts structured OpenGraph/JSON-LD metadata, and maps to canonical job.
  - Dispatches directly to `WF-030_Normalize_Job` and returns immediate HTTP 202 Accepted with job tracking ID.

---

### `WF-003_CSV_Search_Trigger.json`
- **Purpose**: Batch ingestion for uploaded CSV files containing job search criteria or job lists.
- **Triggers**:
  - `Webhook`: `POST /webhook/csv-search` (multipart/form-data or raw CSV text).
- **Execution Flow**:
  - Parses CSV rows using n8n `Spreadsheet File` node.
  - Validates required columns: `job_title`, `location`, `remote_type`, `min_salary`, `currency`.
  - Chunks items into configurable batches (default 10).
  - Invokes `WF-001_Search_Orchestrator` per batch to prevent memory spikes.

---

### `WF-004_Scheduled_Hourly_Search.json`
- **Purpose**: Autonomous background daemon executing incremental hourly searches.
- **Trigger**: Schedule cron: `0 * * * *` (Every 60 minutes).
- **Execution Flow**:
  - Queries `jobs.search_profiles` WHERE `is_active = true` AND `hourly_monitoring_enabled = true`.
  - Iterates over active search profiles using `Loop Over Items`.
  - Executes `WF-001_Search_Orchestrator` passing `profileId`.
  - Enforces incremental polling (`posted_within_days: 1`) to eliminate duplicate processing.

---

### `WF-005_Job_Source_Router.json`
- **Purpose**: Dynamic source dispatcher, load balancer, and circuit breaker.
- **Trigger**: Execute Sub-workflow Trigger.
- **Execution Flow**:
  - Queries `jobs.source_health` table.
  - Filters out sources where `is_enabled = false` or `consecutive_failures >= 3`.
  - Concurrently branches requests to enabled adapters (`WF-010` through `WF-022`) using n8n `Switch` / `Merge` nodes.
  - Aggregates all adapter outputs into a standardized array: `items[]`.
  - Returns unified raw array to `WF-001`.

---

## 2. Source Adapters

Every adapter accepts `{ "searchParams": { "titles": [...], "locations": [...] } }`, interacts with its respective upstream API/feed, and returns raw job items.

| Workflow ID | Source Name | Integration Type | Authentication | Key Endpoints / Notes |
|---|---|---|---|---|
| **WF-010** | **Google Jobs** | Search API | SerpApi Key | `https://serpapi.com/search.json?engine=google_jobs` |
| **WF-011** | **Adzuna** | Job Board API | App ID & App Key | `https://api.adzuna.com/v1/api/jobs/{country}/search/1` |
| **WF-012** | **Jooble** | Aggregator API | API Key | `https://jooble.org/api/{key}` |
| **WF-013** | **Greenhouse** | Public ATS API | None (Public Board Token) | `https://boards-api.greenhouse.io/v1/boards/{token}/jobs` |
| **WF-014** | **Lever** | Public ATS API | None (Public Board Token) | `https://api.lever.co/v0/postings/{company}?mode=json` |
| **WF-015** | **Ashby** | Public ATS API | None (Public Board Token) | `https://api.ashbyhq.com/posting-api/job-board/{company}` |
| **WF-016** | **Workable** | ATS Widget API | None (Public Account) | `https://apply.workable.com/api/v1/widget/accounts/{subdomain}` |
| **WF-017** | **SmartRecruiters**| Public ATS API | None (Company Identifier)| `https://api.smartrecruiters.com/v1/companies/{company}/postings` |
| **WF-018** | **Recruitee** | Public ATS API | None (Company Subdomain) | `https://{company}.recruitee.com/api/offers` |
| **WF-019** | **Teamtailor** | Partner / Public | API Key / Public Feed | `https://api.teamtailor.com/v1/jobs` |
| **WF-020** | **Himalayas** | Remote Board API | None (Public JSON) | `https://himalayas.app/jobs/api` |
| **WF-021** | **Remotive** | Remote Board API | None (Public JSON) | `https://remotive.com/api/remote-jobs` |
| **WF-022** | **Additional Adapters** | Fallback Aggregators | Optional Partner Keys | Arbeitnow (`/api/job-board-api`), Jobicy (`/api/v2/remote-jobs`), RemoteOK |

---

## 3. Normalization, Deduplication & AI Matching

### `WF-030_Normalize_Job.json`
- **Purpose**: Transforms diverse external payloads into the canonical schema.
- **Node Steps**:
  1. Strips dangerous HTML and tracking scripts from `description`.
  2. Normalizes `remote_type` to enum: `'REMOTE' | 'HYBRID' | 'ONSITE'`.
  3. Parses salary strings into numeric `min_salary`, `max_salary`, and ISO `currency`.
  4. Runs regex extraction for recruiter emails: `([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})`.
  5. Outputs canonical JSON object.

---

### `WF-031_Deduplicate_Job.json`
- **Purpose**: Prevents duplicate postings and cross-platform reposts.
- **Logic**:
  1. Computes `canonical_fingerprint`: SHA-256 of `(company + ":" + title + ":" + location).toLowerCase().trim()`.
  2. Computes `description_fingerprint`: SHA-256 of normalized alphanumeric text snippet.
  3. Queries `jobs.job_postings` WHERE `canonical_fingerprint = $1 OR description_fingerprint = $2`.
  4. If match exists: Updates `last_seen_at = NOW()` and discards item.
  5. If new: Inserts into `jobs.job_postings` with status `DISCOVERED`.

---

### `WF-032_Filter_Job.json`
- **Purpose**: Deterministic criteria check before invoking LLMs.
- **Evaluates**:
  - Excluded keywords (e.g., `["PHP", "WordPress", "Junior"]`).
  - Minimum salary requirement.
  - Maximum posting age (e.g., `< 7 days`).
  - Work authorization / visa sponsorship compatibility.
- **Outcome**: Matches proceed to AI evaluation; non-matches logged with status `FILTERED`.

---

### `WF-033_Match_Resume.json`
- **Purpose**: Evaluates candidate qualification and alignment using AI.
- **Model**: OpenRouter / Anthropic Claude 3.5 Sonnet / DeepSeek V3.
- **Prompt Specification**:
  - Enforces strict factual truthfulness.
  - Compares candidate skills, years of experience, and domain achievements against the job description.
- **Output Schema**:
  ```json
  {
    "match_score": 85,
    "must_have_coverage": 90,
    "recommendation": "APPLY",
    "key_strengths": ["Strong Node.js & Next.js background", "PostgreSQL database optimization"],
    "skill_gaps": ["Kafka experience preferred but not mandatory"],
    "matching_skills": ["TypeScript", "Docker", "PostgreSQL", "n8n"]
  }
  ```
- **Database**: Upserts result into `jobs.job_matches`.

---

### `WF-034_Generate_Tailored_Resume.json`
- **Purpose**: Generates an ATS-tailored resume based exclusively on factual candidate experience.
- **Strict Constraint**: Zero hallucination. Does not fabricate employers, job titles, employment dates, or unverified skills. Re-orders sections and emphasizes proven accomplishments relevant to target keywords.

---

### `WF-035_Generate_Cover_Letter.json`
- **Purpose**: Creates a concise, professional, role-specific cover letter.
- **Output**: 3-paragraph letter:
  1. Direct hook stating interest and matching core role requirements.
  2. Concrete demonstration of past achievements aligning with role challenges.
  3. Professional call to action.

---

### `WF-036_Generate_Application_Package.json`
- **Purpose**: Bundles tailored resume, cover letter, and Google Drive upload into a complete application package.
- **Flow**:
  1. Invokes `WF-034` (Resume).
  2. Invokes `WF-035` (Cover Letter).
  3. Invokes `WF-060` (Google Drive Organizer).
  4. Inserts record into `jobs.applications` with status `DOCUMENTS_READY`.

---

## 4. Recruiter Outreach & Guarded Email Outbox

### `WF-040_Discover_Recruiter_Email.json`
- Discovers publicly published recruiter or hiring team contact emails.
- Validates syntax, domain DNS, and eliminates generic `noreply@` or `support@` addresses.
- Updates `jobs.job_postings.recruiter_email`.

### `WF-041_Email_Draft.json`
- Creates application email draft in `jobs.email_queue`.
- Status set to `NEEDS_APPROVAL`.
- Attaches Google Drive preview links for tailored resume and cover letter.

### `WF-042_Email_Approval.json`
- Receives approval from Next.js UI or Telegram.
- Transitions queue record from `NEEDS_APPROVAL` to `SCHEDULED`.

### `WF-043_Email_Queue.json`
- In-memory/database rate-limiting buffer ensuring strict pacing.

### `WF-044_Scheduled_Email_Sender.json`
- Cron-driven dispatcher running every 15 minutes.
- Enforces caps: **Max 5 emails/hour**, **Max 20 emails/day**, **48-hour cooldown** per employer.
- Calls `WF-045_Email_Delivery_Logging`.

### `WF-045_Email_Delivery_Logging.json`
- Dispatches outgoing message via Gmail API or SMTP.
- Records `message_id`, `recipient`, `sent_at`, and status in `jobs.email_logs`.
- Updates application status to `EMAIL_SENT`.

---

## 5. Telegram Alerts & Interactive Callbacks

### `WF-050_Telegram_Job_Notification.json`
- **Trigger**: Sub-workflow call from `WF-001`.
- **Logic**: Formats rich markdown card and sends to `TELEGRAM_CHAT_ID`.
- **Keyboard Layout**:
  - Row 1: `[✨ Tailor Resume]` | `[📧 Draft Email]` *(only if email exists)*
  - Row 2: `[🌐 View Job Posting]` | `[❌ Dismiss]`
- **Opaque Callback Format**: `job:{uuid}:{action}`

---

### `WF-051_Telegram_Callback_Handler.json`
- **Trigger**: Webhook `POST /webhook/telegram-callback`.
- **Logic**:
  1. Verifies caller `from.id == TELEGRAM_CHAT_ID`.
  2. Parses callback data payload.
  3. Answers callback query immediately via Telegram API to stop client loading state.
  4. Invokes `WF-052_Telegram_Approval_Handler`.

---

### `WF-052_Telegram_Approval_Handler.json`
- Dispatches user action:
  - `tailor` → Triggers `WF-036`.
  - `draft_email` → Triggers `WF-041`.
  - `send_email` → Approves `WF-042`.
  - `dismiss` → Marks job `REJECTED`.
- Sends confirmation reply back to Telegram.

---

## 6. Google Workspace Integrations

### `WF-060_Google_Drive_Organizer.json`
- Hierarchical folder creator: `/Job Applications/YYYY/Company_JobTitle/`.
- Queries `jobs.drive_folders` first to reuse existing folder IDs and avoid recursive Drive API lookups.
- Uploads tailored resume and cover letter documents.
- Sets file permissions and returns web view links.

### `WF-061_Google_Sheets_Tracker.json`
- Appends new applications as rows to candidate tracking spreadsheet.

### `WF-062_Google_Calendar_Scheduler.json`
- Schedules interview rounds or follow-up milestones in Google Calendar.

---

## 7. Status Lifecycle, Recovery & Maintenance

### `WF-070_Application_Status_Tracker.json`
- State machine validator ensuring valid progression:
  ```text
  DISCOVERED ──► MATCHED ──► DOCUMENTS_READY ──► EMAIL_DRAFT ──► EMAIL_SENT ──► APPLIED ──► INTERVIEWING ──► OFFERED / REJECTED
  ```

### `WF-071_Followup_Reminder.json`
- Hourly scan checking for applications in `APPLIED` status for >= 5 days without response.
- Sends Telegram notification prompting follow-up email dispatch.

### `WF-072_Error_Handler.json`
- Global error trigger capturing node failure context, stack traces, and workflow IDs.
- Logs incidents to `workflows.workflow_errors`.

### `WF-073_Retry_DLQ_Handler.json`
- Dead Letter Queue executing exponential backoff retries (1m, 5m, 15m) for transient network timeouts.

### `WF-080_Cleanup_Retention.json`
- Weekly maintenance removing ephemeral logs older than 90 days.

### `WF-081_Source_Health_Monitor.json`
- Hourly ping checking response times and status codes of all source adapters.
- Updates `jobs.source_health` table.

---

## 8. Import, Deployment & Credentials Setup

### One-Command CLI Import into n8n Container
```bash
docker cp /home/naveen/n8n-workflows/job-search/v2/all_v2_workflows.json n8n-ktxhkuiuzp3gnwgrggc15ekz:/tmp/all_v2_workflows.json
docker exec -u node n8n-ktxhkuiuzp3gnwgrggc15ekz n8n import:workflow --input=/tmp/all_v2_workflows.json
```

### Credentials Required in n8n

| Credential Name in n8n | Associated Node | Purpose |
|---|---|---|
| `postgres_jobs_db` | Postgres | Reading/writing jobs, runs, matches, and outbox tables |
| `openrouter_ai` / `anthropic_ai` | AI / HTTP Request | Scoring, resume tailoring, cover letter generation |
| `telegram_bot` | Telegram | Sequential alert delivery and callback management |
| `google_drive_oauth` | Google Drive | Application folder organization and file storage |
| `gmail_oauth` / `smtp_creds` | Gmail / Email | Transactional application email delivery |
| `serpapi_creds` | HTTP Request | Google Jobs search provider adapter (`WF-010`) |
| `adzuna_creds` | HTTP Request | Adzuna job search API adapter (`WF-011`) |
| `jooble_creds` | HTTP Request | Jooble job search API adapter (`WF-012`) |
