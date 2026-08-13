const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const crypto = require('crypto');

const csvPath = '/Volumes/HP_P500/GitHub/flutter-projects/flutter_application_14amcmep24x7one/data/recovery/amcmep_userdata_recovered_2026-08-13.csv';

function parseCsvRfc4180(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n' || (c === '\r' && next === '\n')) {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        if (c === '\r') i++;
      } else if (c === '\r') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += c;
      }
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter(r => r.some(cell => cell.trim() !== ''));
}

async function runRecoveryImport() {
  console.log('=== STARTING CLEAN USERDATA RECOVERY IMPORT FROM CSV ===');
  
  const client = new Client({ connectionString: 'postgresql://localhost:5432/amcmep' });
  await client.connect();

  // 1. Truncate existing user data tables
  console.log('🧹 Truncating existing user_profiles and auth_accounts in amcmep...');
  await client.query('TRUNCATE TABLE user_profiles CASCADE;');
  await client.query('TRUNCATE TABLE auth_accounts CASCADE;');
  console.log('✅ User data tables truncated clean!');

  // 2. Read and parse CSV file with RFC-4180 parser
  const rawCsv = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsvRfc4180(rawCsv);
  const header = rows[0];
  console.log(`Read CSV file with ${rows.length - 1} data records.`);

  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0] || !r[0].trim()) continue;
    const obj = {};
    header.forEach((h, idx) => {
      obj[h.trim()] = r[idx] ? r[idx].trim() : '';
    });
    records.push(obj);
  }

  // 3. Ensure related businesses exist in businesses table
  console.log('\n🏬 Checking and adding related businesses in businesses table...');
  const businessNamesToAdd = [
    {
      name: 'RVA Infratech Pvt Ltd',
      kind: 'vendor',
      location: 'India',
      metadata: { source: 'recovery_csv', category: 'construction_infratech' }
    },
    {
      name: 'MF MONTEX FORGE',
      kind: 'vendor',
      location: 'New Delhi',
      metadata: {
        gst_number: '07AXKPR6245F1Z6',
        address: '10474, G. Floor, Gali No. 3, Bagichi Allauddin, Motia Khan, Pahar Ganj, New Delhi, 110055',
        alternate_phone: '+919967045134'
      }
    },
    {
      name: 'S N Enterprises',
      kind: 'vendor',
      location: 'Delhi',
      metadata: { owner_email: 'shivnarayandelhi91@gmail.com', owner_phone: '+918744979804' }
    },
    {
      name: 'shree ganesh enterprises',
      kind: 'service_provider',
      location: 'Delhi',
      metadata: { source: 'recovery_csv' }
    }
  ];

  for (const b of businessNamesToAdd) {
    const existing = await client.query('SELECT id FROM businesses WHERE lower(name) = lower($1)', [b.name]);
    if (existing.rows.length === 0) {
      const bizId = crypto.randomUUID();
      await client.query(`
        INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, now(), now())
      `, [bizId, b.name, b.kind, b.location, JSON.stringify(b.metadata)]);
      console.log(`➕ Added missing business: ${b.name}`);
    } else {
      await client.query(`
        UPDATE businesses
        SET metadata = metadata || $2::jsonb, updated_at = now()
        WHERE id = $1
      `, [existing.rows[0].id, JSON.stringify(b.metadata)]);
      console.log(`🔄 Updated existing business metadata: ${b.name}`);
    }
  }

  // 4. Populate user_profiles and auth_accounts from CSV records
  console.log(`\n👤 Importing ${records.length} recovered user records into user_profiles and auth_accounts...`);
  let importedUsers = 0;

  for (const r of records) {
    const userId = r.legacy_user_id || r.recovery_id;
    const name = r.name || 'User';
    const phone = (r.phone && r.phone.length > 3) ? r.phone : null;
    const email = (r.email && r.email.includes('@')) ? r.email : null;
    const activeRole = r.active_role || 'customer';
    const rolesArray = (r.roles || 'customer').split(',').map(s => s.trim());
    const partnerType = r.partner_type || null;
    const partnerStatus = r.partner_status && r.partner_status !== 'true' && r.partner_status !== 'false' ? r.partner_status : (rolesArray.includes('vendor') || rolesArray.includes('service_provider') || rolesArray.includes('partner') ? 'active' : 'none');

    const companyName = r.company || r.business_name || null;

    const metadata = {
      recovery_id: r.recovery_id,
      legacy_user_id: r.legacy_user_id || null,
      country_code: r.country_code || '+91',
      alternate_phone: r.alternate_phone || null,
      company: companyName,
      business_name: r.business_name || companyName,
      gst_number: r.gst_number || null,
      address_line1: r.address_line1 || null,
      city: r.city || null,
      state: r.state || null,
      pincode: r.pincode || null,
      country: r.country || 'India',
      is_active: r.is_active === 'true',
      profile_complete: r.profile_complete === 'true',
      password_recovery_status: r.password_recovery_status || null,
      record_completeness: r.record_completeness || null,
      source: r.source || null,
      source_confidence: r.source_confidence || null,
      recovery_notes: r.recovery_notes || null
    };

    // Insert into user_profiles
    await client.query(`
      INSERT INTO user_profiles (
        user_id, name, phone, email, active_role, roles, partner_type, partner_status,
        partner_skills, partner_service_areas, business_ids, metadata, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, $9, now(), now())
    `, [
      userId,
      name,
      phone,
      email,
      activeRole,
      JSON.stringify(rolesArray),
      partnerType,
      partnerStatus,
      JSON.stringify(metadata)
    ]);

    // Insert into auth_accounts
    const authId = crypto.randomUUID();
    await client.query(`
      INSERT INTO auth_accounts (
        id, project_key, user_id, phone, email, password_setup_required, failed_attempts, status, created_at, updated_at
      )
      VALUES ($1, 'amcmep', $2, $3, $4, true, 0, 'active', now(), now())
    `, [authId, userId, phone, email]);

    importedUsers++;
    console.log(`  ✅ [${importedUsers}/${records.length}] ${name} | Phone: ${phone || 'None'} | Email: ${email || 'None'} | Active Role: ${activeRole} | User ID: ${userId}`);
  }

  console.log(`\n🎉 SUCCESSFULLY IMPORTED ALL ${importedUsers} RECOVERED USER PROFILE RECORDS INTO amcmep!`);
  await client.end();
}

runRecoveryImport().catch(console.error);
