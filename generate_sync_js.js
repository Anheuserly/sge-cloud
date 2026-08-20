const fs = require('fs');
const { execSync } = require('child_process');

try {
  const result = execSync("psql \"postgresql://sge_datahub:AnheVps2022@v2202501191704311155.ultrasrv.de:5432/amcmep\" -c \"SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position;\"", { encoding: 'utf-8' });
  
  const lines = result.split('\n').slice(2, -3);
  
  const schema = {};
  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split('|').map(p => p.trim());
    if (parts.length === 3) {
      const [table, column, type] = parts;
      if (!schema[table]) schema[table] = [];
      schema[table].push({ name: column, type });
    }
  }

  let fileContent = `/**
 * SGE DataHub Database Sync Map (AMC MEP Project)
 * 
 * This file contains a complete mapping of all tables and columns 
 * inside the 'amcmep' PostgreSQL database to help you build the Flutter app.
 */

export const AmcMepDatabaseSchema = {
`;

  for (const table in schema) {
    fileContent += `  "${table}": {\n`;
    for (const col of schema[table]) {
      fileContent += `    "${col.name}": "${col.type}",\n`;
    }
    fileContent += `  },\n\n`;
  }

  fileContent += `};\n`;

  fs.writeFileSync('/Volumes/HP_P500/GitHub/flutter-projects/flutter_application_14amcmep24x7one/sge-datahub-sync.js', fileContent);
  console.log('Successfully wrote sge-datahub-sync.js');
} catch (e) {
  console.error(e);
}
