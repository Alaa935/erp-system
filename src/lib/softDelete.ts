import { db } from '../db/db';

export async function softDelete(
  table: 'customers' | 'suppliers' | 'items' | 'salesOrders' | 'purchaseOrders' | 'salesReps' | 'warehouses' | 'employees' | 'branches' | 'vehicles' | 'stockTransfers' | 'stockRequests',
  id: number,
  reason: string
) {
  await db[table].update(id as any, {
    deletedAt: Date.now(),
    deleteReason: reason,
  });
}
