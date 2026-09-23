import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const messagesRes = await pool.query(
      `SELECT tm.*, j.job_title, j.company_name
       FROM jobs.telegram_messages tm
       LEFT JOIN jobs.jobs j ON tm.job_id = j.id
       ORDER BY tm.created_at DESC
       LIMIT 50;`
    );

    const callbacksRes = await pool.query(
      `SELECT * FROM jobs.telegram_callbacks
       ORDER BY created_at DESC
       LIMIT 50;`
    );

    return NextResponse.json({
      success: true,
      messages: messagesRes.rows,
      callbacks: callbacksRes.rows,
      botConfig: {
        chatId: process.env.TELEGRAM_CHAT_ID || '617149298',
        botConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
        minScoreThreshold: 70,
        oneByOne: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, chatId = process.env.TELEGRAM_CHAT_ID || '617149298', text } = body;

    if (action === 'test_message') {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return NextResponse.json(
          { success: false, error: 'TELEGRAM_BOT_TOKEN is not configured in environment' },
          { status: 400 }
        );
      }

      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const res = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text || '🤖 <b>Antigravity Job Search Bot</b>\n\nConnected successfully to host notification pipeline.',
          parse_mode: 'HTML',
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        return NextResponse.json(
          { success: false, error: data.description || 'Telegram API rejected message' },
          { status: 400 }
        );
      }

      // Log sent test message
      await pool.query(
        `INSERT INTO jobs.telegram_messages (id, chat_id, message_id, message_type, status, sent_at)
         VALUES ($1, $2, $3, 'TEST_ALERT', 'SENT', NOW());`,
        [`tm_${Date.now()}`, String(chatId), data.result.message_id]
      );

      return NextResponse.json({ success: true, messageId: data.result.message_id });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
