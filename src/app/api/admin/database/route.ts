import { NextRequest, NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';

const ADMIN_PASSWORD = 'intertekqc';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, action } = body;

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: 'Password administrator salah' }, { status: 401 });
    }

    if (action === 'reset') {
      await initDatabase(true);
      const countRes = await query('SELECT COUNT(*) FROM materials');
      return NextResponse.json({
        success: true,
        message: 'Database berhasil di-reset dan di-seed dengan material standar LabLogix!',
        totalMaterials: parseInt(countRes.rows[0].count, 10),
      });
    }

    // Default info check
    const countRes = await query('SELECT COUNT(*) FROM materials');
    return NextResponse.json({
      success: true,
      status: 'Connected',
      database: 'PostgreSQL 16 (Dokploy Container)',
      host: '149.41.198.83:5432 (Internal: inve-db-gfhbad:5432)',
      dbName: 'inve_db',
      s3Endpoint: process.env.S3_ENDPOINT || 'http://149.41.198.83:9000',
      s3Bucket: process.env.S3_BUCKET || 'inve-storage',
      totalMaterials: parseInt(countRes.rows[0].count, 10),
      adminerUrl: 'http://149.41.198.83:8080',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
