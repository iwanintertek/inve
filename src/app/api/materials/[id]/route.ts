import { NextRequest, NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';
import { materialSchema } from '@/lib/validations';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDatabase();
    const { id } = await params;
    const res = await query(
      `SELECT 
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
       FROM materials WHERE id = $1`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Material not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, material: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDatabase();
    const { id } = await params;
    const body = await req.json();

    const validation = materialSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten() },
        { status: 400 }
      );
    }

    const d = validation.data;
    const updateSql = `
      UPDATE materials SET
        status = $1,
        delivery_date = $2,
        point_of_origin = $3,
        point_of_delivery = $4,
        shipping_requirements = $5,
        shipment_by = $6,
        item_description = $7,
        technical_proposal_status = $8,
        cost_proposal_status = $9,
        status_coff = $10,
        no_coff = $11,
        analysis_requested = $12,
        final_status_report = $13,
        remark_raw = $14,
        remark_structured = $15,
        remark_parse_note = $16,
        file_url = $17,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $18
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
      d.status,
      d.deliveryDate || null,
      d.pointOfOrigin,
      d.pointOfDelivery,
      d.shippingRequirements || null,
      d.shipmentBy || null,
      d.itemDescription,
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
      id,
    ];

    const res = await query(updateSql, values);
    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Material not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, material: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDatabase();
    const { id } = await params;
    await query('DELETE FROM materials WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Material deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
