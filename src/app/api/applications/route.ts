import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { transitionApplicationStatus, ApplicationStatus } from '@/lib/applicationState';

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(`
      SELECT a.*, j.job_title, j.company_name, j.location, j.source, j.profile_match_score, j.application_url
      FROM jobs.applications a
      JOIN jobs.jobs j ON a.job_id = j.id
      ORDER BY a.updated_at DESC
      LIMIT 100
    `);
    return NextResponse.json({ applications: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, newStatus, trigger = 'UI', notes } = body;

    if (!applicationId || !newStatus) {
      return NextResponse.json({ error: 'Missing applicationId or newStatus' }, { status: 400 });
    }

    await transitionApplicationStatus(applicationId, newStatus as ApplicationStatus, trigger, notes);

    return NextResponse.json({ success: true, newStatus });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
