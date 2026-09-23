-- Migration: 001_production_schema.sql
-- Description: Extends existing jobs schema with complete production tables:
-- Resumes, versions, applications, email outbox, drive folders, telegram events, source health, and audit logs.

CREATE SCHEMA IF NOT EXISTS jobs;

-- 1. Resumes & Profiles
CREATE TABLE IF NOT EXISTS jobs.candidate_profiles (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(64),
    location VARCHAR(255),
    headline VARCHAR(255),
    summary TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    experience JSONB DEFAULT '[]'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    links JSONB DEFAULT '{}'::jsonb,
    raw_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs.resumes (
    id VARCHAR(64) PRIMARY KEY,
    candidate_id VARCHAR(64) REFERENCES jobs.candidate_profiles(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    drive_file_id VARCHAR(128),
    drive_web_view_link TEXT,
    is_master BOOLEAN DEFAULT false,
    parsed_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs.resume_versions (
    id VARCHAR(64) PRIMARY KEY,
    base_resume_id VARCHAR(64) REFERENCES jobs.resumes(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs.jobs(id) ON DELETE CASCADE,
    version_label VARCHAR(128) NOT NULL,
    tailored_summary TEXT,
    tailored_skills JSONB DEFAULT '[]'::jsonb,
    tailored_experience JSONB DEFAULT '[]'::jsonb,
    html_content TEXT,
    pdf_drive_id VARCHAR(128),
    docx_drive_id VARCHAR(128),
    pdf_url TEXT,
    docx_url TEXT,
    ai_provider VARCHAR(64),
    ai_model VARCHAR(128),
    generation_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Applications & Status Machine
CREATE TABLE IF NOT EXISTS jobs.applications (
    id VARCHAR(64) PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs.jobs(id) ON DELETE CASCADE,
    resume_version_id VARCHAR(64) REFERENCES jobs.resume_versions(id) ON DELETE SET NULL,
    cover_letter_text TEXT,
    cover_letter_pdf_url TEXT,
    cover_letter_docx_url TEXT,
    drive_folder_id VARCHAR(128),
    drive_folder_url TEXT,
    status VARCHAR(64) NOT NULL DEFAULT 'DISCOVERED',
    applied_at TIMESTAMPTZ,
    next_follow_up_at TIMESTAMPTZ,
    follow_up_count INT DEFAULT 0,
    recruiter_name VARCHAR(255),
    recruiter_email VARCHAR(255),
    email_confidence NUMERIC(4,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_job_id ON jobs.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON jobs.applications(status);

CREATE TABLE IF NOT EXISTS jobs.application_events (
    id SERIAL PRIMARY KEY,
    application_id VARCHAR(64) NOT NULL REFERENCES jobs.applications(id) ON DELETE CASCADE,
    from_status VARCHAR(64),
    to_status VARCHAR(64) NOT NULL,
    event_trigger VARCHAR(64) NOT NULL, -- 'UI', 'TELEGRAM', 'WEBHOOK', 'SCHEDULE'
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Email Outbox & Scheduled Dispatch
CREATE TABLE IF NOT EXISTS jobs.email_outbox (
    id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64) REFERENCES jobs.applications(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs.jobs(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(512) NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'APPROVAL_REQUIRED', -- 'PENDING', 'APPROVAL_REQUIRED', 'APPROVED', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED'
    scheduled_send_time TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    attempt_count INT DEFAULT 0,
    last_error TEXT,
    idempotency_key VARCHAR(128) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_status ON jobs.email_outbox(status);
CREATE INDEX IF NOT EXISTS idx_email_outbox_send_time ON jobs.email_outbox(scheduled_send_time);

-- 4. Google Drive Folder Cache
CREATE TABLE IF NOT EXISTS jobs.drive_folders (
    logical_path VARCHAR(512) PRIMARY KEY,
    drive_folder_id VARCHAR(128) NOT NULL,
    parent_folder_id VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Source Health & Circuit Breaker Tracking
CREATE TABLE IF NOT EXISTS jobs.source_health (
    source_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    category VARCHAR(32) NOT NULL,
    integration_method VARCHAR(32) NOT NULL,
    refresh_policy VARCHAR(64) DEFAULT 'hourly',
    requires_credential BOOLEAN DEFAULT false,
    has_credential BOOLEAN DEFAULT true,
    last_successful_fetch TIMESTAMPTZ,
    last_failure TIMESTAMPTZ,
    last_http_status INT,
    last_error_message TEXT,
    jobs_found_total BIGINT DEFAULT 0,
    jobs_accepted_total BIGINT DEFAULT 0,
    avg_response_time_ms INT DEFAULT 0,
    is_rate_limited BOOLEAN DEFAULT false,
    rate_limited_until TIMESTAMPTZ,
    consecutive_failures INT DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Error & Audit Logs
CREATE TABLE IF NOT EXISTS jobs.error_events (
    id SERIAL PRIMARY KEY,
    workflow_name VARCHAR(128),
    execution_id VARCHAR(128),
    node_name VARCHAR(128),
    error_type VARCHAR(64),
    message TEXT NOT NULL,
    source VARCHAR(64),
    job_id INTEGER,
    payload JSONB,
    retry_count INT DEFAULT 0,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs.audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(128) NOT NULL,
    actor VARCHAR(64) DEFAULT 'system',
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure base jobs table has recruiter fields
ALTER TABLE jobs.jobs ADD COLUMN IF NOT EXISTS recruiter_name VARCHAR(255);
ALTER TABLE jobs.jobs ADD COLUMN IF NOT EXISTS recruiter_email VARCHAR(255);
ALTER TABLE jobs.jobs ADD COLUMN IF NOT EXISTS hiring_manager_name VARCHAR(255);
ALTER TABLE jobs.jobs ADD COLUMN IF NOT EXISTS hiring_manager_email VARCHAR(255);
ALTER TABLE jobs.jobs ADD COLUMN IF NOT EXISTS email_confidence NUMERIC(4,2);
ALTER TABLE jobs.jobs ADD COLUMN IF NOT EXISTS required_skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE jobs.jobs ADD COLUMN IF NOT EXISTS preferred_skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE jobs.jobs ADD COLUMN IF NOT EXISTS years_required INT;
ALTER TABLE jobs.jobs ADD COLUMN IF NOT EXISTS country VARCHAR(128);
ALTER TABLE jobs.jobs ADD COLUMN IF NOT EXISTS city VARCHAR(128);
