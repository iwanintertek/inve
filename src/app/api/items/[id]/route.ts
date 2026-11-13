import { NextRequest, NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';
import { itemSchema } from '@/lib/validations';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDatabase();
    const { id } = await params;
    const itemRes = await query(
      `SELECT *, 
        current_stock::float as current_stock,
        minimum_stock::float as minimum_stock,
        TO_CHAR(expiry_date, 'YYYY-MM-DD') as expiry_date
       FROM items WHERE id = $1`,
      [id]
    );

    if (itemRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    const txRes = await query(
      `SELECT *, quantity::float as quantity, previous_stock::float as previous_stock, new_stock::float as new_stock
       FROM stock_transactions 
       WHERE item_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [id]
    );

    return NextResponse.json({
      success: true,
      item: itemRes.rows[0],
      transactions: txRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDatabase();
    const { id } = await params;
    const body = await req.json();

    const validation = itemSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten() },
        { status: 400 }
      );
    }

    const d = validation.data;
    const updateSql = `
      UPDATE items SET
        code = $1,
        name = $2,
        category = $3,
        cas_number = $4,
        unit = $5,
        minimum_stock = $6,
        location = $7,
        batch_number = $8,
        expiry_date = $9,
        hazard_classification = $10,
        document_url = COALESCE($11, document_url),
        document_name = COALESCE($12, document_name),
        notes = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `;

    const values = [
      d.code,
      d.name,
      d.category,
      d.cas_number || null,
      d.unit,
      d.minimum_stock,
      d.location,
      d.batch_number || null,
      d.expiry_date || null,
      d.hazard_classification,
      d.document_url || null,
      d.document_name || null,
      d.notes || null,
      id,
    ];

    const res = await query(updateSql, values);
    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDatabase();
    const { id } = await params;
    await query('DELETE FROM items WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Item deleted' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
