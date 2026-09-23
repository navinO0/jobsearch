import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      ai: {
        provider: process.env.AI_PROVIDER || 'openrouter',
        matchModel: process.env.AI_MATCH_MODEL || 'deepseek/deepseek-v4-flash-0731:free',
        resumeModel: process.env.AI_RESUME_MODEL || 'anthropic/claude-3.5-sonnet',
        coverLetterModel: process.env.AI_COVER_LETTER_MODEL || 'anthropic/claude-3.5-sonnet',
        researchModel: process.env.AI_RESEARCH_MODEL || 'meta-llama/llama-3.1-8b-instruct:free',
      },
      google: {
        driveConnected: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_OAUTH_CLIENT_ID),
        rootFolder: 'Job Search Assistant',
        sheetsSyncEnabled: true,
        calendarSyncEnabled: true,
      },
      email: {
        senderName: process.env.EMAIL_FROM_NAME || 'Alex Taylor',
        senderEmail: process.env.EMAIL_FROM_ADDRESS || 'alex.taylor@example.com',
        replyTo: process.env.EMAIL_REPLY_TO || 'alex.taylor@example.com',
        dailyLimit: 20,
        hourlyLimit: 5,
        cooldownHours: 48,
        requireApproval: true,
      },
      telegram: {
        botConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
        chatId: process.env.TELEGRAM_CHAT_ID || '617149298',
        oneByOneMode: true,
        minMatchScore: 70,
        notificationsEnabled: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Audit log settings adjustment
    await pool.query(
      `INSERT INTO jobs.audit_logs (action, entity_type, entity_id, actor, details)
       VALUES ('UPDATE_SETTINGS', 'SYSTEM_SETTINGS', 'global', 'admin', $1::jsonb)`,
      [JSON.stringify(body)]
    );

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
