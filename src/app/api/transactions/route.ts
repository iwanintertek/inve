import { NextRequest, NextResponse } from 'next/server';
import pool, { query, initDatabase } from '@/lib/db';
import { stockTransactionSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    await initDatabase();
    const searchParams = req.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const sql = `
      SELECT 
        st.id,
        st.item_id,
        st.transaction_type,
        st.quantity::float as quantity,
        st.previous_stock::float as previous_stock,
        st.new_stock::float as new_stock,
        st.purpose,
        st.performed_by,
        st.notes,
        st.created_at,
        i.name as item_name,
        i.code as item_code,
        i.unit as item_unit,
        i.category as item_category
      FROM stock_transactions st
      JOIN items i ON st.item_id = i.id
      ORDER BY st.created_at DESC
      LIMIT $1
    `;

    const res = await query(sql, [limit]);
    return NextResponse.json({ success: true, transactions: res.rows });
  } catch (err: any) {
    console.error('Error fetching transactions:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    await initDatabase();
    const body = await req.json();

    const validation = stockTransactionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { item_id, transaction_type, quantity, purpose, performed_by, notes } = validation.data;

    await client.query('BEGIN');

    // Lock the item row to prevent race conditions
    const itemRes = await client.query(
      'SELECT id, name, current_stock::float as current_stock, unit FROM items WHERE id = $1 FOR UPDATE',
      [item_id]
    );

    if (itemRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    const currentStock = itemRes.rows[0].current_stock;
    let newStock = currentStock;

    if (transaction_type === 'IN') {
      newStock = currentStock + quantity;
    } else if (transaction_type === 'OUT') {
      if (currentStock < quantity) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock. Current stock is ${currentStock} ${itemRes.rows[0].unit}, cannot withdraw ${quantity} ${itemRes.rows[0].unit}.`
          },
          { status: 400 }
        );
      }
      newStock = currentStock - quantity;
    } else if (transaction_type === 'ADJUSTMENT') {
      newStock = quantity; // In adjustment, quantity is the audited actual count
    }

    // Update item stock
    await client.query(
      'UPDATE items SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStock, item_id]
    );

    // Insert transaction log
    const txRes = await client.query(
      `INSERT INTO stock_transactions 
        (item_id, transaction_type, quantity, previous_stock, new_stock, purpose, performed_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [item_id, transaction_type, quantity, currentStock, newStock, purpose || null, performed_by, notes || null]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      transaction: txRes.rows[0],
      newStock,
      message: `Stock successfully updated to ${newStock} ${itemRes.rows[0].unit}`
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
