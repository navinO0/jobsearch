# n8n v2 Workflow Execution Lifecycle & Step Guide

This document describes the end-to-end lifecycle and execution steps of the **Job Search & Application Automation Platform (v2)** workflows in n8n.

---

## Architecture Overview

```text
[Search Triggers]
   | (UI / Webhook / Schedule / CSV)
   v
[WF-001: Search Orchestrator]
   |
   +--> [WF-005: Job Source Router]
   |       |--> [WF-010 to WF-022: Source Adapters (Google, Adzuna, Greenhouse...)]
   |
   +--> [WF-030: Normalize Job]
   +--> [WF-031: Deduplicate Job]
   +--> [WF-032: Filter Job]
   +--> [WF-033: Match Resume (AI Scoring)]
   |
   +--> [WF-050: Telegram Notifications] (score >= 70%)
           |
           +--> [WF-051: Callback Handler] (User clicks Tailor / Apply / Reject)
                   |
                   +--> [WF-036: Generate Application Package]
                   |       |--> [WF-034: Generate Tailored Resume]
                   |       |--> [WF-035: Generate Cover Letter]
                   |       +--> [WF-060: Google Drive Organizer]
                   |
                   +--> [WF-040: Discover Recruiter Email]
                   +--> [WF-041: Email Draft Outbox]
                   +--> [WF-042/045: Guarded Approval & Email Send]
                   +--> [WF-070: Status Tracker] (NEW -> APPLIED -> INTERVIEWING)
```

---

## Step-by-Step Execution Guide

### Phase 1: Search Trigger & Ingestion

1. **Trigger Reception**:
   - **UI / Webhook** (`WF-002`): User clicks **Run Search** in Next.js UI or sends `POST /webhook/job-search`.
   - **Hourly Schedule** (`WF-004`): Runs every 60 minutes, querying `jobs.search_profiles` for active profiles with `hourly_monitoring_enabled = true`.
   - **Bulk CSV Upload** (`WF-003`): UI uploads a `.csv` file via `POST /webhook/csv-search`.
   - **Direct URL Parse** (`WF-002`): User pastes a single posting URL via `POST /webhook/job-url`.

2. **Run Initialization (`WF-001`)**:
   - Creates a unique `run_id` (UUID).
   - Inserts run metadata into `jobs.job_runs` with status `RUNNING`.
   - Loads candidate resume profile from `jobs.resumes`.

---

### Phase 2: Source Aggregation & Circuit Breaking

3. **Source Dispatching (`WF-005`)**:
   - Queries `jobs.source_health` table to identify enabled adapters.
   - Circuit breaker skips any API currently experiencing rate limits (`consecutive_failures > 3`).
   - Concurrently invokes source adapters (`WF-010` through `WF-022`):
     - **Aggregators**: `WF-010` Google Jobs (SerpApi), `WF-011` Adzuna, `WF-012` Jooble.
     - **Direct ATS Boards**: `WF-013` Greenhouse, `WF-014` Lever, `WF-015` Ashby, `WF-016` Workable, `WF-017` SmartRecruiters, `WF-018` Recruitee, `WF-019` Teamtailor.
     - **Remote Boards**: `WF-020` Himalayas, `WF-021` Remotive, `WF-022` Arbeitnow / Jobicy.
   - Merges raw results into a unified item list.

---

### Phase 3: Normalization, Deduplication & Deterministic Filtering

4. **Schema Normalization (`WF-030`)**:
   - Transforms heterogeneous payloads into canonical `NormalizedJob` format.
   - Cleans HTML markup from job descriptions.
   - Extracts salary ranges, remote status (`REMOTE`, `HYBRID`, `ONSITE`), and required experience.
   - Scans text with regex to identify un-obfuscated recruiter emails.

5. **Composite Deduplication (`WF-031`)**:
   - Computes dual SHA-256 fingerprints:
     - `canonical_fingerprint`: Hash of normalized company name + normalized job title + location.
     - `description_fingerprint`: Hash of core text snippet to catch cross-posted duplicates.
   - Queries `jobs.job_postings` in PostgreSQL. Discards already-processed duplicates while updating `last_seen_at`.

