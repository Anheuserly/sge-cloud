const { Pool } = require('pg');

async function createPaymentConfigs() {
  const pool = new Pool({ connectionString: 'postgresql://localhost:5432/amcmep' });

  try {
    await pool.query('BEGIN');

    // 1. Create payment_configs table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        active BOOLEAN DEFAULT true,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        upi_id VARCHAR(255),
        account_holder VARCHAR(255),
        account_number TEXT,
        ifsc VARCHAR(50),
        bank_name VARCHAR(255),
        qr_object_key TEXT,
        project_key TEXT,
        owner_type VARCHAR(100),
        owner_id TEXT,
        display_name VARCHAR(255)
      );
    `);

    console.log('Created payment_configs table in amcmep database.');

    // 2. Insert initial official record
    const initialRecord = {
      id: "fdfbf9a0-875b-4a9e-ba70-20ca547fe192",
      project_key: "amcmep",
      owner_type: "platform",
      owner_id: "official",
      display_name: "Official payment account",
      upi_id: "pos.5305155@indus",
      account_holder: "SHREE GANESH ENTERPRISES PVT LTD",
      account_number: "252502199866",
      ifsc: "INDB0000161",
      bank_name: null,
      qr_object_key: null,
      active: true,
      metadata: {
        "$id": "6888c8d500033a37cb91",
        "GST": "18",
        "upiId": "pos.5305155@indus",
        "currency": "INR",
        "ifscCode": "INDB0000161",
        "$sequence": "1",
        "updatedAt": null,
        "$createdAt": "2025-07-29T13:12:54.825+00:00",
        "$updatedAt": "2025-07-29T15:46:36.195+00:00",
        "branchName": "Vasant Kunj Branch",
        "$databaseId": "680b2cfb002805548743",
        "accountName": "SHREE GANESH ENTERPRISES PVT LTD",
        "$permissions": [],
        "merchantName": "SHREE GANESH ENTERPRISES PVT LTD",
        "$collectionId": "6888bdc300110b2eecca",
        "accountNumber": "252502199866",
        "branchAddress": "Common Cause House, 5, Institutional Area, Nelson Mandela, New Delhi - 110070",
        "paymentMethod": "UPI",
        "paymentGatewayKey": "rzp_test_1234567890",
        "paymentGatewaySecret": "secret_1234567890"
      },
      created_at: "2025-07-29T13:12:54.825Z",
      updated_at: "2025-07-29T15:46:36.195Z"
    };

    await pool.query(`
      INSERT INTO payment_configs (
        id, project_key, owner_type, owner_id, display_name, upi_id, account_holder, account_number, ifsc, bank_name, qr_object_key, active, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        project_key = EXCLUDED.project_key,
        owner_type = EXCLUDED.owner_type,
        owner_id = EXCLUDED.owner_id,
        display_name = EXCLUDED.display_name,
        upi_id = EXCLUDED.upi_id,
        account_holder = EXCLUDED.account_holder,
        account_number = EXCLUDED.account_number,
        ifsc = EXCLUDED.ifsc,
        active = EXCLUDED.active,
        metadata = EXCLUDED.metadata,
        updated_at = EXCLUDED.updated_at;
    `, [
      initialRecord.id,
      initialRecord.project_key,
      initialRecord.owner_type,
      initialRecord.owner_id,
      initialRecord.display_name,
      initialRecord.upi_id,
      initialRecord.account_holder,
      initialRecord.account_number,
      initialRecord.ifsc,
      initialRecord.bank_name,
      initialRecord.qr_object_key,
      initialRecord.active,
      JSON.stringify(initialRecord.metadata),
      initialRecord.created_at,
      initialRecord.updated_at
    ]);

    await pool.query('COMMIT');
    console.log('Successfully inserted initial payment_config record!');

    // Verify created table & record
    const verifyRes = await pool.query(`SELECT * FROM payment_configs;`);
    console.log('\n=== VERIFIED PAYMENT_CONFIGS RECORD ===');
    console.log(JSON.stringify(verifyRes.rows, null, 2));

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error creating payment_configs:', err);
  } finally {
    await pool.end();
  }
}

createPaymentConfigs();
