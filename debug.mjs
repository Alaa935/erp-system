const API = 'https://server-e6y4.onrender.com/api';

async function main() {
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin@123' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken;
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  // Step 1: Check the server logs by hitting a non-existent endpoint
  console.log('1. Health check:');
  const health = await (await fetch(`${API}/health`)).json();
  console.log(`   ${JSON.stringify(health).slice(0, 100)}`);

  // Step 2: Check what Node.js version the server sends
  console.log('\n2. Server headers:');
  const resp = await fetch(`${API}/suppliers`);
  console.log(`   Server: ${resp.headers.get('server') || 'not set'}`);
  console.log(`   X-Powered-By: ${resp.headers.get('x-powered-by') || 'not set'}`);

  // Step 3: Try a very simple create - minimal required fields
  console.log('\n3. Testing purchase order create with minimal required fields:');
  
  // The absolute minimum - just supplierId, items, and totalAmount (as required by Prisma)
  const payload = {
    supplierId: 1,
    items: [{ itemId: 1, quantity: 1, price: 100 }],
    totalAmount: 100
  };
  
  console.log(`   Payload: ${JSON.stringify(payload)}`);
  
  try {
    const res = await fetch(`${API}/purchase-orders`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log(`   Status: ${res.status}`);
    console.log(`   Response: ${text.slice(0, 500)}`);
    
    if (res.ok) {
      const data = JSON.parse(text);
      console.log(`\n   ✓ CREATED! ID: ${data.data?.id}`);
    }
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }

  // Step 4: Try the frontend's exact format (look at how the frontend sends it)
  console.log('\n4. Testing with frontend-style payload:');
  const frontendPayload = {
    orderNumber: `INV-SUP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    supplierId: 1,
    items: [{ itemId: 1, quantity: 1, price: 100 }],
    subtotal: 100,
    totalAmount: 100,
    status: 'received',
    paymentStatus: 'unpaid',
    paidAmount: 0,
    paymentMethod: 'cash',
    notes: 'test from frontend',
    date: Date.now()
  };
  
  console.log(`   Payload: ${JSON.stringify(frontendPayload)}`);
  
  try {
    const res = await fetch(`${API}/purchase-orders`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(frontendPayload),
    });
    const text = await res.text();
    console.log(`   Status: ${res.status}`);
    console.log(`   Response: ${text.slice(0, 500)}`);
    
    if (res.ok) {
      const data = JSON.parse(text);
      console.log(`\n   ✓ CREATED! ID: ${data.data?.id}`);
    }
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }
}

main().catch(console.error);
