import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const callbackQuery = body.callback_query;

    if (!callbackQuery) {
      // Might be a regular update or message
      return NextResponse.json({ ok: true });
    }

    const callbackId = callbackQuery.id;
    const userId = String(callbackQuery.from?.id);
    const data = String(callbackQuery.data || '');

    // Check idempotency in jobs.telegram_callbacks
    const existing = await pool.query(
      'SELECT id FROM jobs.telegram_callbacks WHERE callback_id = $1 LIMIT 1',
      [callbackId]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json({ ok: true, note: 'Already processed' });
    }

    // Parse opaque data: job:{id}:{action}
    const parts = data.split(':');
    if (parts.length >= 3 && parts[0] === 'job') {
      const jobId = parseInt(parts[1], 10);
      const action = parts[2];

      // Insert callback log
      await pool.query(
        `INSERT INTO jobs.telegram_callbacks (id, callback_id, chat_id, user_id, action, job_id, processed, payload)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7::jsonb)`,
        [
          `cb_${Date.now()}`,
          callbackId,
          String(callbackQuery.message?.chat?.id || userId),
          userId,
          action,
          isNaN(jobId) ? null : jobId,
          JSON.stringify(callbackQuery),
        ]
      );

      // Perform state action based on opaque token
      if (action === 'resume' && !isNaN(jobId)) {
        await pool.query(
          `UPDATE jobs.jobs SET application_status = 'DOCUMENTS_READY', updated_at = NOW() WHERE id = $1`,
          [jobId]
        );
      } else if (action === 'skip' && !isNaN(jobId)) {
        await pool.query(
          `UPDATE jobs.jobs SET status = 'SKIPPED', updated_at = NOW() WHERE id = $1`,
          [jobId]
        );
      } else if (action === 'email' && !isNaN(jobId)) {
        await pool.query(
          `UPDATE jobs.email_outbox SET status = 'APPROVED', updated_at = NOW() WHERE job_id = $1`,
          [jobId]
        );
      }
    }

    // Answer callback query to stop telegram loading spinner
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackId,
          text: 'Action recorded successfully.',
        }),
      }).catch(() => null);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Telegram callback error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
