import { db } from './schema';

const MIGRATIONS_KEY = 'wms_db_version';

interface Migration {
  version: number;
  description: string;
  up: () => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: 1,
    description: 'Initial schema',
    up: async () => { },
  },
  {
    version: 2,
    description: 'Add delete flags for soft delete support',
    up: async () => {
      const customers = await db.customers.toArray();
      for (const c of customers) {
        if ((c as any).deletedAt === undefined) {
          await db.customers.update(c.id!, { deletedAt: null } as any);
        }
      }
      const suppliers = await db.suppliers.toArray();
      for (const s of suppliers) {
        if ((s as any).deletedAt === undefined) {
          await db.suppliers.update(s.id!, { deletedAt: null } as any);
        }
      }
    },
  },
  {
    version: 3,
    description: 'Add sales orders, stock transfers, rep inventory tables',
    up: async () => {
      // This migration was originally handled by IndexedDB schema version 3.
      // Since we now have all prior version stubs in schema.ts, no action needed.
      // Data integrity is preserved by the v14 upgrade() callback in schema.ts.
    },
  },
  {
    version: 4,
    description: 'Add notifications and employees tables',
    up: async () => {
      // Handled by schema.ts version stubs + v14 upgrade()
    },
  },
  {
    version: 5,
    description: 'Add users table and rep relationship',
    up: async () => {
      // Handled by schema.ts version stubs + v14 upgrade()
    },
  },
  {
    version: 6,
    description: 'Add stock requests, financial transactions, vehicles',
    up: async () => {
      // Handled by schema.ts version stubs + v14 upgrade()
    },
  },
  {
    version: 7,
    description: 'Add employee payroll and company settings',
    up: async () => {
      // Handled by schema.ts version stubs + v14 upgrade()
    },
  },
  {
    version: 8,
    description: 'Add payment collections and activity logs',
    up: async () => {
      // Handled by schema.ts version stubs + v14 upgrade()
    },
  },
  {
    version: 9,
    description: 'Add inventory transactions table',
    up: async () => {
      // Handled by schema.ts version stubs + v14 upgrade()
    },
  },
  {
    version: 10,
    description: 'Add branches table',
    up: async () => {
      // Handled by schema.ts version stubs + v14 upgrade()
    },
  },
  {
    version: 11,
    description: 'Add system config table',
    up: async () => {
      // Handled by schema.ts version stubs + v14 upgrade()
    },
  },
  {
    version: 12,
    description: 'Add taxes table',
    up: async () => {
      // Handled by schema.ts version stubs + v14 upgrade()
    },
  },
  {
    version: 13,
    description: 'Current schema with all tables',
    up: async () => {
      // Handled by schema.ts version stubs + v14 upgrade()
    },
  },
  {
    version: 14,
    description: 'Add compound indexes, soft-delete indexes, and deletedAt migration',
    up: async () => {
      // This migration is handled by the DB-level upgrade() in schema.ts.
      // The localStorage version key is updated here to prevent re-running.
      // The actual data migration (adding deletedAt fields) is done in
      // IndexedDB's onupgradeneeded callback (version 14).
    },
  },
  {
    version: 15,
    description: 'Add repId+isSettledWithWarehouse index for sales orders',
    up: async () => {
      // Handled by schema.ts version 15 — Dexie onupgradeneeded
    },
  },
  {
    version: 16,
    description: 'Add transactionNumber/collectionNumber/requestNumber indexes',
    up: async () => {
      // Handled by schema.ts version 16 — Dexie onupgradeneeded
    },
  },
];

export async function runMigrations(): Promise<void> {
  let currentVersion = 0;
  try {
    const raw = localStorage.getItem(MIGRATIONS_KEY);
    if (raw) currentVersion = parseInt(raw, 10) || 0;
  } catch { }

  const pending = migrations.filter(m => m.version > currentVersion).sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    try {
      await migration.up();
      localStorage.setItem(MIGRATIONS_KEY, String(migration.version));
    } catch (err) {
      console.error(`[Migration v${migration.version}] Failed:`, err);
      throw err;
    }
  }
}
