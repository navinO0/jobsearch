# Production Deployment Guide

## 1. Architecture Deployment Overview

The platform uses a decoupled deployment model:
1. **Next.js 16 Web Application**: Deployed using Node.js 20+ and managed via **PM2** under `/home/naveen/job-portal`, reverse-proxied through Nginx or Traefik.
2. **n8n Automation Engine**: Runs as an isolated container `n8n-ktxhkuiuzp3gnwgrggc15ekz` on network `ktxhkuiuzp3gnwgrggc15ekz` with webhook endpoints exposed internally or via gateway.
3. **PostgreSQL 16**: Authoritative persistent relational database with connection pooling enabled.
4. **Redis**: Cache, deduplication store, and distributed locks for rate-limited outbox tasks.

---

## 2. PM2 Process Management

PM2 ensures the Next.js production server runs continuously with autorestart, log management, and memory limits.

### Configuration (`deploy/ecosystem.config.cjs`)
```javascript
module.exports = {
  apps: [
    {
      name: 'job-portal-ui',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/home/naveen/job-portal',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      error_file: '/home/naveen/job-portal/logs/pm2-error.log',
      out_file: '/home/naveen/job-portal/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

### PM2 Setup Commands
```bash
cd /home/naveen/job-portal
npm install
npm run build
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 3. Nginx Reverse Proxy Configuration

Nginx acts as the front-line SSL termination, HTTP/2 gateway, security filter, and rate limiter.

### Configuration (`deploy/nginx.conf.example`)
```nginx
upstream nextjs_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream n8n_backend {
    server 10.0.3.6:5678; # n8n internal container IP
    keepalive 32;
}

server {
    listen 80;
    server_name jobs.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name jobs.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/jobs.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jobs.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 25M;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;

    # Next.js Application
    location / {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Internal Webhook Relay for n8n
    location /webhook/ {
        proxy_pass http://n8n_backend/webhook/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
    }
}
```

---

## 4. Database Migrations Execution
```bash
# Apply schema extensions and new tables
docker exec -i postgresql-ktxhkuiuzp3gnwgrggc15ekz psql -U UZ2Dd4tp4eVRsS22 -d n8n < /home/naveen/job-portal/migrations/001_production_schema.sql
```
