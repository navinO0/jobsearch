-- Migration: 002_complete_normalized_schema.sql
-- Description: Complete production schema ensuring all 28 tables from Specification Section 30 exist
-- with explicit foreign keys, indexes, and constraints.

CREATE SCHEMA IF NOT EXISTS jobs;

-- 1. Users & Profiles
CREATE TABLE IF NOT EXISTS jobs.users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(64) NOT NULL DEFAULT 'CANDIDATE',
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs.resume_profiles (
    id VARCHAR(64) PRIMARY KEY,
    resume_id VARCHAR(64) REFERENCES jobs.resumes(id) ON DELETE CASCADE,
    candidate_id VARCHAR(64) REFERENCES jobs.candidate_profiles(id) ON DELETE CASCADE,
    structured_headline VARCHAR(255),
    total_years_experience NUMERIC(4, 1),
    core_competencies JSONB DEFAULT '[]'::jsonb,
    soft_skills JSONB DEFAULT '[]'::jsonb,
    domain_knowledge JSONB DEFAULT '[]'::jsonb,
    quantifiable_achievements JSONB DEFAULT '[]'::jsonb,
    parsed_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Search Profiles & Presets
CREATE TABLE IF NOT EXISTS jobs.search_profiles (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES jobs.users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    profile_name VARCHAR(255) NOT NULL,
    default_resume_id VARCHAR(64) REFERENCES jobs.resumes(id) ON DELETE SET NULL,
    target_roles JSONB DEFAULT '[]'::jsonb,
    role_synonyms JSONB DEFAULT '[]'::jsonb,
    must_have_skills JSONB DEFAULT '[]'::jsonb,
    nice_to_have_skills JSONB DEFAULT '[]'::jsonb,
    exclude_keywords JSONB DEFAULT '[]'::jsonb,
    seniority VARCHAR(64) DEFAULT 'ALL',
    experience_years INTEGER DEFAULT 0,
    employment_types JSONB DEFAULT '["Full-time"]'::jsonb,
    work_modes JSONB DEFAULT '["REMOTE", "HYBRID"]'::jsonb,
    locations JSONB DEFAULT '[]'::jsonb,
    countries JSONB DEFAULT '[]'::jsonb,
    remote_countries JSONB DEFAULT '[]'::jsonb,
    visa_sponsorship BOOLEAN DEFAULT false,
    relocation_preference BOOLEAN DEFAULT false,
    salary_min NUMERIC(14, 2) DEFAULT 0,
    salary_max NUMERIC(14, 2),
    salary_currency VARCHAR(10) DEFAULT 'USD',
    industries JSONB DEFAULT '[]'::jsonb,
    company_size JSONB DEFAULT '[]'::jsonb,
    preferred_companies JSONB DEFAULT '[]'::jsonb,
    excluded_companies JSONB DEFAULT '[]'::jsonb,
    startup_preference BOOLEAN DEFAULT true,
    mnc_preference BOOLEAN DEFAULT true,
    batch_size INTEGER DEFAULT 15,
    max_results INTEGER DEFAULT 50,
    hourly_monitoring_enabled BOOLEAN DEFAULT true,
    ai_matching_threshold INTEGER DEFAULT 70,
    telegram_notifications BOOLEAN DEFAULT true,
    telegram_chat_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Search Runs & Source Tracking
CREATE TABLE IF NOT EXISTS jobs.search_run_sources (
    id SERIAL PRIMARY KEY,
    run_id VARCHAR(64) NOT NULL,
    source_id VARCHAR(64) NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'PENDING',
    jobs_fetched INTEGER DEFAULT 0,
    jobs_accepted INTEGER DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_run_sources_run ON jobs.search_run_sources(run_id);
CREATE INDEX IF NOT EXISTS idx_search_run_sources_source ON jobs.search_run_sources(source_id);

-- 4. Companies & Recruiter Contacts
CREATE TABLE IF NOT EXISTS jobs.companies (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    logo_url TEXT,
    industry VARCHAR(128),
    company_size VARCHAR(64),
    is_startup BOOLEAN DEFAULT false,
    is_mnc BOOLEAN DEFAULT false,
    career_page_url TEXT,
    headquarters VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs.company_contacts (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) REFERENCES jobs.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    linkedin_url TEXT,
    confidence NUMERIC(3, 2) DEFAULT 0.80,
    verified BOOLEAN DEFAULT false,
    source VARCHAR(64) DEFAULT 'JOB_POSTING',
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_contacts_email ON jobs.company_contacts(email);
CREATE INDEX IF NOT EXISTS idx_company_contacts_company ON jobs.company_contacts(company_id);

-- 5. Multi-Source Job References & Deduplication
CREATE TABLE IF NOT EXISTS jobs.job_source_refs (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs.jobs(id) ON DELETE CASCADE,
    source_id VARCHAR(64) NOT NULL,
    source_name VARCHAR(128) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    source_url TEXT NOT NULL,
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    raw_payload JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_job_source_refs_job ON jobs.job_source_refs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_source_refs_ext ON jobs.job_source_refs(source_id, external_id);

-- 6. Job Matching Engine Records
CREATE TABLE IF NOT EXISTS jobs.job_matches (
    id VARCHAR(64) PRIMARY KEY,
    job_id INTEGER REFERENCES jobs.jobs(id) ON DELETE CASCADE,
    resume_id VARCHAR(64) REFERENCES jobs.resumes(id) ON DELETE CASCADE,
    match_score INTEGER NOT NULL DEFAULT 0,
    title_alignment INTEGER DEFAULT 0,
    required_skill_coverage INTEGER DEFAULT 0,
    preferred_skill_coverage INTEGER DEFAULT 0,
    experience_alignment INTEGER DEFAULT 0,
    location_alignment INTEGER DEFAULT 0,
    salary_alignment INTEGER DEFAULT 0,
    remote_alignment INTEGER DEFAULT 0,
    keyword_coverage INTEGER DEFAULT 0,
    strengths JSONB DEFAULT '[]'::jsonb,
    gaps JSONB DEFAULT '[]'::jsonb,
    missing_required_skills JSONB DEFAULT '[]'::jsonb,
    matched_evidence JSONB DEFAULT '[]'::jsonb,
    recommendation VARCHAR(64) DEFAULT 'MATCH',
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_matches_job_resume ON jobs.job_matches(job_id, resume_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_score ON jobs.job_matches(match_score DESC);

-- 7. Application Documents
CREATE TABLE IF NOT EXISTS jobs.application_documents (
    id VARCHAR(64) PRIMARY KEY,
    application_id VARCHAR(64) REFERENCES jobs.applications(id) ON DELETE CASCADE,
    doc_type VARCHAR(64) NOT NULL, -- RESUME_PDF, RESUME_DOCX, COVER_LETTER_PDF, COVER_LETTER_DOCX
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    storage_path TEXT,
    drive_file_id VARCHAR(128),
    drive_view_url TEXT,
    drive_download_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_docs_app ON jobs.application_documents(application_id);

-- 8. Email Delivery Attempts
CREATE TABLE IF NOT EXISTS jobs.email_attempts (
    id SERIAL PRIMARY KEY,
    email_outbox_id VARCHAR(64) REFERENCES jobs.email_outbox(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    status VARCHAR(64) NOT NULL,
    response_code VARCHAR(32),
    error_message TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_attempts_outbox ON jobs.email_attempts(email_outbox_id);

-- 9. Telegram Messages & Callback Logging
CREATE TABLE IF NOT EXISTS jobs.telegram_messages (
    id VARCHAR(64) PRIMARY KEY,
    job_id INTEGER REFERENCES jobs.jobs(id) ON DELETE CASCADE,
    chat_id VARCHAR(64) NOT NULL,
    message_id BIGINT,
    message_type VARCHAR(64) DEFAULT 'JOB_NOTIFICATION',
    status VARCHAR(64) NOT NULL DEFAULT 'QUEUED',
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_messages_job ON jobs.telegram_messages(job_id);

CREATE TABLE IF NOT EXISTS jobs.telegram_callbacks (
    id VARCHAR(64) PRIMARY KEY,
    callback_id VARCHAR(128) NOT NULL,
    chat_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64),
    action VARCHAR(64) NOT NULL,
    job_id INTEGER REFERENCES jobs.jobs(id) ON DELETE CASCADE,
    processed BOOLEAN DEFAULT false,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_callbacks_job ON jobs.telegram_callbacks(job_id);

-- 10. Scheduled Actions & Reminders
CREATE TABLE IF NOT EXISTS jobs.scheduled_actions (
    id VARCHAR(64) PRIMARY KEY,
    action_type VARCHAR(64) NOT NULL, -- SEND_EMAIL, FOLLOW_UP, RETRY_FETCH
    entity_id VARCHAR(64) NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'PENDING',
    executed_at TIMESTAMPTZ,
    payload JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_actions_pending ON jobs.scheduled_actions(status, scheduled_for);

-- 11. Webhooks & Workflow Runs
CREATE TABLE IF NOT EXISTS jobs.webhook_events (
    id VARCHAR(64) PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE,
    payload JSONB NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'RECEIVED',
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs.workflow_runs (
    id VARCHAR(64) PRIMARY KEY,
    workflow_name VARCHAR(128) NOT NULL,
    execution_id VARCHAR(128),
    status VARCHAR(64) NOT NULL DEFAULT 'RUNNING',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON jobs.workflow_runs(status);

-- Seed default user and preset profile if not present
INSERT INTO jobs.users (id, email, name, role)
VALUES ('user_default', 'candidate@example.com', 'Primary Candidate', 'CANDIDATE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO jobs.search_profiles (
    id, user_id, profile_name, target_roles, must_have_skills, nice_to_have_skills,
    work_modes, batch_size, ai_matching_threshold
) VALUES (
    'profile_default', 'user_default', 'Senior Full Stack & AI Engineer',
    '["Senior Full Stack Engineer", "Senior Backend Engineer", "AI Systems Engineer"]'::jsonb,
    '["TypeScript", "Node.js", "React", "Next.js", "PostgreSQL", "Docker"]'::jsonb,
    '["Python", "FastAPI", "LangChain", "Redis", "Kubernetes", "Tailwind CSS"]'::jsonb,
    '["REMOTE", "HYBRID"]'::jsonb,
    15,
    70
) ON CONFLICT (id) DO NOTHING;
