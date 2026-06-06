// Standalone diagnostic - no database connection needed
// Prints the Prisma runtimeDataModel column mapping

const { Prisma } = require('./node_modules/.prisma/client/index.js');

console.log('=== Prisma Runtime Schema Diagnostic ===');
console.log();

const datamodel = Prisma.dmmf?.datamodel;
if (!datamodel) {
  console.log('ERROR: Prisma.dmmf.datamodel is not available');
  console.log('Available keys:', Object.keys(Prisma).join(', '));
  process.exit(1);
}

const models = datamodel.models || [];
console.log(`Total models: ${models.length}`);
console.log();

const salesOrder = models.find(m => m.name === 'SalesOrder');
if (!salesOrder) {
  console.log('ERROR: SalesOrder not found');
  process.exit(1);
}

console.log(`Model: SalesOrder`);
console.log(`Table (dbName): ${salesOrder.dbName || salesOrder.name}`);
console.log();
console.log('Fields:');

for (const f of salesOrder.fields) {
  const columnName = f.dbName || f.name;
  const isStatus = f.name === 'status';
  const marker = isStatus ? ' <-- SQL column' : '';
  console.log(
    `  ${f.name.padEnd(22)} type=${(f.type || '?').toString().padEnd(16)} dbName=${columnName}${marker}`
  );
}

console.log();
console.log('=== Diagnostic Complete ===');
