const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://sge_datahub:AnheVps2022@v2202501191704311155.ultrasrv.de:5432/sge_datahub',
  ssl: false
});

async function run() {
  try {
    await pool.query('ALTER TABLE platform_projects DROP COLUMN IF EXISTS database_key;');
    console.log("Schema fixed");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
