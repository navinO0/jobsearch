# Coolify Deployment Guide & Environment Variables

This guide details the exact environment variables and configuration required to deploy the **Job Search & Automation Platform UI** through Coolify.

---

## 1. Coolify Service Configuration

- **Application Type**: Dockerfile or Docker Compose
- **Repository**: `https://github.com/navinO0/jobsearch`
- **Branch**: `main`
- **Build Pack**: Dockerfile
- **Dockerfile Path**: `/Dockerfile`
- **Internal Port**: `3000`
- **Health Check Path**: `/api/health`
- **Docker Network**: Connect to `ktxhkuiuzp3gnwgrggc15ekz` (the internal Docker network shared with PostgreSQL and n8n) and `coolify` (for Traefik reverse proxy routing).

---

## 2. Environment Variables Table

Copy and paste these exact environment variables into your Coolify Application **Environment Variables** tab:

| Variable Name | Recommended Production Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Node.js production mode |
| `PORT` | `3000` | Port Next.js standalone server listens on |
| `HOSTNAME` | `0.0.0.0` | Bind to all interfaces inside container |
| `NEXT_TELEMETRY_DISABLED` | `1` | Disables Next.js telemetry collection |
| `DATABASE_HOST` | `postgresql-ktxhkuiuzp3gnwgrggc15ekz` | Internal Docker container name of Postgres (or `10.0.3.3`) |
| `DATABASE_PORT` | `5432` | PostgreSQL port |
| `DATABASE_NAME` | `n8n` | Database name containing the `jobs` schema |
| `DATABASE_USER` | `UZ2Dd4tp4eVRsS22` | Database username |
| `DATABASE_PASSWORD` | `TnEHkZif6XMZfHpfx7d6jQCmqUjlkQou` | Database password |
| `DATABASE_SSL` | `false` | Internal docker network does not require SSL |
| `N8N_BASE_URL` | `http://10.0.3.6:5678` | Internal n8n service endpoint |
| `N8N_SEARCH_WEBHOOK` | `http://10.0.3.6:5678/webhook/job-search` | Ingestion orchestrator webhook URL |
| `N8N_MANUAL_SEARCH_WEBHOOK` | `http://10.0.3.6:5678/webhook/manual-search` | Manual & URL webhook URL |
| `N8N_CSV_SEARCH_WEBHOOK` | `http://10.0.3.6:5678/webhook/csv-search` | CSV batch ingestion webhook URL |
| `N8N_DOCUMENT_WEBHOOK` | `http://10.0.3.6:5678/webhook/generate-package` | Package generation webhook URL |
| `N8N_EMAIL_WEBHOOK` | `http://10.0.3.6:5678/webhook/send-email` | Email delivery webhook URL |
| `AI_PROVIDER` | `openrouter` | Provider gateway (`openrouter`, `openai`, `gemini`, `ollama`) |
| `OPENROUTER_API_KEY` | `sk-or-v1-your_openrouter_api_key` | OpenRouter API Key for DeepSeek & Claude |
| `AI_MATCH_MODEL` | `deepseek/deepseek-v4-flash-0731:free` | Match scoring model |
| `AI_RESUME_MODEL` | `anthropic/claude-3.5-sonnet` | Factual resume tailoring model |
| `AI_COVER_LETTER_MODEL` | `anthropic/claude-3.5-sonnet` | Cover letter drafting model |
| `TELEGRAM_BOT_TOKEN` | `your_bot_token` | Telegram Bot API token |
| `TELEGRAM_CHAT_ID` | `617149298` | Your Telegram chat ID |
| `TELEGRAM_NOTIFICATION_ENABLED` | `true` | Enables one-by-one Telegram delivery |
| `TELEGRAM_MIN_MATCH_SCORE` | `70` | Minimum ATS match score (0-100) to alert |
| `EMAIL_PROVIDER` | `gmail` | Email driver (`gmail`, `smtp`, `resend`) |
| `EMAIL_SENDER_NAME` | `Alex Taylor` | Display name on outgoing applications |
| `EMAIL_SENDER_ADDRESS` | `alex.taylor@example.com` | Verified sender address |
| `EMAIL_REQUIRE_APPROVAL` | `true` | Mandatory human approval before send |
| `EMAIL_HOURLY_LIMIT` | `5` | Maximum emails dispatched per hour |
| `EMAIL_DAILY_LIMIT` | `20` | Maximum emails dispatched per day |
| `NEXT_PUBLIC_APP_URL` | `https://jobs.navin.lol` | Public URL for Coolify Traefik routing |

---

## 3. Coolify Raw Key-Value Paste Block

You can paste this entire block directly into Coolify's **Bulk Edit** environment variables field:

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1
DATABASE_HOST=postgresql-ktxhkuiuzp3gnwgrggc15ekz
DATABASE_PORT=5432
DATABASE_NAME=n8n
DATABASE_USER=UZ2Dd4tp4eVRsS22
DATABASE_PASSWORD=TnEHkZif6XMZfHpfx7d6jQCmqUjlkQou
DATABASE_SSL=false
N8N_BASE_URL=http://10.0.3.6:5678
N8N_SEARCH_WEBHOOK=http://10.0.3.6:5678/webhook/job-search
N8N_MANUAL_SEARCH_WEBHOOK=http://10.0.3.6:5678/webhook/manual-search
N8N_CSV_SEARCH_WEBHOOK=http://10.0.3.6:5678/webhook/csv-search
N8N_DOCUMENT_WEBHOOK=http://10.0.3.6:5678/webhook/generate-package
N8N_EMAIL_WEBHOOK=http://10.0.3.6:5678/webhook/send-email
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key_here
AI_MATCH_MODEL=deepseek/deepseek-v4-flash-0731:free
AI_RESUME_MODEL=anthropic/claude-3.5-sonnet
AI_COVER_LETTER_MODEL=anthropic/claude-3.5-sonnet
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=617149298
TELEGRAM_NOTIFICATION_ENABLED=true
TELEGRAM_MIN_MATCH_SCORE=70
EMAIL_PROVIDER=gmail
EMAIL_SENDER_NAME=Alex Taylor
EMAIL_SENDER_ADDRESS=alex.taylor@example.com
EMAIL_REQUIRE_APPROVAL=true
EMAIL_HOURLY_LIMIT=5
EMAIL_DAILY_LIMIT=20
NEXT_PUBLIC_APP_URL=https://jobs.navin.lol
```
