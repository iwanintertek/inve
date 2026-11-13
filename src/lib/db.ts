import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://inve_user:InveLab2026SecurePass@149.41.198.83:5432/inve_db';

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

let initialized = false;

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export async function initDatabase() {
  if (initialized) return;

  try {
    // 1. Create items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        cas_number VARCHAR(100),
        unit VARCHAR(50) NOT NULL,
        current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
        minimum_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
        location VARCHAR(100) NOT NULL,
        batch_number VARCHAR(100),
        expiry_date DATE,
        hazard_classification VARCHAR(50) DEFAULT 'none',
        document_url TEXT,
        document_name VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create stock_transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_transactions (
        id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
        transaction_type VARCHAR(20) NOT NULL, -- IN, OUT, ADJUSTMENT
        quantity NUMERIC(12, 2) NOT NULL,
        previous_stock NUMERIC(12, 2) NOT NULL,
        new_stock NUMERIC(12, 2) NOT NULL,
        purpose VARCHAR(255),
        performed_by VARCHAR(100) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Seed sample laboratory inventory data if empty
    const checkCount = await pool.query('SELECT COUNT(*) FROM items');
    if (parseInt(checkCount.rows[0].count, 10) === 0) {
      console.log('Seeding initial laboratory items...');
      const seedItems = [
        {
          code: 'CHM-ETH-01',
          name: 'Ethanol Absolute 99.8% AR Grade',
          category: 'Chemical',
          cas_number: '64-17-5',
          unit: 'L',
          current_stock: 15.0,
          minimum_stock: 5.0,
          location: 'Flammable Cabinet A',
          batch_number: 'LOT-2026-ETH01',
          expiry_date: '2027-12-31',
          hazard_classification: 'flammable',
          notes: 'Standard solvent for extractions and sterilization'
        },
        {
          code: 'CHM-HCL-02',
          name: 'Hydrochloric Acid 37% fuming AR',
          category: 'Chemical',
          cas_number: '7647-01-0',
          unit: 'L',
          current_stock: 2.5,
          minimum_stock: 4.0,
          location: 'Acid Cabinet 1',
          batch_number: 'LOT-2025-HCL09',
          expiry_date: '2026-11-20', // Expiring very soon!
          hazard_classification: 'corrosive',
          notes: 'Needs reorder, stock is below minimum threshold'
        },
        {
          code: 'BIO-AGAR-01',
          name: 'Nutrient Agar Powder 500g',
          category: 'Biological',
          cas_number: '9002-18-0',
          unit: 'bottle',
          current_stock: 8.0,
          minimum_stock: 2.0,
          location: 'Dry Storage Shelf 2',
          batch_number: 'LOT-2026-AGR55',
          expiry_date: '2028-06-30',
          hazard_classification: 'none',
          notes: 'General purpose culture media'
        },
        {
          code: 'GLS-BEAK-100',
          name: 'Beaker Borosilicate Glass 250 mL',
          category: 'Glassware',
          cas_number: null,
          unit: 'pcs',
          current_stock: 24.0,
          minimum_stock: 10.0,
          location: 'Glassware Cabinet B-2',
          batch_number: null,
          expiry_date: null,
          hazard_classification: 'none',
          notes: 'Pyrex/Borosilicate thermal shock resistant'
        },
        {
          code: 'CON-NIT-M',
          name: 'Nitrile Gloves Powder-Free (Medium)',
          category: 'Consumable',
          cas_number: null,
          unit: 'box',
          current_stock: 3.0,
          minimum_stock: 5.0,
          location: 'PPE Rack Room 101',
          batch_number: 'LOT-GLV-26',
          expiry_date: '2029-01-01',
          hazard_classification: 'none',
          notes: '100 pcs per box'
        },
        {
          code: 'EQP-PH-01',
          name: 'Digital Benchtop pH Meter (Mettler)',
          category: 'Equipment',
          cas_number: null,
          unit: 'unit',
          current_stock: 2.0,
          minimum_stock: 1.0,
          location: 'Instrument Bench 3',
          batch_number: 'SN-MT-884920',
          expiry_date: null,
          hazard_classification: 'none',
          notes: 'Calibrated monthly with pH 4.01, 7.00, 10.01 buffers'
        }
      ];

      for (const item of seedItems) {
        const res = await pool.query(
          `INSERT INTO items 
            (code, name, category, cas_number, unit, current_stock, minimum_stock, location, batch_number, expiry_date, hazard_classification, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING id`,
          [
            item.code,
            item.name,
            item.category,
            item.cas_number,
            item.unit,
            item.current_stock,
            item.minimum_stock,
            item.location,
            item.batch_number,
            item.expiry_date,
            item.hazard_classification,
            item.notes
          ]
        );

        // Add initial stock IN transaction
        await pool.query(
          `INSERT INTO stock_transactions
            (item_id, transaction_type, quantity, previous_stock, new_stock, purpose, performed_by, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            res.rows[0].id,
            'IN',
            item.current_stock,
            0,
            item.current_stock,
            'Initial Inventory Setup',
            'System Admin',
            'Initial stock received'
          ]
        );
      }
      console.log('Seeding completed successfully!');
    }

    initialized = true;
  } catch (err) {
    console.error('Failed to initialize database tables:', err);
    throw err;
  }
}

export default pool;
