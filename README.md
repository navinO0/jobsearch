# Production Job Search & Application Automation Platform (JobPulse v2.0)

A production-grade job discovery, AI matching, ATS resume tailoring, cover letter generation, Telegram alert, and application tracking platform built on Next.js 16 App Router, PostgreSQL 16, and modular n8n automation workflows.

---

## 🌟 Key Features

1. **26 Supported Job Sources**:
   - **ATS Infrastructure**: Greenhouse, Lever, Ashby, Workable, SmartRecruiters, Recruitee, Teamtailor (direct public board APIs).
   - **Aggregators & Feeds**: Arbeitnow, Jobicy, Himalayas, Remotive, RemoteOK, Adzuna, Jooble, SerpApi Google Jobs.
   - **Indian & Regional Portals**: Naukri, LinkedIn, Indeed, Foundit, Instahyre, Cutshort, Hirist, iimjobs, Shine, Internshala, Wellfound (Manual CSV bulk import, single-URL ingest, or licensed search providers).
2. **Deterministic & AI Hybrid Matching**:
   - Deterministic filtering checks excluded keywords, salary floor, and locations before AI execution.
   - Zero hallucination policy: candidate experience is derived exclusively from verified master profiles.
3. **On-Demand ATS Resume & Cover Letter Generation**:
   - Generates machine-readable single-column HTML, PDF, and DOCX documents with consistent whitespace and headings.
4. **Recruiter & HR Email Discovery**:
   - Discovers verified HR emails from job postings.
   - Outbox pattern with manual approval gates, hourly/daily send caps, and duplicate recipient guards.
5. **Rich Telegram Alerts & Opaque Callbacks**:
   - Dispatches one-by-one job notifications with interactive inline buttons (`job:{id}:{action}`).
6. **Hierarchical Google Drive Organization**:
   - Structured folders under `Job Search Assistant/01_Job_Opening/YYYY/MM/DD/...` with PostgreSQL folder ID caching.
7. **18-Stage Kanban Application Tracking**:
   - From `DISCOVERED` to `DOCUMENTS_READY`, `EMAIL_APPROVAL`, `APPLIED`, `INTERVIEW`, and `OFFER`.

---

## 🚀 Quick Start

### 1. Database Migrations
```bash
docker exec -i postgresql-ktxhkuiuzp3gnwgrggc15ekz psql -U UZ2Dd4tp4eVRsS22 -d n8n < migrations/001_production_schema.sql
```

### 2. Environment Setup
```bash
cp .env.example .env.local
```

### 3. Build & Run Production UI via PM2
```bash
npm install
npm run build
pm2 start deploy/ecosystem.config.cjs
pm2 save
```

### 4. Reverse Proxy Setup
Review `deploy/nginx.conf.example` for SSL termination, security headers, and webhook forwarding.

---

## 📖 Detailed Documentation
- [System Architecture](docs/ARCHITECTURE.md)
- [n8n Workflow Audit & Sub-Workflows](docs/N8N_AUDIT.md)
- [26-Source Integration Matrix](docs/SOURCE_MATRIX.md)
- [API & Webhook Reference](docs/API.md)
- [Production Deployment Guide](docs/DEPLOYMENT.md)
- [Environment Configuration](docs/ENVIRONMENT.md)
- [Operations & Runbook](docs/OPERATIONS.md)
