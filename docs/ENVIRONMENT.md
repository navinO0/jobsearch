# Environment Configuration Reference

This guide details all environment variables used by the Next.js BFF, background workers, and n8n integrations.

## 1. Database Variables
```bash
# PostgreSQL Master Connection
DATABASE_HOST=postgresql-ktxhkuiuzp3gnwgrggc15ekz
DATABASE_PORT=5432
DATABASE_NAME=n8n
DATABASE_USER=UZ2Dd4tp4eVRsS22
DATABASE_PASSWORD=TnEHkZif6XMZfHpfx7d6jQCmqUjlkQou
DATABASE_SSL=false
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20

# Redis Cache & DLQ
REDIS_HOST=redis-ktxhkuiuzp3gnwgrggc15ekz
REDIS_PORT=6379
REDIS_PASSWORD=
```

## 2. n8n Automation Engine Endpoints
```bash
# Internal container network communication
N8N_BASE_URL=http://n8n-ktxhkuiuzp3gnwgrggc15ekz:5678
N8N_WEBHOOK_URL=http://n8n-ktxhkuiuzp3gnwgrggc15ekz:5678/webhook/job-pipeline-trigger
N8N_RECOVERY_WEBHOOK_URL=http://n8n-ktxhkuiuzp3gnwgrggc15ekz:5678/webhook/job-recovery-trigger
N8N_SEARCH_WEBHOOK=http://n8n-ktxhkuiuzp3gnwgrggc15ekz:5678/webhook/job-search
N8N_DOCUMENT_WEBHOOK=http://n8n-ktxhkuiuzp3gnwgrggc15ekz:5678/webhook/generate-documents
N8N_EMAIL_WEBHOOK=http://n8n-ktxhkuiuzp3gnwgrggc15ekz:5678/webhook/send-email
N8N_WEBHOOK_SECRET=your_super_secret_signing_key_32chars
```

## 3. AI Providers (Multi-Model Routing)
```bash
# Default active provider: 'openrouter' | 'gemini' | 'openai' | 'ollama'
AI_PROVIDER=openrouter

# OpenRouter Configuration
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Specialized Model Tiering
AI_MATCH_MODEL=deepseek/deepseek-v4-flash-0731:free
AI_RESUME_MODEL=anthropic/claude-3.5-sonnet
AI_COVER_LETTER_MODEL=anthropic/claude-3.5-sonnet
AI_RESEARCH_MODEL=google/gemini-2.0-flash-001

# Fallback Models
AI_FALLBACK_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxx
```

## 4. Telegram Bot API
```bash
TELEGRAM_BOT_TOKEN=8173491823:AAHxxxxxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=617149298
TELEGRAM_NOTIFICATION_ENABLED=true
TELEGRAM_ONE_BY_ONE_MODE=true
TELEGRAM_MIN_MATCH_SCORE=70
```

## 5. Google Workspace (Drive, Gmail, Calendar, Sheets)
```bash
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
GOOGLE_REFRESH_TOKEN=1//04xxxxxxxxxxxxxxxxxxxx
GOOGLE_DRIVE_ROOT_FOLDER_NAME=Job Search Assistant
GOOGLE_SHEETS_EXPORT_ENABLED=true
GOOGLE_SHEET_ID=
```

## 6. Email Delivery & Safety Controls
```bash
EMAIL_PROVIDER=gmail # 'gmail' | 'smtp' | 'resend'
EMAIL_SENDER_NAME="Naveen"
EMAIL_SENDER_ADDRESS=naveen@example.com
EMAIL_REQUIRE_APPROVAL=true # Never auto-send without review
EMAIL_HOURLY_LIMIT=5
EMAIL_DAILY_LIMIT=25
EMAIL_MIN_DELAY_SECONDS=60
EMAIL_COMPANY_COOLDOWN_DAYS=30
```

## 7. Search Provider & Job Source API Keys
```bash
SERPAPI_API_KEY=
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
JOOBLE_API_KEY=
```

## 8. Application & System Settings
```bash
NEXT_PUBLIC_APP_URL=https://jobs.navin.lol
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```
