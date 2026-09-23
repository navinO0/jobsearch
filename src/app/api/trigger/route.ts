import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const mode = body.mode || 'search'; // 'search' or 'recovery'

    const webhookUrl =
      mode === 'recovery'
        ? (process.env.N8N_RECOVERY_WEBHOOK_URL || 'http://n8n-ktxhkuiuzp3gnwgrggc15ekz:5678/webhook/job-recovery-trigger')
        : (process.env.N8N_WEBHOOK_URL || 'http://n8n-ktxhkuiuzp3gnwgrggc15ekz:5678/webhook/job-pipeline-trigger');

    const res = await fetch(webhookUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'JobPortal-Client/1.0' },
    });

    const data = await res.json().catch(() => ({ message: 'Workflow started' }));

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      mode,
      message: data.message || 'Pipeline triggered successfully',
    });
  } catch (error: any) {
    console.error('Error triggering n8n webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to trigger n8n pipeline' },
      { status: 500 }
    );
  }
}
