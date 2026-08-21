import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { Prisma } from '@prisma/client';

function printPrismaSchemaDiagnostic() {
  try {
    const model = Prisma.dmmf.datamodel.models.find((m: any) => m.name === 'SalesOrder');
    if (!model) { console.log('[DIAG] SalesOrder model not found in DMMF'); return; }
    console.log('[DIAG] === Prisma Schema Diagnostic for SalesOrder ===');
    console.log('[DIAG] Model dbName:', model.dbName);
    for (const field of model.fields) {
      console.log(`[DIAG] Field: ${field.name}, column: ${field.dbName ?? field.name}, type: ${field.type}, hasDefault: ${!!field.default}`);
    }
    console.log('[DIAG] ===============================================');
  } catch (err) {
    console.log('[DIAG] Failed to read DMMF:', err);
  }
}

async function main() {
  try {
    printPrismaSchemaDiagnostic();
    await prisma.$connect();
    console.log('Connected to database');

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
