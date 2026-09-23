# Production Database Architecture & Data Dictionary

The platform uses a dedicated PostgreSQL schema (`jobs`) to store authoritative operational state. Google Sheets is strictly an optional human-readable export layer.

---

## 1. Schema Overview

The database contains 31 normalized tables organized into 8 functional domains:

```text
[Candidate & Resumes]
├── users
├── candidate_profiles
├── resumes
├── resume_versions
└── resume_profiles

[Search & Sources]
├── search_profiles
├── search_runs
├── search_run_sources
├── job_sources
└── source_health

[Jobs & Matching]
├── jobs
├── job_source_refs
└── job_matches

[Companies & Contacts]
├── companies
└── company_contacts

[Applications & Documents]
├── applications
├── application_documents
└── application_events

[Outreach & Email]
├── email_outbox
└── email_attempts

[Telegram & Integrations]
├── telegram_messages
├── telegram_callbacks
└── drive_folders

[System & Reliability]
├── scheduled_actions
├── webhook_events
├── workflow_runs
├── error_events
├── job_errors
├── job_runs
└── audit_logs
```

---

## 2. Table Dictionaries

### 2.1 Candidate & Resume Management
- `jobs.users`: System user identities, preferences, authentication references.
- `jobs.candidate_profiles`: Canonical profile parsed from the master resume (skills, experience bullets, education, projects).
- `jobs.resumes`: Original uploaded resume files (PDF/DOCX), metadata, drive references, and `is_master` flag. Master resumes are never mutated.
- `jobs.resume_versions`: Tailored resume versions generated for specific job postings. Tracks `base_resume_id`, `job_id`, `tailored_summary`, `tailored_skills`, AI provider, and Google Drive links.
- `jobs.resume_profiles`: Structured competencies, quantifiable achievements, and normalized skill ratings.

### 2.2 Search Profiles & Ingestion Runs
- `jobs.search_profiles`: Multi-faceted search criteria (roles, synonyms, must-have skills, excluded keywords, seniority, salary bounds, startup/MNC preferences, batch sizes).
- `jobs.search_runs`: Historical execution ledger for search batches. Records duration, items found, duplicates dropped, and match counts.
- `jobs.search_run_sources`: Per-source performance breakdown per search run (latency, items fetched, HTTP status).

### 2.3 Normalized Jobs & Multi-Signal Fingerprinting
- `jobs.jobs`: Core job opening repository.
  - Primary Key: `id` (INTEGER / SERIAL).
  - Unique Constraint: `fingerprint` (`company:normalized_title:location`).
  - Fields: `job_title`, `company_name`, `location`, `remote_type`, `salary_min`, `salary_max`, `description`, `application_url`, `skills`, `recruiter_email`, `email_confidence`, `status`, `application_status`.
- `jobs.job_source_refs`: Preserves multi-source provenance. When multiple job boards index the same job, this table retains links to each original source while maintaining one canonical row in `jobs.jobs`.
- `jobs.job_matches`: Structured output from the matching engine. Contains `match_score` (0-100), `title_alignment`, `required_skill_coverage`, `strengths`, `gaps`, and factual alignment evidence.

### 2.4 Companies & Recruiter Contacts
- `jobs.companies`: Company directory with metadata (`industry`, `company_size`, `is_startup`, `is_mnc`, `career_page_url`).
- `jobs.company_contacts`: Verified recruiter or hiring manager contacts with confidence ratings, discovery source, and email verification flags.

### 2.5 Applications & Status Machine
- `jobs.applications`: End-to-end application lifecycle tracking.
  - Valid Statuses: `DISCOVERED`, `MATCHED`, `SAVED`, `REVIEW`, `DOCUMENTS_PENDING`, `DOCUMENTS_READY`, `EMAIL_DRAFT`, `EMAIL_APPROVAL`, `EMAIL_SCHEDULED`, `EMAIL_SENT`, `APPLIED`, `APPLICATION_CONFIRMED`, `FOLLOW_UP_DUE`, `INTERVIEW`, `OFFER`, `REJECTED`, `WITHDRAWN`, `CLOSED`.
- `jobs.application_documents`: PDF and DOCX artifacts linked to applications (`RESUME_PDF`, `COVER_LETTER_PDF`).
- `jobs.application_events`: Audit timeline tracking every state progression, note, or follow-up action.

### 2.6 Email Outbox & Telegram Outbox
- `jobs.email_outbox`: Transactional outbox preventing accidental duplicate emails.
  - Valid Statuses: `PENDING`, `APPROVAL_REQUIRED`, `APPROVED`, `SCHEDULED`, `SENDING`, `SENT`, `FAILED`, `CANCELLED`.
- `jobs.email_attempts`: Delivery audit log capturing SMTP/Gmail response codes and error logs.
- `jobs.telegram_messages`: Logs Telegram alerts dispatched to the user.
- `jobs.telegram_callbacks`: Idempotency log for user inline button clicks (`job:{id}:view`, `resume`, `cover`, `apply`, `skip`).

### 2.7 Google Drive Cache & Observability
- `jobs.drive_folders`: Key-value cache (`logical_path` -> `drive_folder_id`). Prevents redundant Google Drive recursive folder searches.
- `jobs.source_health`: Source availability registry tracking latency, consecutive failures, and rate limit cooldowns.
- `jobs.error_events`: Dead Letter Queue (DLQ) logging error context, failed payloads, and resolution status.
- `jobs.audit_logs`: User and system action audit trail.

---

## 3. Indexing Strategy

Critical queries utilize composite B-tree indexes:
- `jobs.jobs(fingerprint)`: Fast deduplication check on ingestion.
- `jobs.jobs(posted_at DESC)`: Rapid chronological sorting on dashboard.
- `jobs.jobs(application_status)`: Kanban board filtering.
- `jobs.email_outbox(status, scheduled_send_time)`: High-efficiency queue polling.
- `jobs.drive_folders(logical_path)`: Instant folder ID resolution.
- `jobs.source_health(is_enabled, is_rate_limited)`: Immediate source eligibility checks.

---

## 4. Connection Pool Configuration

The Next.js BFF and API routes utilize `pg.Pool` with persistent pooling:
- Pool Size: Max 10 concurrent connections.
- Idle Timeout: 30,000 ms.
- Connection Timeout: 5,000 ms.
- Default Search Path: `jobs, public`.
