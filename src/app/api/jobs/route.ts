import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const minScore = parseInt(searchParams.get('min_score') || '0', 10);
    const remoteType = searchParams.get('remote_type') || '';
    const source = searchParams.get('source') || '';
    const appStatus = searchParams.get('status') || '';
    const deduplicate = searchParams.get('deduplicate') !== 'false'; // default true
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(
        `(job_title ILIKE $${paramIndex} OR company_name ILIKE $${paramIndex} OR location ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (minScore > 0) {
      conditions.push(`profile_match_score >= $${paramIndex}`);
      params.push(minScore);
      paramIndex++;
    }

    if (remoteType) {
      conditions.push(`remote_type ILIKE $${paramIndex}`);
      params.push(`%${remoteType}%`);
      paramIndex++;
    }

    if (source) {
      conditions.push(`source = $${paramIndex}`);
      params.push(source);
      paramIndex++;
    }

    if (appStatus && appStatus !== 'ALL') {
      conditions.push(`application_status = $${paramIndex}`);
      params.push(appStatus);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Total filtered count
    const countSql = `SELECT count(*) as total FROM jobs WHERE ${whereClause}`;
    const countRes = await pool.query(countSql, params);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    // Filtered jobs sorted by match score and latest seen
    const queryParams = [...params, limit, offset];
    const jobsSql = `
      SELECT 
        id, fingerprint, source, source_job_id, company_name, company_domain,
        job_title, description, location, remote_type, employment_type, seniority,
        salary_min, salary_max, salary_currency, posted_at, application_url, canonical_url,
        skills, technologies, profile_match_score, match_reason, match_status,
        match_details, telegram_sent, telegram_sent_at, application_status,
        remarks, applied_at, interview_date, recruiter_email,
        first_seen_at, last_seen_at
      FROM jobs 
      WHERE ${whereClause}
      ORDER BY 
        CASE WHEN profile_match_score IS NOT NULL THEN 0 ELSE 1 END,
        profile_match_score DESC,
        last_seen_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const jobsRes = await pool.query(jobsSql, queryParams);

    // Global dashboard statistics
    const statsSql = `
      SELECT 
        count(*) as total_jobs,
        count(CASE WHEN profile_match_score >= 75 THEN 1 END) as high_matches,
        count(CASE WHEN application_status = 'WISHLIST' THEN 1 END) as wishlist_count,
        count(CASE WHEN application_status = 'SAVED' THEN 1 END) as saved_count,
        count(CASE WHEN application_status = 'APPLIED' THEN 1 END) as applied_count,
        count(CASE WHEN application_status IN ('INTERVIEW_ATTENDED', 'INTERVIEWING') THEN 1 END) as interview_count,
        count(DISTINCT source) as active_sources
      FROM jobs;
    `;
    const statsRes = await pool.query(statsSql);
    const stats = statsRes.rows[0] || {};

    return NextResponse.json({
      success: true,
      data: jobsRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalJobs: parseInt(stats.total_jobs || '0', 10),
        highMatches: parseInt(stats.high_matches || '0', 10),
        wishlistCount: parseInt(stats.wishlist_count || '0', 10),
        savedCount: parseInt(stats.saved_count || '0', 10),
        appliedCount: parseInt(stats.applied_count || '0', 10),
        interviewCount: parseInt(stats.interview_count || '0', 10),
        activeSources: parseInt(stats.active_sources || '0', 10),
      },
    });
  } catch (error: any) {
    console.error('Error fetching jobs feed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
