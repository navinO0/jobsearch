import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const errorEventsRes = await pool.query(
      `SELECT * FROM jobs.error_events
       ORDER BY created_at DESC
       LIMIT 50;`
    );

    const auditLogsRes = await pool.query(
      `SELECT * FROM jobs.audit_logs
       ORDER BY created_at DESC
       LIMIT 50;`
    );

    return NextResponse.json({
      success: true,
      errorEvents: errorEventsRes.rows,
      auditLogs: auditLogsRes.rows,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
