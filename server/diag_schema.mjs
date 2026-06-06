// Standalone diagnostic - no database connection needed
// Prints the Prisma runtimeDataModel column mapping

import { Prisma } from './node_modules/.prisma/client/index.js';

console.log('=== Prisma Runtime Schema Diagnostic ===');
console.log();

const datamodel = Prisma.dmmf?.datamodel;
if (!datamodel) {
  console.log('ERROR: Prisma.dmmf.datamodel is not available');
  console.log('Available keys on Prisma:', Object.keys(Prisma).join(', '));
  process.exit(1);
}

const models = datamodel.models || [];
console.log(`Total models in datamodel: ${models.length}`);
console.log();

const salesOrder = models.find(m => m.name === 'SalesOrder');
if (!salesOrder) {
  console.log('ERROR: SalesOrder model not found');
  process.exit(1);
}

console.log(`Model: SalesOrder`);
console.log(`Table (dbName): ${salesOrder.dbName || salesOrder.name}`);
console.log();
console.log('Fields:');
console.log('─'.repeat(60));

for (const f of salesOrder.fields) {
  // The dbName field is what Prisma uses as the SQL column name
  const columnName = f.dbName || f.name;
  const isStatus = f.name === 'status';
  const marker = isStatus ? ' <═══ columna usada en SQL' : '';
  console.log(
    `  ${f.name.padEnd(22)} ` +
    `tipo=${(f.type || '?').toString().padEnd(16)} ` +
    `columna SQL=${columnName}${marker}`
  );
}

console.log('─'.repeat(60));
console.log();
console.log('=== Fin del diagnóstico ===');
