import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const res = await pool.query(
      `SELECT * FROM job_profiles WHERE id = 'default' LIMIT 1;`
    );
    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      profile: res.rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      profile_name,
      target_titles,
      target_keywords,
      include_keywords,
      exclude_keywords,
      required_skills,
      preferred_skills,
      experience_years,
      education,
      locations,
      remote_preference,
      hybrid_preference,
      onsite_preference,
      employment_types,
      notice_period,
      salary_min,
      salary_max,
      technology_stack,
      target_countries,
      target_cities,
      min_match_score,
      telegram_chat_id,
    } = body;

    const sql = `
      INSERT INTO job_profiles (
        id, is_active, profile_name, target_titles, target_keywords,
        include_keywords, exclude_keywords, required_skills, preferred_skills,
        experience_years, education, locations, remote_preference,
        hybrid_preference, onsite_preference, employment_types, notice_period,
        salary_min, salary_max, technology_stack, target_countries, target_cities,
        min_match_score, telegram_chat_id, updated_at
      ) VALUES (
        'default', true, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        profile_name = EXCLUDED.profile_name,
        target_titles = EXCLUDED.target_titles,
        target_keywords = EXCLUDED.target_keywords,
        include_keywords = EXCLUDED.include_keywords,
        exclude_keywords = EXCLUDED.exclude_keywords,
        required_skills = EXCLUDED.required_skills,
        preferred_skills = EXCLUDED.preferred_skills,
        experience_years = EXCLUDED.experience_years,
        education = EXCLUDED.education,
        locations = EXCLUDED.locations,
        remote_preference = EXCLUDED.remote_preference,
        hybrid_preference = EXCLUDED.hybrid_preference,
        onsite_preference = EXCLUDED.onsite_preference,
        employment_types = EXCLUDED.employment_types,
        notice_period = EXCLUDED.notice_period,
        salary_min = EXCLUDED.salary_min,
        salary_max = EXCLUDED.salary_max,
        technology_stack = EXCLUDED.technology_stack,
        target_countries = EXCLUDED.target_countries,
        target_cities = EXCLUDED.target_cities,
        min_match_score = EXCLUDED.min_match_score,
        telegram_chat_id = EXCLUDED.telegram_chat_id,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      profile_name || 'Software Engineer',
      JSON.stringify(target_titles || []),
      JSON.stringify(target_keywords || []),
      JSON.stringify(include_keywords || []),
      JSON.stringify(exclude_keywords || []),
      JSON.stringify(required_skills || []),
      JSON.stringify(preferred_skills || []),
      parseInt(experience_years || '3', 10),
      education || 'Bachelor of Engineering / Computer Science',
      JSON.stringify(locations || ['Remote', 'India']),
      Boolean(remote_preference),
      Boolean(hybrid_preference),
      Boolean(onsite_preference),
      JSON.stringify(employment_types || ['Full-time']),
      notice_period || 'Immediate to 30 days',
      parseFloat(salary_min || '0'),
      parseFloat(salary_max || '0'),
      JSON.stringify(technology_stack || []),
      JSON.stringify(target_countries || ['India', 'Remote']),
      JSON.stringify(target_cities || ['Bangalore', 'Hyderabad']),
      parseInt(min_match_score || '55', 10),
      telegram_chat_id || '617149298',
    ];

    const res = await pool.query(sql, values);

    return NextResponse.json({
      success: true,
      profile: res.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
