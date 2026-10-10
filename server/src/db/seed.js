import bcrypt from 'bcryptjs';
import { initDb, query } from './index.js';
import { runMigrations } from './migrate.js';

export async function runSeed() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Refusing to load DEMO data in production. Use `npm run create-admin` instead.');
  }
  await initDb();
  await runMigrations();

  console.log('Seeding Kano Laundry Platform database...');

  const passwordHash = bcrypt.hashSync('Password123!', 10);

  // 1. Create Admin User
  const adminRes = await query(
    `INSERT INTO users (email, password_hash, role, full_name, phone)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
     RETURNING id`,
    ['admin@kanolaundry.ng', passwordHash, 'admin', 'Hajiya Amina Bello (Admin)', '+234 803 123 4567']
  );
  const adminId = adminRes.rows[0].id;

  // 2. Create Customer User & Customer Profile
  const customerRes = await query(
    `INSERT INTO users (email, password_hash, role, full_name, phone)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
     RETURNING id`,
    ['customer@kanolaundry.ng', passwordHash, 'customer', 'Ibrahim Mukhtar', '+234 802 345 6789']
  );
  const customerUserId = customerRes.rows[0].id;

  const custProfileRes = await query(
    `INSERT INTO customers (user_id, default_address, city, area)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET default_address = EXCLUDED.default_address
     RETURNING id`,
    [customerUserId, '14 Zoo Road, Tarauni, Kano', 'Kano', 'Tarauni']
  );
  const customerId = custProfileRes.rows[0].id;

  // 3. Kano Partner Laundries Data
  const laundriesData = [
    {
      email: 'partner@amanaclean.ng',
      name: 'Malam Usman Abdullahi',
      business_name: 'Amana Cleaners & Steamers',
      description: "Kano's premier fabric care specialists. Expert dry cleaning for royal Babbar Riga, delicate embroidery, and ceremonial wear.",
      address: 'Plot 42 Lamido Crescent, Nasarawa GRA, Kano',
      area: 'Nasarawa',
      phone: '+234 803 987 6543',
      is_approved: true,
      turnaround_days: 2,
      offers_pickup: true,
      delivery_fee: 1200.00,
      rating: 4.9,
      services: [
        { name: 'Babbar Riga / Agbada Dry Clean & Starch', category: 'native_wear', unit_price: 3000, desc: 'Special deep starch & hand-pressed embroidery' },
        { name: '2-Piece Kaftan Wash & Crisp Press', category: 'native_wear', unit_price: 1800, desc: 'Gentle wash and razor-sharp crease pressing' },
        { name: '3-Piece Executive Suit Dry Clean', category: 'suits', unit_price: 3500, desc: 'Jacket, trousers and vest with steam conditioning' },
        { name: 'Cotton Shirt Wash & Ironing', category: 'ironing', unit_price: 700, desc: 'Crisp collar and cuff finish' },
        { name: 'Everyday Wash & Fold (per kg)', category: 'wash_fold', unit_price: 1200, unit_type: 'per_kg', desc: 'Washed, dried, and neatly packed' },
        { name: 'Heavy Duvet / Blanket Wash', category: 'bedding', unit_price: 4000, desc: 'Deep sanitizing wash for large bedding' },
      ],
    },
    {
      email: 'partner@arewacare.ng',
      name: 'Fatima Sanusi',
      business_name: 'Arewa Garment Care & Dry Cleaning',
      description: 'Modern industrial textile care in Bompai. Spotless whites, stain extraction, and high-speed steam pressing.',
      address: '18 Bompai Road, Industrial Layout, Kano',
      area: 'Bompai',
      phone: '+234 806 222 3344',
      is_approved: true,
      turnaround_days: 1,
      offers_pickup: true,
      delivery_fee: 1000.00,
      rating: 4.8,
      services: [
        { name: '2-Piece Kaftan Wash & Press', category: 'native_wear', unit_price: 1600, desc: 'Fast turnaround daily native wear care' },
        { name: 'Executive Suit Dry Clean', category: 'suits', unit_price: 3000, desc: '2-piece suit dry cleaning' },
        { name: 'Everyday Wash & Fold (per kg)', category: 'wash_fold', unit_price: 1000, unit_type: 'per_kg', desc: 'Cost-effective bulk family laundry' },
        { name: 'Office Shirts Steam Press', category: 'ironing', unit_price: 600, desc: 'Quick iron and hanger packing' },
        { name: 'Bed Sheets & Pillowcases Set', category: 'bedding', unit_price: 2500, desc: 'Hypoallergenic laundry detergent' },
      ],
    },
    {
      email: 'partner@dalaroyal.ng',
      name: 'Kabir Garba',
      business_name: 'Dala Royal Laundry Services',
      description: 'Centrally located in Kano Municipal. Reliable wash & fold and quick steam ironing for busy professionals and traders.',
      address: '5 Murtala Muhammad Way, Kano Municipal, Kano',
      area: 'Kano Municipal',
      phone: '+234 809 333 4455',
      is_approved: true,
      turnaround_days: 2,
      offers_pickup: true,
      delivery_fee: 800.00,
      rating: 4.7,
      services: [
        { name: 'Babbar Riga Dry Clean', category: 'native_wear', unit_price: 2800, desc: 'Gentle handling of brocade fabrics' },
        { name: '2-Piece Kaftan Wash & Press', category: 'native_wear', unit_price: 1700, desc: 'Careful stain removal and pressing' },
        { name: 'Trousers & Chinos Ironing', category: 'ironing', unit_price: 600, desc: 'Precise crease setting' },
        { name: 'Wash & Fold (per kg)', category: 'wash_fold', unit_price: 1100, unit_type: 'per_kg', desc: 'Standard turnaround clean' },
      ],
    },
    {
      email: 'partner@saharaexpress.ng',
      name: 'Zainab Aliyu',
      business_name: 'Sahara Express Wash & Press',
      description: 'Affordable student and family laundry packages along Court Road. Same-day drop-off ironing options available.',
      address: '31 Court Road, Gyadi-Gyadi / Tarauni, Kano',
      area: 'Tarauni',
      phone: '+234 805 444 5566',
      is_approved: true,
      turnaround_days: 3,
      offers_pickup: false,
      delivery_fee: 0.00,
      rating: 4.6,
      services: [
        { name: 'Budget Wash & Fold (per kg)', category: 'wash_fold', unit_price: 900, unit_type: 'per_kg', desc: 'Economic laundry bundle' },
        { name: 'Student Kaftan Press', category: 'ironing', unit_price: 700, desc: 'Steam press only' },
        { name: 'Standard Suit Dry Clean', category: 'suits', unit_price: 2800, desc: 'Quality suit dry cleaning' },
      ],
    },
    {
      email: 'partner@elitenative.ng',
      name: 'Mustapha Bello',
      business_name: 'Kano Elite Native & Suit Care',
      description: 'Specialized in premium northern formal wear, Hula starching, Shadda and Guinea brocade finishing.',
      address: '88 France Road, Sabon Gari, Kano',
      area: 'Sabon Gari',
      phone: '+234 807 555 6677',
      is_approved: true,
      turnaround_days: 2,
      offers_pickup: true,
      delivery_fee: 1500.00,
      rating: 4.9,
      services: [
        { name: 'Royal Babbar Riga Extra Starch', category: 'native_wear', unit_price: 3500, desc: 'Specialized Hausa traditional starching' },
        { name: 'VIP 2-Piece Kaftan Care', category: 'native_wear', unit_price: 2200, desc: 'Hand wash, anti-fade treatment, press' },
        { name: 'Hula (Cap) Starching & Shaping', category: 'native_wear', unit_price: 1200, desc: 'Traditional hard-press shaping' },
        { name: 'Luxury Suit Care', category: 'suits', unit_price: 4000, desc: 'Imported solvents and cedar garment bag' },
      ],
    },
    {
      email: 'partner@faggetextile.ng',
      name: 'Abubakar Umar',
      business_name: 'Fagge Textile Care Hub',
      description: 'High-capacity bulk laundry and dry cleaners serving commercial clients, textile merchants, and local residents in Fagge.',
      address: '12 IBB Way, Fagge, Kano',
      area: 'Fagge',
      phone: '+234 803 666 7788',
      is_approved: true,
      turnaround_days: 2,
      offers_pickup: true,
      delivery_fee: 1000.00,
      rating: 4.7,
      services: [
        { name: 'Commercial Wash & Fold (per kg)', category: 'wash_fold', unit_price: 1000, unit_type: 'per_kg', desc: 'Quick bulk turnaround' },
        { name: 'Kaftan Wash & Press', category: 'native_wear', unit_price: 1600, desc: 'Standard steam finish' },
        { name: 'Curtains & Drapes Dry Clean', category: 'bedding', unit_price: 3500, desc: 'Dust mite removal and steaming' },
      ],
    },
    {
      email: 'partner@kanoheritage.ng',
      name: 'Sani Mohammed',
      business_name: 'Kano Heritage Dry Cleaners',
      description: 'Newly registered premium facility in Kano Municipal awaiting platform verification. Eco-friendly cleaning solvents.',
      address: '25 Hadejia Road, Kano Municipal, Kano',
      area: 'Kano Municipal',
      phone: '+234 802 777 8899',
      is_approved: false, // PENDING APPROVAL FOR ADMIN VERIFICATION FLOW
      turnaround_days: 2,
      offers_pickup: true,
      delivery_fee: 1200.00,
      rating: 5.0,
      services: [
        { name: 'Babbar Riga Dry Clean', category: 'native_wear', unit_price: 3200, desc: 'Hand finishing and protection' },
        { name: 'Kaftan Crisp Iron', category: 'ironing', unit_price: 800, desc: 'Precision crease pressing' },
      ],
    },
  ];

  const createdLaundries = [];

  for (const lData of laundriesData) {
    const userRes = await query(
      `INSERT INTO users (email, password_hash, role, full_name, phone)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [lData.email, passwordHash, 'partner', lData.name, lData.phone]
    );
    const pUserId = userRes.rows[0].id;

    const laundryRes = await query(
      `INSERT INTO laundries (user_id, business_name, description, address, area, phone, email, is_approved, is_active, turnaround_days, offers_pickup, delivery_fee, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (user_id) DO UPDATE SET business_name = EXCLUDED.business_name
       RETURNING id, business_name`,
      [
        pUserId,
        lData.business_name,
        lData.description,
        lData.address,
        lData.area,
        lData.phone,
        lData.email,
        lData.is_approved,
        true,
        lData.turnaround_days,
        lData.offers_pickup,
        lData.delivery_fee,
        lData.rating,
      ]
    );
    const laundryId = laundryRes.rows[0].id;
    createdLaundries.push({ ...lData, id: laundryId, user_id: pUserId });

    // Seed services for this laundry
    for (const s of lData.services) {
      await query(
        `INSERT INTO services (laundry_id, name, category, description, unit_price, unit_type, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [laundryId, s.name, s.category, s.desc || '', s.unit_price, s.unit_type || 'per_piece', true]
      );
    }
  }

  // 4. Create Demo Orders for realistic demonstration
  const amanaLaundry = createdLaundries[0]; // Amana Cleaners
  const arewaLaundry = createdLaundries[1]; // Arewa Garment Care

  // Order 1: Completed Historical Order with commission and chain of custody recorded
  const pastPickupDate = new Date();
  pastPickupDate.setDate(pastPickupDate.getDate() - 7);
  const pastReturnDate = new Date();
  pastReturnDate.setDate(pastReturnDate.getDate() - 5);

  const subtotal1 = 5500.00;
  const delivery1 = 1200.00;
  const serviceFee1 = 300.00;
  const total1 = subtotal1 + delivery1 + serviceFee1; // 7000.00
  const commRate = 0.10;
  const commAmount1 = subtotal1 * commRate; // 550.00
  const payout1 = (subtotal1 * 0.90) + delivery1; // 4950 + 1200 = 6150.00

  const order1Res = await query(
    `INSERT INTO orders (
      order_number, customer_id, laundry_id, service_type,
      pickup_address, delivery_address, pickup_date, estimated_return_date, actual_return_date,
      status, payment_status, payment_method,
      item_subtotal, delivery_fee, service_fee, total_amount,
      platform_commission_rate, platform_commission_amount, laundry_payout_amount,
      customer_notes
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
    ) RETURNING id`,
    [
      'KN-2026-001',
      customerId,
      amanaLaundry.id,
      'pickup',
      '14 Zoo Road, Tarauni, Kano',
      '14 Zoo Road, Tarauni, Kano',
      pastPickupDate,
      pastReturnDate,
      pastReturnDate,
      'completed',
      'paid',
      'simulated_card',
      subtotal1,
      delivery1,
      serviceFee1,
      total1,
      commRate,
      commAmount1,
      payout1,
      'Please take extra care with the Babbar Riga embroidery.',
    ]
  );
  const order1Id = order1Res.rows[0].id;

  // Garment items for Order 1
  await query(
    `INSERT INTO order_items (order_id, item_name, category, quantity, unit_price, total_price, condition_notes, intake_verified)
     VALUES 
     ($1, 'Babbar Riga / Agbada Dry Clean & Starch', 'native_wear', 1, 3000.00, 3000.00, 'Gold embroidery intact; minor tea stain near hem noted at intake.', true),
     ($1, '2-Piece Kaftan Wash & Crisp Press', 'native_wear', 1, 1800.00, 1800.00, 'Sky blue fabric; collar slightly worn.', true),
     ($1, 'Cotton Shirt Wash & Ironing', 'ironing', 1, 700.00, 700.00, 'White cotton shirt; no damage.', true)`,
    [order1Id]
  );

  // Status history for Order 1
  await query(
    `INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by_user_id, notes)
     VALUES
     ($1, NULL, 'placed', $2, 'Order booked by customer with pickup request'),
     ($1, 'placed', 'accepted', $3, 'Order accepted by Amana Cleaners'),
     ($1, 'accepted', 'picked_up', $3, 'Garments picked up from 14 Zoo Road'),
     ($1, 'picked_up', 'garments_verified', $3, 'Intake inspection complete; tea stain logged on Babbar Riga'),
     ($1, 'garments_verified', 'processing', $3, 'Starch and steam processing started'),
     ($1, 'processing', 'ready', $3, 'Garments pressed, bagged and ready for return'),
     ($1, 'ready', 'out_for_delivery', $3, 'Dispatched to delivery rider'),
     ($1, 'out_for_delivery', 'completed', $3, 'Clothes safely delivered back to customer')`,
    [order1Id, customerUserId, amanaLaundry.user_id]
  );

  // Add review for Order 1
  await query(
    `INSERT INTO reviews (order_id, customer_id, laundry_id, rating, comment)
     VALUES ($1, $2, $3, 5, 'Spotless job on my Babbar Riga! The starching was crisp and exact.')`,
    [order1Id, customerId, amanaLaundry.id]
  );

  // Order 2: Active Order in 'garments_verified' with pending price modification to test price change approval!
  const today = new Date();
  const futureReturnDate = new Date();
  futureReturnDate.setDate(today.getDate() + 2);

  const subtotal2 = 4800.00;
  const delivery2 = 1200.00;
  const serviceFee2 = 300.00;
  const total2 = subtotal2 + delivery2 + serviceFee2; // 6300.00

  const order2Res = await query(
    `INSERT INTO orders (
      order_number, customer_id, laundry_id, service_type,
      pickup_address, delivery_address, pickup_date, estimated_return_date,
      status, payment_status, payment_method,
      item_subtotal, delivery_fee, service_fee, total_amount,
      platform_commission_rate, platform_commission_amount, laundry_payout_amount,
      customer_notes
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
    ) RETURNING id`,
    [
      'KN-2026-002',
      customerId,
      amanaLaundry.id,
      'pickup',
      '14 Zoo Road, Tarauni, Kano',
      '14 Zoo Road, Tarauni, Kano',
      today,
      futureReturnDate,
      'garments_verified',
      'paid',
      'simulated_card',
      subtotal2,
      delivery2,
      serviceFee2,
      total2,
      commRate,
      subtotal2 * commRate,
      (subtotal2 * 0.90) + delivery2,
      'Need this ready for Friday Jumuah prayer.',
    ]
  );
  const order2Id = order2Res.rows[0].id;

  await query(
    `INSERT INTO order_items (order_id, item_name, category, quantity, unit_price, total_price, condition_notes, intake_verified)
     VALUES 
     ($1, 'Babbar Riga / Agbada Dry Clean & Starch', 'native_wear', 1, 3000.00, 3000.00, 'Heavy oil stain on left chest embroidery requiring special solvent soak.', true),
     ($1, '2-Piece Kaftan Wash & Crisp Press', 'native_wear', 1, 1800.00, 1800.00, 'Good condition, light dust only.', true)`,
    [order2Id]
  );

  // Price change request: laundry inspected oil stain and proposed +₦1,000 stain removal treatment
  const newSubtotal2 = 5800.00;
  const newTotal2 = newSubtotal2 + delivery2 + serviceFee2; // 7300.00
  await query(
    `INSERT INTO price_change_requests (order_id, old_subtotal, new_subtotal, old_total, new_total, reason, status, requested_by)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)`,
    [
      order2Id,
      subtotal2,
      newSubtotal2,
      total2,
      newTotal2,
      'Deep palm oil stain on front chest of Babbar Riga requires specialized solvent pre-treatment and additional gentle steam cycle (+₦1,000).',
      amanaLaundry.user_id,
    ]
  );

  await query(
    `INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by_user_id, notes)
     VALUES
     ($1, NULL, 'placed', $2, 'Order booked by customer'),
     ($1, 'placed', 'accepted', $3, 'Amana Cleaners accepted order'),
     ($1, 'accepted', 'picked_up', $3, 'Garments picked up'),
     ($1, 'picked_up', 'garments_verified', $3, 'Intake complete: deep oil stain identified, price adjustment submitted for customer approval')`,
    [order2Id, customerUserId, amanaLaundry.user_id]
  );

  // Order 3: Placed order waiting for partner acceptance
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const order3Res = await query(
    `INSERT INTO orders (
      order_number, customer_id, laundry_id, service_type,
      pickup_address, delivery_address, pickup_date, estimated_return_date,
      status, payment_status, payment_method,
      item_subtotal, delivery_fee, service_fee, total_amount,
      platform_commission_rate, platform_commission_amount, laundry_payout_amount,
      customer_notes
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
    ) RETURNING id`,
    [
      'KN-2026-003',
      customerId,
      arewaLaundry.id,
      'dropoff',
      null,
      null,
      tomorrow,
      futureReturnDate,
      'placed',
      'pending',
      'simulated_transfer',
      3000.00,
      0.00,
      300.00,
      3300.00,
      commRate,
      300.00,
      2700.00,
      'Will drop off at Bompai branch tomorrow morning at 9am.',
    ]
  );
  const order3Id = order3Res.rows[0].id;

  await query(
    `INSERT INTO order_items (order_id, item_name, category, quantity, unit_price, total_price, condition_notes, intake_verified)
     VALUES ($1, 'Executive Suit Dry Clean', 'suits', 1, 3000.00, 3000.00, 'Customer noted missing cuff button', false)`,
    [order3Id]
  );

  await query(
    `INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by_user_id, notes)
     VALUES ($1, NULL, 'placed', $2, 'Order placed via customer web portal')`,
    [order3Id, customerUserId]
  );

  console.log('Seeding completed successfully!');
  console.log('Demo Accounts:');
  console.log('  Customer: customer@kanolaundry.ng / Password123!');
  console.log('  Laundry Partner: partner@amanaclean.ng / Password123!');
  console.log('  Platform Admin: admin@kanolaundry.ng / Password123!');
}

if (process.argv[1] === (await import('url')).fileURLToPath(import.meta.url)) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
