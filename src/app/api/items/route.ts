import { NextRequest, NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';
import { itemSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    await initDatabase();
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const filter = searchParams.get('filter') || ''; // 'low_stock', 'expiring', 'expired'

    let sql = `
      SELECT 
        id, code, name, category, cas_number, unit,
        current_stock::float as current_stock,
        minimum_stock::float as minimum_stock,
        location, batch_number,
        TO_CHAR(expiry_date, 'YYYY-MM-DD') as expiry_date,
        hazard_classification, document_url, document_name, notes,
        created_at, updated_at,
        CASE 
          WHEN current_stock <= minimum_stock THEN true 
          ELSE false 
        END as is_low_stock,
        CASE 
          WHEN expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE THEN 'expired'
          WHEN expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
          ELSE 'good'
        END as expiry_status
      FROM items
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (name ILIKE $${params.length} OR code ILIKE $${params.length} OR cas_number ILIKE $${params.length} OR location ILIKE $${params.length})`;
    }

    if (category && category !== 'All') {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (filter === 'low_stock') {
      sql += ` AND current_stock <= minimum_stock`;
    } else if (filter === 'expiring') {
      sql += ` AND expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'`;
    } else if (filter === 'expired') {
      sql += ` AND expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE`;
    }

    sql += ` ORDER BY name ASC`;

    const res = await query(sql, params);
    return NextResponse.json({ success: true, items: res.rows });
  } catch (err: any) {
    console.error('Error fetching items:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDatabase();
    const body = await req.json();
    
    // Validate with Zod
    const validation = itemSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten() },
        { status: 400 }
      );
    }

    const d = validation.data;
    const insertSql = `
      INSERT INTO items (
        code, name, category, cas_number, unit,
        current_stock, minimum_stock, location,
        batch_number, expiry_date, hazard_classification,
        document_url, document_name, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      d.code,
      d.name,
      d.category,
      d.cas_number || null,
      d.unit,
      d.current_stock,
      d.minimum_stock,
      d.location,
      d.batch_number || null,
      d.expiry_date || null,
      d.hazard_classification,
      d.document_url || null,
      d.document_name || null,
      d.notes || null,
    ];

    const res = await query(insertSql, values);
    const createdItem = res.rows[0];

    // Record initial stock transaction
    if (d.current_stock > 0) {
      await query(
        `INSERT INTO stock_transactions 
          (item_id, transaction_type, quantity, previous_stock, new_stock, purpose, performed_by, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          createdItem.id,
          'IN',
          d.current_stock,
          0,
          d.current_stock,
          'Initial Receipt',
          'System Inventory Entry',
          'Initial stock creation'
        ]
      );
    }

    return NextResponse.json({ success: true, item: createdItem }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating item:', err);
    if (err.code === '23505') { // Unique constraint violation on item code
      return NextResponse.json(
        { success: false, error: 'An item with this Item Code already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
