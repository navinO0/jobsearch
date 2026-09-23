import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { application_status } = body;

    if (!application_status) {
      return NextResponse.json(
        { success: false, error: 'Missing application_status' },
        { status: 400 }
      );
    }

    const isApplied = application_status === 'APPLIED';
    const sql = `
      UPDATE jobs 
      SET 
        application_status = $1,
        application_submitted_at = CASE WHEN $2 = true THEN NOW() ELSE application_submitted_at END,
        updated_at = NOW()
      WHERE id = $3
      RETURNING id, application_status, application_submitted_at;
    `;
    const res = await pool.query(sql, [application_status, isApplied, parseInt(id, 10)]);

    if (res.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: res.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating job status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
