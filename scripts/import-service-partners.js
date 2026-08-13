const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function parseCSV(text) {
  const lines = [];
  let field = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field.trim());
        field = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        row.push(field.trim());
        if (row.length > 1 || row[0] !== '') {
          lines.push(row);
        }
        row = [];
        field = '';
        if (char === '\r') i++;
      } else {
        field += char;
      }
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field.trim());
    lines.push(row);
  }
  return lines;
}

async function importServicePartners() {
  const csvPath = path.join(__dirname, '../data/service_partners_recovery.csv');
  const content = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(content);

  const header = rows[0];
  const records = rows.slice(1);

  console.log(`Parsed ${records.length} service partner records from CSV.\n`);

  const pool = new Pool({ connectionString: 'postgresql://localhost:5432/amcmep' });

  try {
    await pool.query('BEGIN');

    let insertedProfiles = 0;
    let skippedProfiles = 0;
    let insertedAuths = 0;
    let insertedBusinesses = 0;

    for (let idx = 0; idx < records.length; idx++) {
      const r = records[idx];
      if (r.length < 5) continue;

      const rawId = r[0] || '';
      const name = r[4] || '';
      const phone = r[5] || '';
      const businessName = r[6] || '';
      const fcmToken = r[10] || '';
      const userIdFromCsv = r[11] || rawId;
      const designation = r[71] || 'Service Partner';
      const email = r[74] || null;
      const partnerType = r[80] || 'service_partner';
      const ownBusinessName = r[83] || (businessName !== 'Not Assigned' && businessName !== 'null' ? businessName : null);
      const ownBusinessType = r[84] || partnerType || 'Service Provider';

      if (!name || name === 'null') continue;

      // Check if user is already added by phone or by exact name
      const existingCheck = await pool.query(
        `SELECT user_id, name, phone FROM user_profiles 
         WHERE (phone IS NOT NULL AND phone = $1 AND phone != 'null' AND phone != '')
            OR (LOWER(name) = LOWER($2));`,
        [phone, name]
      );

      if (existingCheck.rows.length > 0) {
        console.log(`[SKIP] Already exists in amcmep: "${name}" (${phone || 'No Phone'})`);
        skippedProfiles++;
        continue;
      }

      let userId = (userIdFromCsv && userIdFromCsv !== 'null' && userIdFromCsv !== 'undefined' && userIdFromCsv.trim() !== '')
        ? userIdFromCsv.trim()
        : (phone && phone !== 'null' && phone.trim() !== '' 
            ? `phone_${phone.replace(/\+/g, '').trim()}` 
            : `sp_${Date.now()}_${idx}`);

      // Ensure user_id is globally unique in user_profiles
      const idCheck = await pool.query(`SELECT user_id FROM user_profiles WHERE user_id = $1;`, [userId]);
      if (idCheck.rows.length > 0) {
        userId = `${userId}_${idx}`;
      }

      // 1. Add Business if not existing
      if (ownBusinessName && ownBusinessName !== 'Not Assigned' && ownBusinessName !== 'null') {
        const bizCheck = await pool.query(
          `SELECT id FROM businesses WHERE LOWER(name) = LOWER($1) LIMIT 1;`,
          [ownBusinessName]
        );

        if (bizCheck.rows.length === 0) {
          const kind = partnerType === 'manufacturer' ? 'vendor' : 'service provider';
          await pool.query(
            `INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, 'Delhi NCR', $3, NOW(), NOW());`,
            [
              ownBusinessName,
              kind,
              JSON.stringify({
                source: 'service_partners_csv',
                phone: phone || null,
                businessType: ownBusinessType,
                ownerUserId: userId
              })
            ]
          );
          insertedBusinesses++;
        }
      }

      // 2. Insert User Profile
      const rolesArray = ['service_partner', 'partner'];
      if (designation && designation !== 'null') {
        rolesArray.push(designation.toLowerCase().replace(/\s+/g, '_'));
      }

      const metadataObj = {
        source: 'service_partners_csv',
        designation: designation,
        fcmToken: fcmToken || null,
        businessName: ownBusinessName || businessName || null,
        partnerType: partnerType
      };

      await pool.query(
        `INSERT INTO user_profiles (
           user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, 'service_partner', $5::jsonb, $6, 'active', $7::jsonb, NOW(), NOW());`,
        [
          userId,
          name,
          (phone && phone !== 'null') ? phone : null,
          (email && email !== 'null') ? email : null,
          JSON.stringify(rolesArray),
          partnerType,
          JSON.stringify(metadataObj)
        ]
      );
      insertedProfiles++;

      // 3. Insert Auth Account if not existing
      await pool.query(
        `INSERT INTO auth_accounts (
           id, user_id, phone, email, password_setup_required, status, created_at, updated_at
         ) VALUES (gen_random_uuid(), $1, $2, $3, true, 'active', NOW(), NOW())
         ON CONFLICT DO NOTHING;`,
        [userId, (phone && phone !== 'null') ? phone : null, (email && email !== 'null') ? email : null]
      );
      insertedAuths++;

      console.log(`[ADD] New Service Partner added to amcmep: "${name}" (${phone || 'No Phone'})`);
    }

    await pool.query('COMMIT');

    console.log('\n=================================================');
    console.log('=== SERVICE PARTNER IMPORT COMPLETED          ===');
    console.log('=================================================');
    console.log(`New Service Partners Added: ${insertedProfiles}`);
    console.log(`Already Added (Skipped):    ${skippedProfiles}`);
    console.log(`Auth Accounts Created:      ${insertedAuths}`);
    console.log(`New Businesses Created:     ${insertedBusinesses}`);

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Import Error:', err);
  } finally {
    await pool.end();
  }
}

importServicePartners();
