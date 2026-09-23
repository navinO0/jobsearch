import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    const resumes = await pool.query(`
      SELECT r.*, cp.name as candidate_name, cp.email as candidate_email,
             (SELECT count(*) FROM jobs.resume_versions rv WHERE rv.base_resume_id = r.id) as version_count
      FROM jobs.resumes r
      LEFT JOIN jobs.candidate_profiles cp ON r.candidate_id = cp.id
      ORDER BY r.created_at DESC
    `);
    const profiles = await pool.query('SELECT * FROM jobs.candidate_profiles ORDER BY updated_at DESC');

    return NextResponse.json({
      resumes: resumes.rows,
      profiles: profiles.rows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, location, skills = [], experience = [], education = [], rawText = '' } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const candidateId = `cand_${crypto.randomUUID().substring(0, 12)}`;
    await pool.query(
      `INSERT INTO jobs.candidate_profiles (id, name, email, phone, location, skills, experience, education, raw_text, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, skills = EXCLUDED.skills, updated_at = NOW()`,
      [
        candidateId,
        name,
        email,
        phone || null,
        location || null,
        JSON.stringify(skills),
        JSON.stringify(experience),
        JSON.stringify(education),
        rawText,
      ]
    );

    const resumeId = `res_${crypto.randomUUID().substring(0, 12)}`;
    await pool.query(
      `INSERT INTO jobs.resumes (id, candidate_id, file_name, mime_type, file_size_bytes, storage_path, is_master, parsed_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        resumeId,
        candidateId,
        `${name.replace(/\s+/g, '_')}_Master_Resume.pdf`,
        'application/pdf',
        1024,
        `/storage/resumes/${resumeId}.pdf`,
        true,
        JSON.stringify({ skills, experience, education }),
      ]
    );

    return NextResponse.json({
      success: true,
      candidateId,
      resumeId,
      message: 'Master resume profile saved successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
