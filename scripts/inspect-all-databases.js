const { Pool } = require('pg');

async function inspectAll() {
  const amcmepPool = new Pool({ connectionString: 'postgresql://localhost:5432/amcmep' });
  const datahubPool = new Pool({ connectionString: 'postgresql://localhost:5432/sge_datahub' });

  try {
    console.log('=== AMCMEP TABLES ===');
    const amcmepTables = await amcmepPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    console.log(amcmepTables.rows.map(r => r.table_name));

    for (const t of amcmepTables.rows) {
      const cols = await amcmepPool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [t.table_name]);
      console.log(`\nTable [amcmep.${t.table_name}]:`);
      console.table(cols.rows);
    }

    console.log('\n=== SGE_DATAHUB TABLES ===');
    const datahubTables = await datahubPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    console.log(datahubTables.rows.map(r => r.table_name));

    for (const t of datahubTables.rows) {
      const cols = await datahubPool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [t.table_name]);
      console.log(`\nTable [sge_datahub.${t.table_name}]:`);
      console.table(cols.rows);
    }

  } catch (err) {
    console.error('Error inspecting:', err.message);
  } finally {
    await amcmepPool.end();
    await datahubPool.end();
  }
}

inspectAll();
