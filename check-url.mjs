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

  const payload = {
    supplierId: 1,
    items: [{ itemId: 1, quantity: 1, price: 100 }],
    totalAmount: 100,
  };

  const res = await fetch(`${API}/purchase-orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  console.log('=== RESPONSE DETAILS ===');
  console.log('Status:', res.status);
  console.log('StatusText:', res.statusText);
  console.log('\nHeaders:');
  for (const [k, v] of res.headers.entries()) {
    console.log(`  ${k}: ${v}`);
  }

  const text = await res.text();
  console.log('\nBody:', text.slice(0, 500));

  // Also test a GET to the same endpoint
  console.log('\n=== GET /purchase-orders ===');
  const getRes = await fetch(`${API}/purchase-orders`, { headers });
  console.log('Status:', getRes.status);
  console.log('Headers:');
  for (const [k, v] of getRes.headers.entries()) {
    console.log(`  ${k}: ${v}`);
  }
  const getText = await getRes.text();
  console.log('Body:', getText.slice(0, 500));
}

main().catch(console.error);
