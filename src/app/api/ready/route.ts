import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const res = await pool.query('SELECT 1 as ready');
    const isReady = res.rows.length > 0;
    return NextResponse.json({
      status: isReady ? 'ready' : 'not_ready',
      database: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'not_ready', error: error.message },
      { status: 503 }
    );
  }
}
