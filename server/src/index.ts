import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { Prisma } from '@prisma/client';

// TEMP: Prisma schema diagnostic - prints the exact column mapping Prisma uses
function printPrismaSchemaDiagnostic() {
  console.log('=== Prisma Schema Diagnostic ===');
  console.log(`Prisma client version: ${(Prisma as any).prismaVersion?.client ?? 'unknown'}`);
  const datamodel = (Prisma.dmmf as any)?.datamodel;
  if (!datamodel) {
    console.log('WARN: Prisma.dmmf.datamodel not available');
    return;
  }
  const salesOrder = datamodel.models?.find((m: any) => m.name === 'SalesOrder');
  if (!salesOrder) {
    console.log('WARN: SalesOrder model not found in datamodel');
    return;
  }
  console.log(`SalesOrder model dbName (table): ${salesOrder.dbName ?? salesOrder.name}`);
  console.log('SalesOrder fields:');
  for (const f of salesOrder.fields) {
    const columnName = f.dbName ?? f.name;
    const marker = f.name === 'status' ? ' <-- STATUS FIELD' : '';
    console.log(`  ${f.name.padEnd(20)} column=${columnName}${marker}`);
  }
  console.log('=== End Schema Diagnostic ===');
}

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected to database');
    printPrismaSchemaDiagnostic();

    app.listen(env.PORT, () => {
      console.log(`ERP API server running on port ${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`Health check: http://localhost:${env.PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();
