# n8n Production Workflow Catalog (WF-001 to WF-081)

This catalog details the modular, reusable n8n workflow architecture for the production Job Search & Application Automation platform. Monolithic pipelines have been replaced with independent, testable sub-workflows communicating via standardized JSON contracts.

---

## 1. Orchestration & Ingestion Workflows (`n8n/workflows/`)

### `WF-001_Search_Orchestrator.json`
- **Role**: Master pipeline orchestrator.
- **Triggers**: Webhook Trigger (`POST /webhook/job-search`), Hourly Schedule Trigger (1h interval), Manual Trigger.
- **Data Flow**:
  1. Initializes execution parameters (`run_id`, `profile_id`, `batch_size`).
  2. Records execution start in `jobs.job_runs`.
  3. Executes `WF-005_Job_Source_Router` to poll eligible sources.
  4. Chains through `WF-030` (Normalization), `WF-031` (Deduplication), and `WF-032` (Deterministic Filter).
  5. Evaluates candidate alignment via `WF-033` (Resume Matcher).
  6. Dispatches eligible openings (score >= 70%) to `WF-050` (Telegram Notifications).
  7. Finalizes run metadata and counters in `jobs.job_runs`.

### `WF-002_Manual_Search_Webhook.json`
- **Role**: On-demand webhooks for UI search queries and single job URL parsing.
- **Endpoints**: `POST /webhook/manual-search` and `POST /webhook/job-url`.
- **Logic**: Inspects whether input is an ad-hoc keyword search or a single URL. For URLs, fetches content securely with SSRF safeguards, extracts posting data, and dispatches to matcher.

### `WF-003_CSV_Search_Trigger.json`
- **Role**: Bulk CSV ingestion trigger.
- **Endpoint**: `POST /webhook/csv-search`.
- **Logic**: Parses tabular rows (`profile_name`, `job_title`, `keywords`, `location`, `remote_type`, `employment_type`, `min_salary`, `currency`), loops in configurable batches (default 5), and triggers the search orchestrator.

### `WF-004_Scheduled_Hourly_Search.json`
- **Role**: Autonomous hourly polling.
- **Trigger**: Schedule cron (every 60 minutes).
- **Logic**: Queries `jobs.search_profiles` for profiles with `is_active = true` and `hourly_monitoring_enabled = true`. Runs incremental deduplicated searches without re-processing previously evaluated jobs.

### `WF-005_Job_Source_Router.json`
- **Role**: Dynamic source dispatcher and circuit breaker.
- **Trigger**: Sub-workflow call from `WF-001`.
- **Logic**: Queries `jobs.source_health` to verify which sources are enabled and not currently rate-limited. Concurrently calls individual adapters (`WF-010` through `WF-022`) and merges payloads.

---

## 2. Source Adapters (`n8n/subworkflows/WF-010` to `WF-022`)

| ID | Workflow File | Target Source | Type | Rate Policy | Notes |
|---|---|---|---|---|---|
| WF-010 | `WF-010_Google_Jobs.json` | Google Jobs | Search Provider (SerpApi) | Quota-aware | Search provider API; avoids deprecated CSE |
| WF-011 | `WF-011_Adzuna.json` | Adzuna | Job Board API | Hourly | App ID & Key authenticated |
| WF-012 | `WF-012_Jooble.json` | Jooble | Aggregator API | Hourly | API key required |
| WF-013 | `WF-013_Greenhouse.json` | Greenhouse | ATS Public Board API | Hourly | Public employer board endpoints |
| WF-014 | `WF-014_Lever.json` | Lever | ATS Public Postings | Hourly | Official Lever JSON endpoint |
| WF-015 | `WF-015_Ashby.json` | Ashby | ATS Posting API | Hourly | Public Ashby job board feed |
| WF-016 | `WF-016_Workable.json` | Workable | ATS Widget Feed | Hourly | Official widget endpoint |
| WF-017 | `WF-017_SmartRecruiters.json` | SmartRecruiters | ATS Public Postings | Hourly | Company postings API |
| WF-018 | `WF-018_Recruitee.json` | Recruitee | ATS Offers API | Hourly | Public career endpoint |
| WF-019 | `WF-019_Teamtailor.json` | Teamtailor | ATS Careers API | Hourly | Partner/public feed |
| WF-020 | `WF-020_Himalayas.json` | Himalayas | Remote Aggregator | Hourly | Clean public JSON API |
| WF-021 | `WF-021_Remotive.json` | Remotive | Remote Aggregator | Hourly | Public remote jobs API |
| WF-022 | `WF-022_Additional_Source_Adapters.json` | Arbeitnow, Jobicy, RemoteOK | Aggregators / Manual Feeds | Hourly / Partner | Graceful fallback for portals requiring partner access |

---

## 3. Normalization, Deduplication & AI Matching (`WF-030` to `WF-036`)

