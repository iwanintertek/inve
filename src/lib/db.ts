import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://inve_user:InveLab2026SecurePass@149.41.198.83:5432/inve_db';

const pool = new Pool({
  connectionString,
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 6000,
});

let initialized = false;

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

/**
 * Filter out header rows (e.g. if spreadsheet or CSV header accidentally got inserted)
 * WAJIB lewati baris header (jika no.toLowerCase() === 'no' atau status.toLowerCase() === 'status' atau itemDescription mengandung 'item description')
 */
export function isHeaderRow(row: {
  no?: string | null;
  status?: string | null;
  itemDescription?: string | null;
  item_description?: string | null;
}): boolean {
  const noVal = (row.no || '').trim().toLowerCase();
  const statusVal = (row.status || '').trim().toLowerCase();
  const descVal = (row.itemDescription || row.item_description || '').trim().toLowerCase();

  if (noVal === 'no' || statusVal === 'status' || descVal.includes('item description')) {
    return true;
  }
  return false;
}

export async function initDatabase(forceReset = false) {
  if (initialized && !forceReset) return;

  try {
    // Create materials table supporting all 19 standard attributes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS materials (
        id SERIAL PRIMARY KEY,
        no VARCHAR(50),
        status VARCHAR(50) DEFAULT 'On The Way',
        delivery_date VARCHAR(50),
        point_of_origin VARCHAR(100),
        point_of_delivery VARCHAR(100),
        shipping_requirements TEXT,
        shipment_by VARCHAR(100),
        item_description TEXT NOT NULL,
        pic VARCHAR(100) NOT NULL,
        technical_proposal_status VARCHAR(100),
        cost_proposal_status VARCHAR(100),
        status_coff VARCHAR(100),
        no_coff VARCHAR(100),
        analysis_requested TEXT,
        final_status_report VARCHAR(100),
        remark_raw TEXT,
        remark_structured TEXT,
        remark_parse_note TEXT,
        file_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    if (forceReset) {
      await pool.query('TRUNCATE TABLE materials RESTART IDENTITY CASCADE;');
    }

    const checkCount = await pool.query('SELECT COUNT(*) FROM materials');
    if (parseInt(checkCount.rows[0].count, 10) === 0) {
      console.log('Seeding initial LabLogix material monitoring items...');
      const seedMaterials = [
        {
          no: '001',
          status: 'On The Way',
          delivery_date: '2026-11-14',
          point_of_origin: 'FPU',
          point_of_delivery: 'Intertek Balikpapan',
          shipping_requirements: 'Sample in 1L Amber Glass Bottles, Ambient temperature',
          shipment_by: 'Altus Logistics',
          item_description: 'Crude Oil Sample Wellhead A-12',
          pic: 'Iwan Joko',
          technical_proposal_status: 'Approved',
          cost_proposal_status: 'Accepted',
          status_coff: 'Issued',
          no_coff: 'COFF-2026-081',
          analysis_requested: 'BS&W, API Gravity, Reid Vapor Pressure (RVP), H2S Content',
          final_status_report: 'In Progress',
          remark_raw: '[2026-11-14] Iwan Joko: Sample received at FPU dock.<br> [2026-11-14] Iwan Joko: Handed over to Altus Logistics driver for shipment to Balikpapan.',
          remark_structured: null,
          remark_parse_note: null,
          file_url: null,
        },
        {
          no: '002',
          status: 'Analysis',
          delivery_date: '2026-11-13',
          point_of_origin: 'Intertek Balikpapan',
          point_of_delivery: 'Intertek Balikpapan',
          shipping_requirements: 'Cool box 4°C with ice packs',
          shipment_by: 'Internal Courier',
          item_description: 'Produced Water Sample Platform Alpha',
          pic: 'QC Analyst',
          technical_proposal_status: 'Approved',
          cost_proposal_status: 'Accepted',
          status_coff: 'Issued',
          no_coff: 'COFF-2026-082',
          analysis_requested: 'Oil in Water (OIW), Total Dissolved Solids, pH, Conductivity',
          final_status_report: 'Analyzing',
          remark_raw: '[2026-11-13] QC Analyst: Sample logged into laboratory.<br> [2026-11-14] QC Analyst: Extraction step completed, waiting for IR spectrometry reading.',
          remark_structured: null,
          remark_parse_note: null,
          file_url: null,
        },
        {
          no: '003',
          status: 'Done',
          delivery_date: '2026-11-10',
          point_of_origin: 'ORF',
          point_of_delivery: 'Intertek Jakarta',
          shipping_requirements: 'DOT-3AA Certified Stainless Cylinder',
          shipment_by: 'PSTB Cargo',
          item_description: 'Natural Gas Condensate High Pressure Cylinder',
          pic: 'Handayani',
          technical_proposal_status: 'Approved',
          cost_proposal_status: 'Paid',
          status_coff: 'Completed',
          no_coff: 'COFF-2026-079',
          analysis_requested: 'Extended Gas Chromatography C1-C36+, Mercury Content',
          final_status_report: 'Certificate of Analysis Released',
          remark_raw: '[2026-11-10] Handayani: Cylinder shipped from ORF.<br> [2026-11-12] Lab Tech: GC analysis completed.<br> [2026-11-13] Lead Chemist: Final report verified and COA published.',
          remark_structured: null,
          remark_parse_note: null,
          file_url: null,
        },
        {
          no: '004',
          status: 'Canceled',
          delivery_date: '2026-11-11',
          point_of_origin: 'Somber / Altus',
          point_of_delivery: 'Intertek Balikpapan',
          shipping_requirements: 'Sealed plastic container',
          shipment_by: 'Somber Courier',
          item_description: 'Scale Deposit Coupon from Piping Line 4',
          pic: 'Field Inspector',
          technical_proposal_status: 'Canceled',
          cost_proposal_status: 'Rejected',
          status_coff: 'Canceled',
          no_coff: 'COFF-2026-077',
          analysis_requested: 'XRD Mineralogy, Acid Solubility Test',
          final_status_report: 'Canceled by Client',
          remark_raw: '[2026-11-11] Field Inspector: Coupon damaged during retrieval from line.<br> [2026-11-12] Client: Requested cancellation of test.',
          remark_structured: null,
          remark_parse_note: null,
          file_url: null,
        },
        {
          no: '005',
          status: 'On The Way',
          delivery_date: '2026-11-14',
          point_of_origin: 'PSTB',
          point_of_delivery: 'Intertek Balikpapan',
          shipping_requirements: 'Glass container with secondary containment',
          shipment_by: 'Trucking Express',
          item_description: 'Lubricating Oil Turbine Generator #2',
          pic: 'Iwan Joko',
          technical_proposal_status: 'Approved',
          cost_proposal_status: 'Accepted',
          status_coff: 'Pending',
          no_coff: 'COFF-2026-085',
          analysis_requested: 'Kinematic Viscosity 40°C/100°C, TAN, Water by Karl Fischer, Wear Metals ICP',
          final_status_report: 'In Transit',
          remark_raw: '[2026-11-14] Iwan Joko: Sample packed and en route from PSTB facility.',
          remark_structured: null,
          remark_parse_note: null,
          file_url: null,
        }
      ];

      for (const m of seedMaterials) {
        await pool.query(
          `INSERT INTO materials (
            no, status, delivery_date, point_of_origin, point_of_delivery,
            shipping_requirements, shipment_by, item_description, pic,
            technical_proposal_status, cost_proposal_status, status_coff,
            no_coff, analysis_requested, final_status_report, remark_raw,
            remark_structured, remark_parse_note, file_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
          [
            m.no,
            m.status,
            m.delivery_date,
            m.point_of_origin,
            m.point_of_delivery,
            m.shipping_requirements,
            m.shipment_by,
            m.item_description,
            m.pic,
            m.technical_proposal_status,
            m.cost_proposal_status,
            m.status_coff,
            m.no_coff,
            m.analysis_requested,
            m.final_status_report,
            m.remark_raw,
            m.remark_structured,
            m.remark_parse_note,
            m.file_url,
          ]
        );
      }
      console.log('LabLogix seed completed!');
    }

    initialized = true;
  } catch (err) {
    console.error('Failed to initialize database tables:', err);
    throw err;
  }
}

export default pool;
