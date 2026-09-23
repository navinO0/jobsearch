import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const dbTest = await pool.query('SELECT 1 as healthy');
    return NextResponse.json({
      status: 'healthy',
      database: dbTest.rows.length > 0 ? 'connected' : 'error',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    );
  }
}
