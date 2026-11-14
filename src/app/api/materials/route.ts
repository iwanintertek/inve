import { NextRequest, NextResponse } from 'next/server';
import { query, initDatabase, isHeaderRow } from '@/lib/db';
import { materialSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    await initDatabase();
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';

    let sql = `
      SELECT 
        id,
        no,
        status,
        delivery_date as "deliveryDate",
        point_of_origin as "pointOfOrigin",
        point_of_delivery as "pointOfDelivery",
        shipping_requirements as "shippingRequirements",
        shipment_by as "shipmentBy",
        item_description as "itemDescription",
        pic,
        technical_proposal_status as "technicalProposalStatus",
        cost_proposal_status as "costProposalStatus",
        status_coff as "statusCoff",
        no_coff as "noCoff",
        analysis_requested as "analysisRequested",
        final_status_report as "finalStatusReport",
        remark_raw as "remarkRaw",
        remark_structured as "remarkStructured",
        remark_parse_note as "remarkParseNote",
        file_url as "fileUrl",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM materials
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (
        item_description ILIKE $${params.length} OR 
        no ILIKE $${params.length} OR 
        pic ILIKE $${params.length} OR 
        point_of_origin ILIKE $${params.length} OR 
        point_of_delivery ILIKE $${params.length} OR 
        analysis_requested ILIKE $${params.length} OR 
        shipment_by ILIKE $${params.length} OR
        no_coff ILIKE $${params.length}
      )`;
    }

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ` ORDER BY id ASC`;

    const res = await query(sql, params);

    // Filter out header row if accidentally stored
    const cleanMaterials = res.rows.filter(row => !isHeaderRow(row));

    return NextResponse.json({ success: true, materials: cleanMaterials });
  } catch (err: any) {
    console.error('Error fetching materials:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDatabase();
    const body = await req.json();

    const validation = materialSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten() },
        { status: 400 }
      );
    }

    const d = validation.data;

    // Auto-calculate sequential 'no' if not provided
    let itemNo = d.no;
    if (!itemNo) {
      const countRes = await query('SELECT COUNT(*) FROM materials');
      const nextNum = parseInt(countRes.rows[0].count, 10) + 1;
      itemNo = String(nextNum).padStart(3, '0');
    }

    const insertSql = `
      INSERT INTO materials (
        no, status, delivery_date, point_of_origin, point_of_delivery,
        shipping_requirements, shipment_by, item_description, pic,
        technical_proposal_status, cost_proposal_status, status_coff,
        no_coff, analysis_requested, final_status_report, remark_raw,
        remark_structured, remark_parse_note, file_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING 
        id, no, status,
        delivery_date as "deliveryDate",
        point_of_origin as "pointOfOrigin",
        point_of_delivery as "pointOfDelivery",
        shipping_requirements as "shippingRequirements",
        shipment_by as "shipmentBy",
        item_description as "itemDescription",
        pic,
        technical_proposal_status as "technicalProposalStatus",
        cost_proposal_status as "costProposalStatus",
        status_coff as "statusCoff",
        no_coff as "noCoff",
        analysis_requested as "analysisRequested",
        final_status_report as "finalStatusReport",
        remark_raw as "remarkRaw",
        remark_structured as "remarkStructured",
        remark_parse_note as "remarkParseNote",
        file_url as "fileUrl",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const values = [
      itemNo,
      d.status || 'On The Way',
      d.deliveryDate || null,
      d.pointOfOrigin,
      d.pointOfDelivery,
      d.shippingRequirements || null,
      d.shipmentBy || null,
      d.itemDescription,
      d.pic,
      d.technicalProposalStatus || null,
      d.costProposalStatus || null,
      d.statusCoff || null,
      d.noCoff || null,
      d.analysisRequested || null,
      d.finalStatusReport || null,
      d.remarkRaw || null,
      d.remarkStructured || null,
      d.remarkParseNote || null,
      d.fileUrl || null,
    ];

    const res = await query(insertSql, values);
    return NextResponse.json({ success: true, material: res.rows[0] }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating material:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
