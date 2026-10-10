/**
 * End-to-end test against a RUNNING server and a REAL database.
 * It creates its own brand-new users (no demo accounts), so it can be run repeatedly.
 *
 * Needs an admin that already exists (npm run create-admin) because admins cannot self-register:
 *   TEST_ADMIN_EMAIL=admin@yourdomain.com TEST_ADMIN_PASSWORD=... npm test
 * Optional: API_URL=http://localhost:5000/api
 */
import assert from 'assert';

const BASE = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;
const run = Date.now();

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}
const ok = (name) => console.log(`✓ ${name}`);

async function main() {
  assert(ADMIN_EMAIL && ADMIN_PASSWORD, 'Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD (create one with: npm run create-admin)');
  console.log(`Testing ${BASE}\n`);

  // ---- Accounts
  let r = await call('POST', '/auth/register', { body: { email: `cust${run}@test.ng`, password: 'Password123!', fullName: 'Test Customer', role: 'customer', phone: '08030000001' } });
  assert.strictEqual(r.status, 201, JSON.stringify(r.data));
  const cust = r.data; ok('customer registers');

  r = await call('POST', '/auth/register', { body: { email: `cust${run}@test.ng`, password: 'Password123!', fullName: 'Dup', role: 'customer' } });
  assert.strictEqual(r.status, 409); ok('duplicate email rejected');

  r = await call('POST', '/auth/register', { body: { email: `a${run}@test.ng`, password: 'Password123!', fullName: 'Hacker', role: 'admin' } });
  assert.strictEqual(r.status, 400); ok('nobody can self-register as admin');

  r = await call('POST', '/auth/register', { body: { email: `b${run}@test.ng`, password: 'short', fullName: 'Short', role: 'customer' } });
  assert.strictEqual(r.status, 400); ok('weak password rejected');

  r = await call('POST', '/auth/register', { body: { email: `lau${run}@test.ng`, password: 'Password123!', fullName: 'Test Partner', role: 'partner', phone: '08030000002', businessName: `Test Laundry ${run}`, area: 'Nasarawa', address: '1 Test Road, Kano', turnaroundDays: 3, offersPickup: true, deliveryFee: 1000 } });
  assert.strictEqual(r.status, 201, JSON.stringify(r.data));
  const partner = r.data;
  assert.strictEqual(partner.user.isApproved, false); ok('partner registers (starts UNAPPROVED)');

  r = await call('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  assert.strictEqual(r.status, 200, 'admin login failed: ' + JSON.stringify(r.data));
  const admin = r.data; assert.strictEqual(admin.user.role, 'admin'); ok('admin logs in');

  r = await call('POST', '/auth/login', { body: { email: `cust${run}@test.ng`, password: 'wrong-password' } });
  assert.strictEqual(r.status, 401); ok('wrong password rejected');

  // ---- Role protection
  r = await call('GET', '/admin/users', { token: cust.token });
  assert.strictEqual(r.status, 403); ok('customer blocked from admin API');
  r = await call('GET', '/partner/orders', { token: cust.token });
  assert.strictEqual(r.status, 403); ok('customer blocked from partner API');
  r = await call('GET', '/admin/users');
  assert.strictEqual(r.status, 401); ok('no token = 401');

  // ---- Unapproved laundry is hidden and cannot receive orders
  const lid = partner.user.laundryId;
  r = await call('GET', '/laundries');
  assert(!r.data.laundries.some((l) => l.id === lid)); ok('unapproved laundry is not listed');

  r = await call('GET', '/partner/services', { token: partner.token });
  const services = r.data.services; assert(services.length >= 2);

  const order = (extra = {}) => call('POST', '/orders', {
    token: cust.token,
    body: { laundryId: lid, serviceType: 'pickup', pickupAddress: '5 Zoo Road, Kano', items: [{ serviceId: services[0].id, quantity: 2 }], ...extra },
  });
  r = await order();
  assert.strictEqual(r.status, 400); ok('order to UNAPPROVED laundry rejected');

  r = await call('POST', `/admin/partners/${lid}/approve`, { token: admin.token });
  assert.strictEqual(r.status, 200); ok('admin approves partner');
  r = await call('GET', '/laundries');
  assert(r.data.laundries.some((l) => l.id === lid)); ok('approved laundry now listed');

  // ---- Price tampering
  r = await order({ items: [{ serviceId: services[0].id, quantity: 2, unitPrice: 1, itemName: 'cheap' }] });
  assert.strictEqual(r.status, 201, JSON.stringify(r.data));
  const real = parseFloat(services[0].unit_price) * 2;
  assert.strictEqual(parseFloat(r.data.order.item_subtotal), real, `expected server price ${real}`);
  ok(`browser-supplied price IGNORED (subtotal ₦${real} from database)`);

  r = await order({ items: [{ serviceId: 999999, quantity: 1 }] });
  assert.strictEqual(r.status, 400); ok('unknown service rejected');
  r = await order({ items: [{ serviceId: services[0].id, quantity: -3 }] });
  assert.strictEqual(r.status, 400); ok('negative quantity rejected');
  r = await order({ pickupAddress: '' });
  assert.strictEqual(r.status, 400); ok('pickup without address rejected');
  r = await call('POST', '/orders', { token: admin.token, body: { laundryId: lid, serviceType: 'dropoff', items: [{ serviceId: services[0].id, quantity: 1 }] } });
  assert.strictEqual(r.status, 403); ok('admin cannot place orders');

  // ---- Unique order numbers under parallel load
  const batch = await Promise.all(Array.from({ length: 12 }, () => order()));
  assert(batch.every((x) => x.status === 201), 'some parallel orders failed');
  const numbers = new Set(batch.map((x) => x.data.order.order_number));
  assert.strictEqual(numbers.size, 12); ok('12 simultaneous orders -> 12 unique order numbers');

  // ---- Full lifecycle
  r = await order();
  const o = r.data.order; const id = o.id;
  assert.strictEqual(o.payment_status, 'paid');
  const commission = parseFloat((parseFloat(o.item_subtotal) * 0.1).toFixed(2));
  assert.strictEqual(parseFloat(o.platform_commission_amount), commission); ok('commission = 10% of item subtotal');
  assert(o.estimated_return_date); ok('estimated return date set');

  const step = (status) => call('POST', `/partner/orders/${id}/status`, { token: partner.token, body: { status } });

  r = await step('completed');
  assert.strictEqual(r.status, 400); ok("laundry cannot jump 'placed' -> 'completed'");

  r = await call('POST', `/partner/orders/${id}/respond`, { token: partner.token, body: { action: 'accept' } });
  assert.strictEqual(r.status, 200); ok('partner accepts');
  r = await step('processing');
  assert.strictEqual(r.status, 400); ok('cannot skip pickup and intake');
  assert.strictEqual((await step('picked_up')).status, 200);
  r = await call('GET', `/orders/${id}`, { token: partner.token });
  const itemId = r.data.order.items[0].id;
  r = await call('POST', `/partner/orders/${id}/intake`, { token: partner.token, body: { items: [{ id: itemId, conditionNotes: 'Small oil stain on collar' }], generalNotes: 'ok' } });
  assert.strictEqual(r.status, 200); ok('intake recorded with condition note');

  // price change: customer must approve
  r = await call('POST', `/partner/orders/${id}/request-price-change`, { token: partner.token, body: { newSubtotal: -5, reason: 'x' } });
  assert.strictEqual(r.status, 400); ok('negative proposed price rejected');
  r = await call('POST', `/partner/orders/${id}/request-price-change`, { token: partner.token, body: { newSubtotal: real + 3000, reason: 'Heavy palm-oil stain needs pre-treatment' } });
  assert.strictEqual(r.status, 201, JSON.stringify(r.data)); const pcrId = r.data.request.id;
  r = await step('processing');
  assert.strictEqual(r.status, 400); ok('processing BLOCKED until customer approves the new price');

  const other = await call('POST', '/auth/register', { body: { email: `other${run}@test.ng`, password: 'Password123!', fullName: 'Other Customer', role: 'customer' } });
  r = await call('POST', `/orders/${id}/approve-price`, { token: other.data.token, body: { requestId: pcrId } });
  assert.strictEqual(r.status, 403); ok("another customer cannot approve someone else's price change");
  r = await call('GET', `/orders/${id}`, { token: other.data.token });
  assert.strictEqual(r.status, 403); ok("another customer cannot view someone else's order");

  r = await call('POST', `/orders/${id}/approve-price`, { token: cust.token, body: { requestId: pcrId } });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data)); ok('customer approves new price');
  assert.strictEqual(parseFloat(r.data.order.item_subtotal), real + 3000);
  r = await call('POST', `/orders/${id}/decline-price`, { token: cust.token, body: { requestId: pcrId } });
  assert.strictEqual(r.status, 400); ok('an already-approved request cannot be declined afterwards');
  r = await call('POST', `/orders/${id}/approve-price`, { token: cust.token, body: { requestId: pcrId } });
  assert.strictEqual(r.status, 400); ok('an approved request cannot be approved twice');

  for (const s of ['ready', 'out_for_delivery', 'completed']) {
    if (s === 'ready') assert.strictEqual((await step('ready')).status, 200);
    else assert.strictEqual((await step(s)).status, 200);
  }
  r = await call('GET', `/orders/${id}`, { token: cust.token });
  assert.strictEqual(r.data.order.status, 'completed');
  assert(r.data.order.history.length >= 7); ok(`order completed; audit trail has ${r.data.order.history.length} history entries`);

  r = await step('processing');
  assert.strictEqual(r.status, 400); ok('completed order cannot be reopened');

  // ---- Admin reporting
  r = await call('GET', '/admin/commissions', { token: admin.token });
  assert.strictEqual(r.status, 200); ok('admin commission report works');
  r = await call('GET', '/admin/users', { token: admin.token });
  assert(r.data.users.some((u) => u.email === `cust${run}@test.ng`)); ok('admin can see the newly registered customer');

  console.log('\n🎉 ALL CHECKS PASSED');
}

main().catch((e) => { console.error('\n✗ TEST FAILED:', e.message); process.exit(1); });
