import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { queueEmailOutbox, checkRateLimitOk } from '@/lib/emailOutbox';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL';

    let query = 'SELECT * FROM jobs.email_outbox';
    const params: any[] = [];
    if (status !== 'ALL') {
      query += ' WHERE status = $1';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    const rateLimit = await checkRateLimitOk();

    return NextResponse.json({
      emails: result.rows,
      rateLimitOk: rateLimit.ok,
      rateLimitReason: rateLimit.reason,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
    }

    if (action === 'approve') {
      await pool.query(
        "UPDATE jobs.email_outbox SET status = 'APPROVED', updated_at = NOW() WHERE id = $1",
        [id]
      );
      return NextResponse.json({ success: true, message: 'Email approved for dispatch' });
    }

    if (action === 'cancel') {
      await pool.query(
        "UPDATE jobs.email_outbox SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1",
        [id]
      );
      return NextResponse.json({ success: true, message: 'Email cancelled' });
    }

    if (action === 'schedule') {
      const { sendAt } = body;
      await pool.query(
        "UPDATE jobs.email_outbox SET status = 'SCHEDULED', scheduled_send_time = $1, updated_at = NOW() WHERE id = $2",
        [sendAt, id]
      );
      return NextResponse.json({ success: true, message: `Email scheduled for ${sendAt}` });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
