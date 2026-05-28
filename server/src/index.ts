import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';

async function main() {
  try {
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
