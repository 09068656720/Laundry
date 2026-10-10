import bcrypt from 'bcryptjs';
import { query, withTransaction } from '../db/index.js';
import { generateToken } from '../middleware/auth.js';

export async function register(req, res) {
  const { email, password, role, fullName, phone, area, address, businessName, turnaroundDays, offersPickup, deliveryFee } = req.body;

  if (!email || !password || !fullName || !role) {
    return res.status(400).json({ error: 'Please provide email, password, full name, and role.' });
  }

  const validRoles = ['customer', 'partner'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Role must be either customer or partner.' });
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  if (role === 'partner' && (!phone || !String(phone).trim())) {
    return res.status(400).json({ error: 'A phone number is required for laundry partners.' });
  }

  try {
    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Everything inside is saved together or not at all (no half-created accounts)
    const { user, customerProfile, laundryProfile } = await withTransaction(async (tx) => {
      let customerProfile = null;
      let laundryProfile = null;

      // Insert user
      const userRes = await tx.query(
        `INSERT INTO users (email, password_hash, role, full_name, phone)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, role, full_name, phone, created_at`,
        [email.toLowerCase().trim(), passwordHash, role, fullName.trim(), phone || null]
      );
      const user = userRes.rows[0];

      customerProfile = null;
      laundryProfile = null;

      if (role === 'customer') {
        const cRes = await tx.query(
          `INSERT INTO customers (user_id, default_address, city, area)
           VALUES ($1, $2, 'Kano', $3)
           RETURNING id, default_address, city, area`,
          [user.id, address || null, area || 'Kano Municipal']
        );
        customerProfile = cRes.rows[0];
      } else if (role === 'partner') {
        const lRes = await tx.query(
          `INSERT INTO laundries (
            user_id, business_name, description, address, area, phone, email,
            is_approved, is_active, turnaround_days, offers_pickup, delivery_fee
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            FALSE, TRUE, $8, $9, $10
          ) RETURNING id, business_name, is_approved, area, turnaround_days, offers_pickup, delivery_fee`,
          [
            user.id,
            businessName || `${fullName}'s Laundry`,
            'Professional laundry and dry cleaning services in Kano.',
            address || 'Kano',
            area || 'Nasarawa',
            phone || '',
            email.toLowerCase().trim(),
            parseInt(turnaroundDays) || 2,
            offersPickup !== false,
            parseFloat(deliveryFee) || 1000.00,
          ]
        );
        laundryProfile = lRes.rows[0];

        // Add default essential services for new partner
        const defServices = [
          { name: 'Wash & Fold (per kg)', category: 'wash_fold', price: 1000, type: 'per_kg' },
          { name: '2-Piece Kaftan Wash & Press', category: 'native_wear', price: 1600, type: 'per_piece' },
          { name: 'Babbar Riga Dry Clean', category: 'native_wear', price: 2800, type: 'per_piece' },
          { name: 'Office Shirt Ironing', category: 'ironing', price: 600, type: 'per_piece' },
        ];
        for (const s of defServices) {
          await tx.query(
            `INSERT INTO services (laundry_id, name, category, unit_price, unit_type)
             VALUES ($1, $2, $3, $4, $5)`,
            [laundryProfile.id, s.name, s.category, s.price, s.type]
          );
        }
      }

      return { user, customerProfile, laundryProfile };
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: 'Registration successful!',
      token,
      user: {
        ...user,
        customerId: customerProfile?.id,
        laundryId: laundryProfile?.id,
        businessName: laundryProfile?.business_name,
        isApproved: laundryProfile?.is_approved,
      },
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.full_name, u.phone,
              c.id AS customer_id, c.default_address, c.area AS customer_area,
              l.id AS laundry_id, l.business_name, l.is_approved, l.area AS laundry_area
       FROM users u
       LEFT JOIN customers c ON c.user_id = u.id
       LEFT JOIN laundries l ON l.user_id = u.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    // Exclude password hash from response
    delete user.password_hash;

    return res.json({
      message: 'Sign in successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        phone: user.phone,
        customerId: user.customer_id,
        customerAddress: user.default_address,
        customerArea: user.customer_area,
        laundryId: user.laundry_id,
        businessName: user.business_name,
        isApproved: user.is_approved,
        laundryArea: user.laundry_area,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
}

export async function getMe(req, res) {
  try {
    return res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        fullName: req.user.full_name,
        phone: req.user.phone,
        customerId: req.user.customer_id,
        laundryId: req.user.laundry_id,
        businessName: req.user.business_name,
        isApproved: req.user.is_approved,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching session data.' });
  }
}

export default {
  register,
  login,
  getMe,
};
