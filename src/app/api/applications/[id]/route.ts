import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { transitionApplicationStatus, ApplicationStatus } from '@/lib/applicationState';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const appRes = await pool.query(
      `SELECT a.*, j.job_title, j.company_name, j.location, j.source, j.profile_match_score,
              j.application_url, j.recruiter_email, j.description
       FROM jobs.applications a
       JOIN jobs.jobs j ON a.job_id = j.id
       WHERE a.id = $1`,
      [id]
    );

    if (appRes.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const application = appRes.rows[0];

    // Fetch timeline events
    const eventsRes = await pool.query(
      `SELECT * FROM jobs.application_events
       WHERE application_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    // Fetch related resume version
    const resumeRes = await pool.query(
      `SELECT * FROM jobs.resume_versions
       WHERE id = $1`,
      [application.resume_version_id]
    );

    return NextResponse.json({
      success: true,
      application,
      events: eventsRes.rows,
      resumeVersion: resumeRes.rows[0] || null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { newStatus, notes, nextFollowUpAt } = body;

    if (newStatus) {
      await transitionApplicationStatus(id, newStatus as ApplicationStatus, 'UI', notes);
    }

    if (nextFollowUpAt) {
      await pool.query(
        `UPDATE jobs.applications SET next_follow_up_at = $1, updated_at = NOW() WHERE id = $2`,
        [nextFollowUpAt, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
