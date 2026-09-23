import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id, 10);
    if (isNaN(jobId)) {
      return NextResponse.json({ success: false, error: 'Invalid Job ID' }, { status: 400 });
    }

    const jobRes = await pool.query('SELECT * FROM jobs.jobs WHERE id = $1', [jobId]);
    if (jobRes.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const job = jobRes.rows[0];

    // Fetch related application record if exists
    const appRes = await pool.query(
      'SELECT * FROM jobs.applications WHERE job_id = $1 LIMIT 1',
      [jobId]
    );
    const application = appRes.rows[0] || null;

    // Fetch related resume version
    const resumeRes = await pool.query(
      'SELECT * FROM jobs.resume_versions WHERE job_id = $1 ORDER BY created_at DESC LIMIT 1',
      [jobId]
    );
    const resumeVersion = resumeRes.rows[0] || null;

    return NextResponse.json({
      success: true,
      job,
      application,
      resumeVersion,
    });
  } catch (error: any) {
    console.error('Error fetching job details:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id, 10);
    const body = await request.json();
    const { application_status, remarks, notes, recruiter_email, interview_date } = body;

    const updates: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let pIdx = 1;

    if (application_status) {
      updates.push(`application_status = $${pIdx}`);
      values.push(application_status);
      pIdx++;

      if (application_status === 'APPLIED') {
        updates.push(`applied_at = COALESCE(applied_at, NOW())`);
      }
    }

    const finalRemarks = remarks !== undefined ? remarks : notes;
    if (finalRemarks !== undefined) {
      updates.push(`remarks = $${pIdx}`);
      values.push(finalRemarks);
      pIdx++;
    }

    if (interview_date !== undefined) {
      updates.push(`interview_date = $${pIdx}`);
      values.push(interview_date ? new Date(interview_date) : null);
      pIdx++;
    }

    if (recruiter_email !== undefined) {
      updates.push(`recruiter_email = $${pIdx}`);
      values.push(recruiter_email);
      pIdx++;
    }

    values.push(jobId);
    const sql = `
      UPDATE jobs.jobs
      SET ${updates.join(', ')}
      WHERE id = $${pIdx}
      RETURNING *;
    `;
    const res = await pool.query(sql, values);

    if (res.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: res.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating job status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
