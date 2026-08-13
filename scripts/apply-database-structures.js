const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function applyStructures() {
  const sqlFile = path.join(__dirname, 'define-database-structures.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('=== APPLYING MASTER DATABASE STRUCTURES ===\n');

  // 1. Apply to amcmep
  const amcmepPool = new Pool({ connectionString: 'postgresql://localhost:5432/amcmep' });
  try {
    await amcmepPool.query(sql);
    console.log('✅ Master Database Structures applied to [amcmep] successfully!');
  } catch (err) {
    console.error('❌ Error applying to amcmep:', err.message);
  } finally {
    await amcmepPool.end();
  }

  // 2. Apply to sge_datahub
  const datahubPool = new Pool({ connectionString: 'postgresql://localhost:5432/sge_datahub' });
  try {
    await datahubPool.query(sql);
    console.log('✅ Master Database Structures applied to [sge_datahub] successfully!');
  } catch (err) {
    console.error('❌ Error applying to sge_datahub:', err.message);
  } finally {
    await datahubPool.end();
  }
}

applyStructures();
