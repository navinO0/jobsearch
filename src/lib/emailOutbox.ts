import { pool } from './db';
import crypto from 'crypto';

export interface EmailOutboxEntry {
  id?: string;
  applicationId?: string;
  jobId: number;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  attachments?: any[];
  status?: 'PENDING' | 'APPROVAL_REQUIRED' | 'APPROVED' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  scheduledSendTime?: string | Date;
}

export async function queueEmailOutbox(entry: EmailOutboxEntry): Promise<string> {
  const id = entry.id || crypto.randomUUID();
  const idempotencyKey = crypto
    .createHash('sha256')
    .update(`${entry.jobId}|${entry.recipientEmail}|${entry.subject}`)
    .digest('hex');

  // Safety check: Don't enqueue duplicate emails for the exact same job & recipient within 30 days
  const existing = await pool.query(
    `SELECT id, status FROM jobs.email_outbox 
     WHERE recipient_email = $1 AND job_id = $2 AND created_at > NOW() - INTERVAL '30 days'
     LIMIT 1`,
    [entry.recipientEmail, entry.jobId]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const initialStatus = entry.status || (process.env.EMAIL_REQUIRE_APPROVAL === 'false' ? 'APPROVED' : 'APPROVAL_REQUIRED');

  await pool.query(
    `INSERT INTO jobs.email_outbox (
      id, application_id, job_id, recipient_email, recipient_name,
      subject, body_text, body_html, attachments, status,
      scheduled_send_time, idempotency_key
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      id,
      entry.applicationId || null,
      entry.jobId,
      entry.recipientEmail,
      entry.recipientName || '',
      entry.subject,
      entry.bodyText,
      entry.bodyHtml,
      JSON.stringify(entry.attachments || []),
      initialStatus,
      entry.scheduledSendTime || null,
      idempotencyKey,
    ]
  );

  return id;
}

export async function checkRateLimitOk(): Promise<{ ok: boolean; reason?: string }> {
  const hourlyLimit = parseInt(process.env.EMAIL_HOURLY_LIMIT || '5', 10);
  const dailyLimit = parseInt(process.env.EMAIL_DAILY_LIMIT || '25', 10);

  const hourlyRes = await pool.query(
    `SELECT count(*) FROM jobs.email_outbox WHERE status = 'SENT' AND sent_at > NOW() - INTERVAL '1 hour'`
  );
  if (parseInt(hourlyRes.rows[0].count, 10) >= hourlyLimit) {
    return { ok: false, reason: `Hourly limit reached (${hourlyLimit}/hr)` };
  }

  const dailyRes = await pool.query(
    `SELECT count(*) FROM jobs.email_outbox WHERE status = 'SENT' AND sent_at > NOW() - INTERVAL '1 day'`
  );
  if (parseInt(dailyRes.rows[0].count, 10) >= dailyLimit) {
    return { ok: false, reason: `Daily limit reached (${dailyLimit}/day)` };
  }

  return { ok: true };
}
