import { pool } from './db';

export const APPLICATION_STATUSES = [
  'DISCOVERED',
  'MATCHED',
  'SAVED',
  'REVIEW',
  'DOCUMENTS_PENDING',
  'DOCUMENTS_READY',
  'EMAIL_DRAFT',
  'EMAIL_APPROVAL',
  'EMAIL_SCHEDULED',
  'EMAIL_SENT',
  'APPLIED',
  'APPLICATION_CONFIRMED',
  'FOLLOW_UP_DUE',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
  'CLOSED',
] as const;

export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

export async function transitionApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
  trigger: 'UI' | 'TELEGRAM' | 'WEBHOOK' | 'SCHEDULE',
  notes?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const currentRes = await pool.query('SELECT status FROM jobs.applications WHERE id = $1', [applicationId]);
  const fromStatus = currentRes.rows[0]?.status || null;

  await pool.query(
    'UPDATE jobs.applications SET status = $1, updated_at = NOW() WHERE id = $2',
    [newStatus, applicationId]
  );

  await pool.query(
    `INSERT INTO jobs.application_events (application_id, from_status, to_status, event_trigger, notes, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [applicationId, fromStatus, newStatus, trigger, notes || null, JSON.stringify(metadata || {})]
  );
}