6. **Deterministic Filtering (`WF-032`)**:
   - Enforces user search profile criteria:
     - Must-have vs. excluded keywords.
     - Salary thresholds.
     - Location and visa sponsorship restrictions.
     - Maximum posting age (e.g., posted within last 7 days).
   - Non-matching jobs are logged as `FILTERED` and excluded from AI processing.

---

### Phase 4: AI Resume Matching & Scoring

7. **Resume Alignment Evaluation (`WF-033`)**:
   - Evaluates the job description against candidate's master resume using OpenRouter / Claude / DeepSeek.
   - Produces structured output:
     - `match_score` (0 to 100).
     - `must_have_coverage` (percentage of critical skills satisfied).
     - `key_strengths` and `skill_gaps`.
     - `recommendation` (`APPLY`, `CONSIDER`, `SKIP`).
   - Persists scores into `jobs.job_matches`.

---

### Phase 5: Notification & Interactive Actions

8. **Telegram Job Notification (`WF-050`)**:
   - Dispatches qualified openings (`match_score >= 70`) to candidate's Telegram chat.
   - Formats a compact card: Title, Company, Location, Salary, Match Score, Strengths, Application URL.
   - Appends Telegram Inline Keyboard buttons:
     - `[✨ Tailor Resume]`
     - `[📧 Draft Email]` *(only if recruiter email exists)*
     - `[🌐 View Job Posting]`
     - `[❌ Dismiss]`

9. **Telegram Callback Handling (`WF-051` & `WF-052`)**:
   - When candidate taps an inline button in Telegram, the callback webhook receives the event.
   - Answers Telegram callback immediately to dismiss loading spinners.
   - Routes action:
     - `tailor` → Invokes `WF-036` (Application Package).
     - `draft_email` → Invokes `WF-041` (Email Draft).
     - `dismiss` → Updates status to `REJECTED` in `jobs.job_postings`.

---

### Phase 6: Document Generation & Storage

10. **Application Package Generation (`WF-036`)**:
    - Calls `WF-034` (Generate Tailored Resume): Emphasizes matching candidate experience while preserving 100% factual truthfulness.
    - Calls `WF-035` (Generate Cover Letter): Generates a personalized cover letter highlighting relevant achievements.
    - Calls `WF-060` (Google Drive Organizer):
      - Creates dedicated folder: `/Job Applications/YYYY/Company_JobTitle/`.
      - Saves Resume & Cover Letter as Google Docs / PDF.
      - Returns preview links stored in `jobs.applications`.

---

### Phase 7: Recruiter Email Outbox & Guarded Delivery

11. **Recruiter Email Discovery (`WF-040`)**:
    - Discovers verified recruiter or HR inbox addresses.
    - Stores discovered address in `jobs.job_postings.recruiter_email`.

12. **Draft Email Outbox (`WF-041`)**:
    - Drafts a contextual application email with attached resume and cover letter links.
    - Inserts email into `jobs.email_queue` with status `NEEDS_APPROVAL`.

13. **Human Approval & Scheduled Dispatch (`WF-042`, `WF-044`, `WF-045`)**:
    - **Approval Gate**: Emails remain queued until user clicks **Approve** in the Next.js UI or Telegram.
    - **Rate Limiting**: `WF-044` respects hourly (max 5) and daily (max 20) sending limits.
    - **Delivery**: Dispatches through Gmail / SMTP and logs delivery status in `jobs.email_logs`.

---

### Phase 8: Status Tracking & Health Monitoring

14. **Application State Machine (`WF-070`)**:
    - Tracks progression: `DISCOVERED` → `MATCHED` → `PACKAGE_GENERATED` → `APPLIED` → `INTERVIEWING` → `OFFERED` / `REJECTED`.
    - `WF-071` schedules follow-up reminders 5 days post-application.

15. **Error & Health Monitor (`WF-072`, `WF-073`, `WF-081`)**:
    - `WF-072`: Catches failed sub-workflow nodes, logs to `workflows.workflow_errors`.
    - `WF-073`: Retries transient network failures using exponential backoff (Dead Letter Queue).
    - `WF-081`: Hourly health pings to all source adapters, updating `jobs.source_health`.
