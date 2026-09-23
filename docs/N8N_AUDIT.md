# n8n Existing Workflow Audit & Decomposition Plan

## 1. Audit of Existing n8n Workflows

### 1.1 `jobSearchPipeline01.json`
- **Current Role**: Monolithic job search and processing workflow containing 41 nodes.
- **Trigger**: Schedule Trigger (Every 6h), Webhook Trigger, Manual Trigger.
- **Existing Sources**:
  - `Arbeitnow` (Working API, properly transformed).
  - `Jobicy` (Working API, dev tag).
  - `Greenhouse` (Hard-coded gitlab endpoint).
  - `Ashby` (Hard-coded ramp endpoint).
  - `Lever` (Hard-coded palantir endpoint).
  - `SmartRecruiters` (Hard-coded canva endpoint).
  - `RemoteOK` (Static RSS/JSON feed).
  - `LinkedIn India` (Fragile guest HTML regex scraper; prone to rate limiting and anti-bot blocks).
  - `Instahyre` (Internal endpoint; requires valid session/auth headers).
- **AI Matching**: OpenRouter LLM Chain using `deepseek/deepseek-v4-flash-0731:free` with custom scoring prompt.
- **Telegram Alerting**: Formats HTML message and dispatches via Telegram node.
- **Deficiencies Identified**:
  - Hard-coded employer paths for ATS providers.
  - Direct HTML scraping nodes that fail silently or get blocked.
  - Monolithic design: a single adapter failure or timeout risks interrupting subsequent batch operations.
  - No resume upload or dynamic candidate profile matching; hard-coded candidate assumptions.
  - Telegram messages lack interactive inline action buttons with opaque callback payloads.
  - No Google Drive folder creation, document generation, or email draft handling.

### 1.2 `jobRecoveryPipeline01.json`
- **Current Role**: Periodically scans `jobs.jobs` for `telegram_sent = FALSE` and attempts redelivery.
- **Trigger**: Schedule Trigger (Every 12h), Webhook, Manual Trigger.
- **Strengths**: Good Redis key rate limiting and retry handling.
- **Deficiencies**: Only recovers Telegram notifications; lacks recovery workflows for failed AI runs, document generation, and email deliveries.

---

## 2. Target Decomposed Sub-Workflow Architecture

Rather than executing a single 40+ node monolith, the system is partitioned into modular, independently testable sub-workflows:

| ID | Name | Type | Trigger / Entry | Purpose |
|---|---|---|---|---|
| **WF-001** | `Search Orchestrator` | Orchestrator | Webhook / Sub-workflow | Coordinates batch runs across enabled sources |
| **WF-002** | `Manual Search Webhook` | Ingress | `POST /webhook/job-search` | Validates payload, provisions run ID, dispatches to WF-001 |
| **WF-003** | `CSV Search Trigger` | Ingress | `POST /webhook/csv-search` | Ingests CSV rows, validates schema, converts to search tasks |
| **WF-004** | `Hourly Scheduled Search`| Ingress | Cron `0 * * * *` | Queries active profiles and triggers WF-001 |
| **WF-005** | `Job Source Router` | Router | Sub-workflow | Dynamically invokes specific source adapters based on policies |
| **WF-010** | `Google Jobs Adapter` | Source | Sub-workflow | SerpApi Google Jobs search integration |
| **WF-011** | `Adzuna Adapter` | Source | Sub-workflow | Adzuna job search API adapter |
| **WF-012** | `Jooble Adapter` | Source | Sub-workflow | Jooble API adapter |
| **WF-013..019** | ATS Adapters | Source | Sub-workflow | Greenhouse, Lever, Ashby, Workable, SmartRecruiters, Recruitee, Teamtailor |
| **WF-020..021** | Remote Adapters | Source | Sub-workflow | Himalayas, Remotive public APIs |
| **WF-030** | `Normalize Job` | Transform | Sub-workflow | Generates canonical job schema and deterministic fingerprint |
| **WF-031** | `Deduplicate Job` | Filter | Sub-workflow | Checks Postgres fingerprint, updates `job_source_refs` |
| **WF-032** | `Deterministic Filter` | Filter | Sub-workflow | Rejects excluded keywords, invalid locations, low salary |
| **WF-033** | `Match Resume` | AI Engine | Sub-workflow | Evaluates candidate resume vs job description with Zod output |
| **WF-034** | `Generate Tailored Resume`| Document | Sub-workflow | Generates ATS-optimized single-column HTML/PDF/DOCX |
| **WF-035** | `Generate Cover Letter` | Document | Sub-workflow | Generates targeted, non-hallucinated cover letter |
| **WF-040** | `Discover Recruiter Email`| Contact | Sub-workflow | Extracts verified HR email from JD, company careers or provider |
| **WF-041** | `Email Draft & Outbox` | Email | Sub-workflow | Creates pending outbox records with attachments |
| **WF-044** | `Scheduled Email Sender`| Email | Cron / Webhook | Safely delivers approved outbox emails with rate limit delays |
| **WF-050** | `Telegram Job Alert` | Alert | Sub-workflow | Dispatches rich card with inline callback action buttons |
| **WF-051** | `Telegram Callback Router`| Webhook | Webhook | Processes opaque button callbacks (`job:{id}:{action}`) |
| **WF-060** | `Google Drive Organizer`| Storage | Sub-workflow | Creates hierarchical batch folders and stores generated files |
| **WF-070** | `Application Tracker` | State | Sub-workflow | Transitions 18-stage status machine with event audit logs |
| **WF-072** | `Error & DLQ Monitor` | Monitoring | Error Trigger | Captures workflow failures into `error_events` and alerts |
