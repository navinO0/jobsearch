import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const runsRes = await pool.query(`
      SELECT 
        run_id, started_at, completed_at, status, sources_attempted,
        sources_succeeded, sources_failed, jobs_fetched, jobs_normalized,
        jobs_matched, telegram_sent, errors
      FROM job_runs 
      ORDER BY started_at DESC 
      LIMIT 15;
    `);

    const sourcesRes = await pool.query(`
      SELECT 
        source_name, source_type, base_url, is_active, last_run_at, last_status
      FROM job_sources 
      ORDER BY source_name ASC;
    `);

    return NextResponse.json({
      success: true,
      runs: runsRes.rows,
      sources: sourcesRes.rows,
    });
  } catch (error: any) {
    console.error('Error fetching runs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
