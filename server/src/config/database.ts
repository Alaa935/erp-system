import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

prisma.$on('query', (e) => {
  console.log('PRISMA QUERY:', e.query);
  console.log('PRISMA PARAMS:', e.params);
  console.log('PRISMA DURATION:', e.duration);
});

prisma.$on('error', (e) => {
  console.error('PRISMA ERROR:', e);
});
