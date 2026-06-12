import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

let blueLogs = [];
page.on('console', msg => {
  const t = msg.text();
  if (t.includes('\u{1F535}')) blueLogs.push(t);
});

// Mock all API endpoints
await page.route('**/api/auth/me', async route => {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, username: 'admin', role: 'admin' }) });
});
await page.route('**/api/auth/refresh', async route => {
  await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: { accessToken: 'mock', refreshToken: 'mock' } }) });
});
await page.route('**/analytics/**', async route => {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    success: true,
    summary: { totalSales: 100000, totalExpenses: 30000, netProfit: 20000, profit: 20000, loss: 0, totalCustomers: 50, totalSuppliers: 10, totalOrders: 100, totalPaid: 80000, totalDue: 20000, inventoryValue: 50000, inventorySellingValue: 75000, lowStockCount: 5, pendingOrders: 10, salesRepsCount: 3 },
    totals: { sales: 100000, expenses: 30000, customers: 50, suppliers: 10, orders: 100 },
    charts: { trends: [{ revenue: 15000, cost: 5000, profit: 5000 }, { revenue: 18000, cost: 6000, profit: 6000 }, { revenue: 16000, cost: 5500, profit: 5500 }, { revenue: 20000, cost: 7000, profit: 7000 }, { revenue: 17000, cost: 5800, profit: 5800 }, { revenue: 14000, cost: 4700, profit: 4700 }], topItems: [{ name: 'Product A', totalQuantity: 50, totalRevenue: 25000 }] },
    tables: { orders: [{ id: 1, orderNumber: 'ORD-001', customer: 'Customer A', date: '2024-01-15', status: 'delivered', totalAmount: 5000 }, { id: 2, orderNumber: 'ORD-002', customer: 'Customer B', date: '2024-01-20', status: 'shipped', totalAmount: 3000 }], customers: [{ id: 1, name: 'Cust A', phone: '0123456789', address: 'Cairo', balance: 1000 }], items: [{ id: 1, name: 'Item A', sku: 'SKU001', quantity: 10, purchasePrice: 100, location: 'WH-1' }], transactions: [{ id: 1, date: '2024-01-15', category: 'Utilities', description: 'Electricity bill', amount: 1500 }] },
    categoryDistribution: [{ category: 'Electronics', value: 20000 }, { category: 'Clothing', value: 15000 }, { category: 'Food', value: 10000 }, { category: 'Other', value: 5000 }]
  }) });
});
await page.route('**/api/inventory/**', async route => {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, tables: { items: [{ id: 1, name: 'Item A', sku: 'SKU001', quantity: 10, purchasePrice: 100, location: 'WH-1' }], transactions: [] } }) });
});
await page.route('**/api/customers/**', async route => {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [{ id: 1, name: 'Cust A', phone: '0123456789', address: 'Cairo', balance: 1000 }] }) });
});

await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.evaluate(() => {
  localStorage.setItem('wms_access_token', 'mock-token');
  localStorage.setItem('wms_active_page', 'reports');
});
await page.reload({ waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(5000);

console.log('PAGE LOADED');

// Take screenshot
await page.screenshot({ path: 'loaded.png', fullPage: true });

// Try clicking KPI cards by more direct selector - find motion.button elements inside the main content area
const kpiCards = await page.locator('main button').all();
console.log('All buttons in main:', kpiCards.length);

// Print text of first 20 buttons
for (let i = 0; i < Math.min(kpiCards.length, 20); i++) {
  const txt = (await kpiCards[i].innerText()).substring(0, 60).replace(/\n/g, ' ');
  console.log('  btn[' + i + ']:', txt);
}

await browser.close();
