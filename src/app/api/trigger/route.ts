import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const mode = body.mode || 'search';

    // Generate unique run tracking ID
    const runId = 'run_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

    // Record initial run in database
    try {
      await pool.query(
        `INSERT INTO jobs.job_runs (run_id, started_at, status, sources_attempted, metadata) 
         VALUES ($1, NOW(), 'running', 9, $2)
         ON CONFLICT (run_id) DO NOTHING`,
        [runId, JSON.stringify({ mode, criteria: body })]
      );
    } catch (dbErr) {
      console.warn('Could not record initial job_run in DB:', dbErr);
    }

    // Determine target webhook URL
    let webhookUrl = process.env.N8N_SEARCH_WEBHOOK || process.env.N8N_WEBHOOK_URL || 'http://10.0.3.6:5678/webhook/job-search';
    if (mode === 'recovery') {
      webhookUrl = process.env.N8N_RECOVERY_WEBHOOK_URL || 'http://10.0.3.6:5678/webhook/job-recovery-trigger';
    }

    // Format criteria payload for n8n
    const payload = {
      run_id: runId,
      profile_name: body.profileName || 'Default Search Profile',
      titles: body.targetRoles || ['Node.js Developer', 'Backend Developer'],
      must_have_skills: body.mustHaveSkills || ['Node.js', 'PostgreSQL', 'TypeScript'],
      exclude_keywords: body.excludeKeywords || ['Unpaid', 'Intern'],
      remote_type: body.workMode || 'REMOTE',
      min_salary: body.minSalary || 0,
      min_score: body.aiMatchThreshold || 70,
      batch_size: body.batchSize || 15,
      url: body.url || null
    };

    let n8nResponse: any = null;
    let n8nStatus = 200;

    try {
      // First attempt: POST with criteria payload
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'JobPortal-Client/1.0' 
        },
        body: JSON.stringify(payload)
      });
      n8nStatus = res.status;
      n8nResponse = await res.json().catch(() => ({ message: 'Workflow triggered' }));
    } catch (postErr) {
      // Fallback attempt: GET if POST not accepted
      try {
        const fallbackUrl = webhookUrl.replace('/job-search', '/job-pipeline-trigger');
        const getRes = await fetch(fallbackUrl, {
          method: 'GET',
          headers: { 'User-Agent': 'JobPortal-Client/1.0' }
        });
        n8nStatus = getRes.status;
        n8nResponse = await getRes.json().catch(() => ({ message: 'Fallback workflow started' }));
      } catch (getErr) {
        console.warn('Webhook connection error:', getErr);
      }
    }

    return NextResponse.json({
      success: true,
      run_id: runId,
      status: n8nStatus,
      mode,
      message: n8nResponse?.message || 'Pipeline triggered successfully',
      criteria: payload
    });
  } catch (error: any) {
    console.error('Error triggering n8n webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to trigger n8n pipeline' },
      { status: 500 }
    );
  }
}
