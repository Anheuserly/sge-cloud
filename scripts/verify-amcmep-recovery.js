const { Pool } = require('pg');

async function fullVerification() {
  const pool = new Pool({ connectionString: 'postgresql://localhost:5432/amcmep' });

  const usersRes = await pool.query(`
    SELECT 
      u.user_id,
      u.name,
      u.phone,
      u.email,
      u.active_role,
      u.roles,
      u.partner_type,
      u.partner_status,
      u.metadata,
      a.phone AS auth_phone,
      a.email AS auth_email,
      a.password_setup_required
    FROM user_profiles u 
    LEFT JOIN auth_accounts a ON u.user_id = a.user_id 
    ORDER BY u.name ASC;
  `);

  console.log('========================================================================================================');
  console.log('                   AMCMEP DATABASE RECOVERY VERIFICATION REPORT                                        ');
  console.log('========================================================================================================\n');

  console.log(`TOTAL USER PROFILES IN AMCMEP DATABASE: ${usersRes.rows.length}\n`);

  usersRes.rows.forEach((r, idx) => {
    console.log(`[RECORD ${idx + 1}] ${r.name}`);
    console.log(`  • User ID:                  ${r.user_id}`);
    console.log(`  • Phone Number:             ${r.phone || 'N/A'}`);
    console.log(`  • Email Address:            ${r.email || 'N/A'}`);
    console.log(`  • Active Role / Roles:      ${r.active_role || 'N/A'} | ${JSON.stringify(r.roles || [])}`);
    console.log(`  • Partner Type / Status:    ${r.partner_type || 'N/A'} | ${r.partner_status || 'N/A'}`);
    console.log(`  • Auth Account Phone/Email: ${r.auth_phone || 'N/A'} | ${r.auth_email || 'N/A'}`);
    console.log(`  • Password Setup Required: ${r.password_setup_required}`);
    console.log(`  • Source Record / Notes:    ${r.metadata?.source_csv_id || 'N/A'} - ${r.metadata?.recovery_notes || r.metadata?.source || 'N/A'}`);
    console.log('--------------------------------------------------------------------------------------------------------');
  });

  const bizRes = await pool.query(`SELECT name, kind, location, metadata FROM businesses ORDER BY name ASC;`);
  console.log(`\nTOTAL CONNECTED BUSINESSES IN AMCMEP DATABASE: ${bizRes.rows.length}\n`);
  bizRes.rows.forEach((b, idx) => {
    console.log(`[BUSINESS ${idx + 1}] ${b.name}`);
    console.log(`  • Type / Kind:              ${b.kind}`);
    console.log(`  • Location:                 ${b.location || 'N/A'}`);
    console.log(`  • GST Number:               ${b.metadata?.gstNumber || b.metadata?.gst_number || 'N/A'}`);
    console.log(`  • Contact Phone / Email:    ${b.metadata?.phone || b.metadata?.owner_phone || 'N/A'} | ${b.metadata?.email || b.metadata?.owner_email || 'N/A'}`);
    console.log('--------------------------------------------------------------------------------------------------------');
  });

  await pool.end();
}

fullVerification();
