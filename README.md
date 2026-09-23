# Production Job Search & Application Automation Platform (JobPulse v2.0)

A production-grade job discovery, multi-source aggregation, factual AI matching, ATS resume tailoring, cover letter generation, Telegram notification, guarded HR email outreach, and 18-stage application tracking platform built on Next.js 16 (App Router / Turbopack), PostgreSQL 16, and modular n8n automation sub-workflows.

---

## 🌟 Key Architecture & Capabilities

1. **Modular n8n Architecture (WF-001 through WF-081)**:
   - Replaced monolithic pipelines with modular, decoupled sub-workflows for ingestion, normalization, deduplication, deterministic filtering, AI matching, document generation, outbox management, and dead letter queue error handling.
2. **26 Official Job Source Adapters**:
   - **ATS Public Board Infrastructure**: Greenhouse, Lever, Ashby, Workable, SmartRecruiters, Recruitee, Teamtailor.
   - **Aggregators & Feeds**: Arbeitnow, Jobicy, Himalayas, Remotive, RemoteOK, Adzuna, Jooble, Google Jobs via SerpApi.
   - **Indian & Startup Portals**: Naukri, LinkedIn, Indeed, Foundit, Instahyre, Cutshort, Hirist, iimjobs, Shine, Internshala, Wellfound (Permitted modes: Search Provider, CSV bulk import, single URL inspection, or partner feeds; strictly no prohibited bot scraping or anti-captcha circumvention).
3. **Factual Ground-Truth AI Tailoring**:
   - Master resume is the non-negotiable factual source of truth.
   - Never invents employers, dates, metrics, titles, or unverified skills. Re-orders, refines, and prioritizes truthful candidate background to match target role requirements.
4. **Guarded Email Outreach & Anti-Spam Controls**:
   - Recruiter email addresses discovered only when published.
   - Transactional outbox with human review gates (`APPROVAL_REQUIRED`).
   - Hard rate limits (max 5/hr, max 20/day) and 48-hour same-company cooldowns.
5. **Rich Telegram Job Notifications & Opaque Callbacks**:
   - Openings transmitted sequentially one-by-one with match score, highlights, and opaque buttons (`job:{id}:{action}`).
   - Telegram callback handler verifies authorized user identity and executes actions idempotently.
6. **Hierarchical Google Drive Organization**:
   - Auto-organizes files under `Job Search Assistant/01_Job_Opening/YYYY/MM/DD/Company/Role/`.
   - Caches Drive folder IDs in PostgreSQL (`jobs.drive_folders`) to eliminate redundant recursive search calls.
7. **18-Stage Kanban & Application Status Machine**:
   - `DISCOVERED` → `MATCHED` → `SAVED` → `DOCUMENTS_READY` → `EMAIL_DRAFT` → `EMAIL_APPROVAL` → `EMAIL_SCHEDULED` → `EMAIL_SENT` → `APPLIED` → `FOLLOW_UP_DUE` → `INTERVIEW` → `OFFER` → `REJECTED`.

---

## 🚀 Quick Start & Operations

### 1. Database Migrations
PostgreSQL migrations reside in `migrations/`:
```bash
# Migration 001: Core application tables
# Migration 002: Complete 31-table normalized schema with foreign keys and indexes
node -e '
const fs = require("fs");
const { Pool } = require("pg");
const pool = new Pool({ host: "10.0.3.3", port: 5432, database: "n8n", user: "UZ2Dd4tp4eVRsS22", password: "TnEHkZif6XMZfHpfx7d6jQCmqUjlkQou" });
pool.query(fs.readFileSync("migrations/002_complete_normalized_schema.sql", "utf8")).then(() => { console.log("Migrated!"); pool.end(); });
'
```

### 2. Environment Configuration
```bash
cp .env.example .env.local
```

### 3. Running Test Suites
```bash
npm test
```

### 4. Production Next.js Build & PM2 Process Execution
```bash
npm install
npm run build
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

### 5. Reverse Proxy Configuration
Deploy Nginx using `deploy/nginx.conf.example` for SSL termination, rate limiting, and reverse proxying:
- `https://jobs.example.com` → Next.js (port 3000)
- `https://jobs.example.com/webhook/` → n8n automation engine (port 5678)

---

## 📖 Complete Technical Documentation

- [System Architecture & Data Flow](docs/ARCHITECTURE.md)
- [n8n Workflow Audit & Monolith Decomposition](docs/N8N_AUDIT.md)
- [n8n Reusable Sub-Workflow Catalog (WF-001 to WF-081)](docs/N8N_WORKFLOWS.md)
- [26-Source Integration Matrix & Compliance Policies](docs/SOURCE_MATRIX.md)
- [API & Webhook Specification](docs/API.md)
- [n8n v2 Detailed Workflow & Sub-Workflow Manual](n8n/v2/README.md)
- [n8n v2 Step-by-Step Workflow Execution Lifecycle](docs/WORKFLOW_EXECUTION_STEPS.md)
- [PostgreSQL Database Architecture & Data Dictionary](docs/DATABASE.md)
- [AI Architecture, Prompt Safety & Zod Validation](docs/AI.md)
- [Security Posture, SSRF Prevention & Anti-Spam Governance](docs/SECURITY.md)
- [Production Deployment Guide (PM2, Nginx, Docker)](docs/DEPLOYMENT.md)
- [Coolify Cloud Deployment & Env Guide](docs/COOLIFY.md)
- [Day-2 Operations, Monitoring & DLQ Recovery](docs/OPERATIONS.md)

---

## 📂 Project Structure

```text
├── deploy/
│   ├── ecosystem.config.cjs      # PM2 cluster and process configuration
│   └── nginx.conf.example        # Nginx reverse proxy with SSL & security headers
├── docs/                         # 10 comprehensive architecture & ops specifications
├── examples/
│   └── job-search.csv            # Standard CSV search template
├── migrations/
│   ├── 001_production_schema.sql # Initial tables
│   └── 002_complete_normalized_schema.sql # Complete 31-table schema
├── n8n/
│   ├── fixtures/                 # Reusable test payloads for webhooks & jobs
│   ├── subworkflows/             # WF-010 to WF-081 reusable sub-workflows
│   └── workflows/                # WF-001 to WF-005 orchestrators & scheduled triggers
├── src/
│   ├── app/                      # Next.js 16 App Router (38 routes)
│   ├── components/               # Shadcn/ui atomic components & custom modals
│   └── lib/                      # Database pool, normalizer, matching, outbox helpers
└── tests/
    └── run_tests.js              # 9 comprehensive automated test suites
```
