import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { JOB_SOURCES_REGISTRY } from '@/lib/sources';

export async function GET() {
  try {
    const healthResult = await pool.query('SELECT * FROM jobs.source_health');
    const healthMap = new Map(healthResult.rows.map((r: any) => [r.source_id, r]));

    const merged = JOB_SOURCES_REGISTRY.map((src) => {
      const dbStats = healthMap.get(src.id) || {};
      return {
        ...src,
        jobsFoundTotal: dbStats.jobs_found_total || 0,
        jobsAcceptedTotal: dbStats.jobs_accepted_total || 0,
        avgResponseTimeMs: dbStats.avg_response_time_ms || 0,
        lastSuccessfulFetch: dbStats.last_successful_fetch || null,
        lastFailure: dbStats.last_failure || null,
        lastHttpStatus: dbStats.last_http_status || 200,
        isRateLimited: dbStats.is_rate_limited || false,
      };
    });

    return NextResponse.json({ sources: merged });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