### `WF-030_Normalize_Job.json`
- Maps heterogeneous raw payloads into the canonical `NormalizedJob` schema.
- Extracts technical keywords, normalizes job titles, and performs regex discovery of un-obfuscated recruiter emails.

### `WF-031_Deduplicate_Job.json`
- Generates composite multi-signal fingerprints:
  `fingerprint = md5(company:normalized_title:location)`.
- Performs upsert into `jobs.jobs` and `jobs.job_source_refs`. Tracks `first_seen_at`, `last_seen_at`, and deduplication counts.

### `WF-032_Filter_Job.json`
- Deterministic disqualification: eliminates jobs violating minimum experience, excluded keywords (e.g. clearance, unpaid), or ineligible remote/visa constraints before invoking expensive AI tokens.

### `WF-033_Match_Resume.json`
- Compares candidate master profile against job description.
- Evaluates required skill coverage, preferred skill coverage, and title alignment.
- Outputs structured match score (0-100), key strengths, gaps, and recommendation. Never invents skills not present in resume.

### `WF-034_Generate_Tailored_Resume.json`
- Tailors candidate resume specifically for the selected job.
- **Safety Directive**: Uses uploaded master resume as absolute source of truth. Re-orders and emphasizes actual accomplishments without fabricating employers, dates, or skills.
- Persists record into `jobs.resume_versions`.

### `WF-035_Generate_Cover_Letter.json`
- Creates tailored, professional cover letters referencing candidate's verified background and role requirements.
- Eliminates generic boilerplate and avoids AI hallucinations.

### `WF-036_Generate_Application_Package.json`
- Assembles tailored resume and cover letter, triggers PDF/DOCX rendering, and initiates Google Drive upload.

---

## 4. Email Pipeline & Outreach Safeguards (`WF-040` to `WF-045`)

### `WF-040_Discover_Recruiter_Email.json`
- Discovers publicly available HR/recruiter emails with source attribution (`JOB_POSTING`, `CAREERS_PAGE`, `VERIFIED_CONTACT`). Never guesses email permutations.

### `WF-041_Email_Draft.json`
- Prepares tailored email subject and body adhering to job posting instructions. Sets status to `APPROVAL_REQUIRED`.

### `WF-042_Email_Approval.json`
- Webhook (`POST /webhook/email-approval`) updating status to `APPROVED`.

### `WF-043_Email_Queue.json`
- Outbox manager checking rate limits (max 5/hr, max 20/day) and cooldown timers before sending.

### `WF-044_Scheduled_Email_Sender.json`
- Dispatches approved emails via Gmail API or SMTP node.

### `WF-045_Email_Delivery_Logging.json`
- Records send attempts in `jobs.email_attempts` and transitions application state to `EMAIL_SENT`.

---

## 5. Telegram Integration (`WF-050` to `WF-052`)

### `WF-050_Telegram_Job_Notification.json`
- Formats rich HTML alerts sent one-by-one with match score, highlights, and opaque callback buttons (`job:{id}:view`, `resume`, `cover`, `package`, `apply`, `skip`).

### `WF-051_Telegram_Callback_Handler.json`
- Handles user button clicks idempotently without exposing sensitive user tokens in callback data.

### `WF-052_Telegram_Approval_Handler.json`
- Enables one-tap email approval directly from Telegram chat.

---

## 6. Google Services & Storage (`WF-060` to `WF-062`)

### `WF-060_Google_Drive_Organizer.json`
- Caches and manages folder structures (`Job Search Assistant/01_Job_Opening/YYYY/MM/DD/...`) in `jobs.drive_folders` to prevent redundant API queries.

### `WF-061_Google_Sheets_Tracker.json`
- Exports matched jobs and application logs to Google Sheets for human review and offline analysis.

### `WF-062_Google_Calendar_Scheduler.json`
- Schedules follow-up reminders (3, 7, 14 days) and interview milestones in Google Calendar.

---

## 7. Status Machine, Health & DLQ (`WF-070` to `WF-081`)

### `WF-070_Application_Status_Tracker.json`
- Manages formal state transitions across the 18 application stages.

### `WF-071_Followup_Reminder.json`
- Daily scheduler checking applications in `APPLIED` status whose `next_follow_up_at` has elapsed.

### `WF-072_Error_Handler.json`
- Captures workflow failures via `n8n-nodes-base.errorTrigger`, writes to `jobs.error_events`, and sends alerts to Telegram.

### `WF-073_Retry_DLQ_Handler.json`
- Implements exponential backoff retries for transient errors (429, 503, network timeouts).

### `WF-080_Cleanup_Retention.json`
- Weekly maintenance workflow purging expired error logs and temporary records older than retention policies.

### `WF-081_Source_Health_Monitor.json`
- Pings configured sources every 2 hours to measure latency, update success rates, and trip circuit breakers on failing adapters.
