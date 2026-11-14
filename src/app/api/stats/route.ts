import { NextResponse } from 'next/server';
import { query, initDatabase, isHeaderRow } from '@/lib/db';

export async function GET() {
  try {
    await initDatabase();

    const allRes = await query(`
      SELECT id, no, status, item_description
      FROM materials
    `);

    const validRows = allRes.rows.filter(r => !isHeaderRow(r));

    let total = validRows.length;
    let onTheWay = 0;
    let analysis = 0;
    let canceled = 0;
    let done = 0;

    for (const r of validRows) {
      const s = (r.status || '').trim();
      if (s === 'On The Way') onTheWay++;
      else if (s === 'Analysis') analysis++;
      else if (s === 'Canceled') canceled++;
      else if (s === 'Done') done++;
    }

    return NextResponse.json({
      success: true,
      stats: {
        total_materials: total,
        on_the_way: onTheWay,
        analysis: analysis,
        canceled: canceled,
        done: done,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
