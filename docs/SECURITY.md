# Security Posture & Operational Safeguards

## 1. Zero-Trust Secrets Management
- **No Client Secrets**: API keys, database credentials, Google OAuth tokens, and Telegram bot secrets are never rendered in client bundles or exposed to browser JavaScript.
- **Backend-for-Frontend (BFF)**: The Next.js API routes act as an authenticated gateway, mediating all requests between the browser, PostgreSQL, and n8n webhooks.
- **Workflow Sanitization**: n8n workflows reference environment variables via `$env` rather than hardcoding plaintext tokens.

---

## 2. Server-Side Request Forgery (SSRF) Protection
When extracting job details from user-submitted URLs (`POST /api/search/url` and `WF-002`):
- **Protocol Enforcement**: Only `https://` (and explicitly permitted `http://`) protocols are processed.
- **Private IP Blacklist**: Requests to private RFC1918 networks, loopback addresses, and cloud metadata endpoints are immediately rejected before DNS resolution:
  - `127.0.0.0/8` (Localhost)
  - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (Private Intranets)
  - `169.254.169.254` (Cloud Instance Metadata Service)
  - `::1`, `fc00::/7` (IPv6 loopback & ULA)

---

## 3. Email Outreach & Anti-Spam Governance
The platform is designed to protect candidate domain reputation and respect recruiter privacy:
- **No Hallucinated Emails**: Recruiter contact addresses must be verified from the job posting, official careers page, or approved directory. Guessing email permutations (`firstname@company.com`) is strictly prohibited.
- **Human Approval Mandatory**: Automatic email dispatch is disabled by default. All drafted applications enter `jobs.email_outbox` with status `APPROVAL_REQUIRED`.
- **Throttling & Cooldowns**:
  - Maximum 5 emails dispatched per hour.
  - Maximum 20 emails dispatched per day.
  - 48-hour cooldown between applications to the same company domain.
  - Absolute idempotency check on `job_id` preventing duplicate applications.

---

## 4. Telegram Callback Security
- **Opaque Callback Payloads**: Telegram inline keyboard callbacks use minimal, opaque tokens (`job:{id}:{action}`).
- **No Sensitive State in Transit**: Resumes, candidate PII, and OAuth tokens are never encoded in Telegram callback data.
- **State Validation**: The Telegram callback handler verifies that the incoming user ID matches the authorized administrator before taking action.

---

## 5. Google Drive Access Control
- **Private by Default**: All folders created under `Job Search Assistant/` are created with default owner-only permissions.
- **Restricted Previews**: Preview links (`webViewLink`) use Google Workspace authenticated sessions; public web sharing is never enabled automatically.

---

## 6. Audit Logging & Input Sanitization
- **Transactional Audit Trail**: All user actions (status transitions, document generation, approvals) are written to `jobs.audit_logs`.
- **SQL Injection Prevention**: All queries use parameterized inputs (`$1`, `$2`) through `pg.Pool`.
- **File Upload Protection**: Resumes are validated for MIME type (`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`) and limited to a 10MB maximum payload.
