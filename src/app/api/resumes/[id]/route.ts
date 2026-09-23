import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resumeRes = await pool.query(
      `SELECT r.*, cp.name as candidate_name, cp.email as candidate_email, cp.phone as candidate_phone,
              cp.location as candidate_location, cp.headline as candidate_headline, cp.summary as candidate_summary,
              cp.skills as candidate_skills, cp.experience as candidate_experience,
              cp.education as candidate_education, cp.projects as candidate_projects,
              cp.certifications as candidate_certifications
       FROM jobs.resumes r
       LEFT JOIN jobs.candidate_profiles cp ON r.candidate_id = cp.id
       WHERE r.id = $1`,
      [id]
    );

    if (resumeRes.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Resume not found' }, { status: 404 });
    }

    const versionsRes = await pool.query(
      `SELECT rv.*, j.job_title, j.company_name
       FROM jobs.resume_versions rv
       LEFT JOIN jobs.jobs j ON rv.job_id = j.id
       WHERE rv.base_resume_id = $1
       ORDER BY rv.created_at DESC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      resume: resumeRes.rows[0],
      versions: versionsRes.rows,
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
    const { name, email, phone, location, headline, summary, skills, experience, education } = body;

    // Get candidate_id from resume
    const rRes = await pool.query('SELECT candidate_id FROM jobs.resumes WHERE id = $1', [id]);
    if (rRes.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Resume not found' }, { status: 404 });
    }
    const candidateId = rRes.rows[0].candidate_id;

    await pool.query(
      `UPDATE jobs.candidate_profiles
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           location = COALESCE($4, location),
           headline = COALESCE($5, headline),
           summary = COALESCE($6, summary),
           skills = COALESCE($7::jsonb, skills),
           experience = COALESCE($8::jsonb, experience),
           education = COALESCE($9::jsonb, education),
           updated_at = NOW()
       WHERE id = $10`,
      [
        name,
        email,
        phone,
        location,
        headline,
        summary,
        skills ? JSON.stringify(skills) : null,
        experience ? JSON.stringify(experience) : null,
        education ? JSON.stringify(education) : null,
        candidateId,
      ]
    );

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
