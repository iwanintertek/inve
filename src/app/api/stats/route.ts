import { NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';

export async function GET() {
  try {
    await initDatabase();

    const statsRes = await query(`
      SELECT 
        COUNT(*)::int as total_items,
        COUNT(CASE WHEN current_stock <= minimum_stock THEN 1 END)::int as low_stock_count,
        COUNT(CASE WHEN expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND expiry_date >= CURRENT_DATE THEN 1 END)::int as expiring_count,
        COUNT(CASE WHEN expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE THEN 1 END)::int as expired_count
      FROM items
    `);

    const catRes = await query(`
      SELECT category, COUNT(*)::int as count 
      FROM items 
      GROUP BY category 
      ORDER BY count DESC
    `);

    const txCountRes = await query(`
      SELECT COUNT(*)::int as total_tx 
      FROM stock_transactions
    `);

    return NextResponse.json({
      success: true,
      stats: statsRes.rows[0],
      categories: catRes.rows,
      totalTransactions: txCountRes.rows[0].total_tx,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
