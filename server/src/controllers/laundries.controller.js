import { query } from '../db/index.js';

export async function getLaundries(req, res) {
  try {
    const { area, search, offersPickup, serviceCategory, sort } = req.query;

    let sql = `
      SELECT id, business_name, description, address, area, phone, email,
             turnaround_days, offers_pickup, delivery_fee, rating, banner_url
      FROM laundries
      WHERE is_approved = TRUE AND is_active = TRUE
    `;
    const params = [];

    if (area && area !== 'all') {
      params.push(area);
      sql += ` AND LOWER(area) = LOWER($${params.length})`;
    }

    if (offersPickup === 'true') {
      sql += ` AND offers_pickup = TRUE`;
    }

    if (search && search.trim() !== '') {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(business_name) LIKE $${params.length} OR LOWER(description) LIKE $${params.length} OR LOWER(area) LIKE $${params.length})`;
    }

    if (sort === 'turnaround') {
      sql += ` ORDER BY turnaround_days ASC, rating DESC`;
    } else {
      sql += ` ORDER BY rating DESC, business_name ASC`;
    }

    const result = await query(sql, params);
    let laundries = result.rows;

    // Fetch active services to calculate counts and minimum prices
    const servicesRes = await query(
      `SELECT laundry_id, category, unit_price FROM services WHERE is_active = TRUE`
    );
    const services = servicesRes.rows;

    laundries = laundries.map((l) => {
      const lServices = services.filter((s) => s.laundry_id === l.id);
      const minPrice = lServices.length > 0 ? Math.min(...lServices.map((s) => parseFloat(s.unit_price))) : 0;
      return {
        ...l,
        service_count: lServices.length,
        min_price: minPrice,
      };
    });

    if (serviceCategory && serviceCategory !== 'all') {
      laundries = laundries.filter((l) =>
        services.some((s) => s.laundry_id === l.id && s.category === serviceCategory)
      );
    }

    if (sort === 'price_asc') {
      laundries.sort((a, b) => a.min_price - b.min_price);
    }

    return res.json({ laundries });
  } catch (err) {
    console.error('getLaundries error:', err);
    return res.status(500).json({ error: 'Failed to retrieve laundries.' });
  }
}

export async function getLaundryById(req, res) {
  try {
    const { id } = req.params;

    const laundryRes = await query(
      `SELECT id, business_name, description, address, area, phone, email,
              turnaround_days, offers_pickup, delivery_fee, rating, is_approved
       FROM laundries
       WHERE id = $1`,
      [id]
    );

    if (laundryRes.rows.length === 0) {
      return res.status(404).json({ error: 'Laundry partner not found.' });
    }

    const laundry = laundryRes.rows[0];

    const servicesRes = await query(
      `SELECT id, name, category, description, unit_price, unit_type, is_active
       FROM services
       WHERE laundry_id = $1 AND is_active = TRUE
       ORDER BY category, unit_price ASC`,
      [id]
    );

    const reviewsRes = await query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.full_name AS customer_name
       FROM reviews r
       JOIN customers c ON c.id = r.customer_id
       JOIN users u ON u.id = c.user_id
       WHERE r.laundry_id = $1
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [id]
    );

    return res.json({
      laundry: {
        ...laundry,
        services: servicesRes.rows,
        reviews: reviewsRes.rows,
      },
    });
  } catch (err) {
    console.error('getLaundryById error:', err);
    return res.status(500).json({ error: 'Failed to retrieve laundry details.' });
  }
}

export async function getAreas(req, res) {
  try {
    const result = await query(
      `SELECT DISTINCT area
       FROM laundries
       WHERE is_approved = TRUE AND is_active = TRUE
       ORDER BY area ASC`
    );
    const areas = result.rows.map((r) => r.area);
    return res.json({ areas });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve Kano coverage areas.' });
  }
}

export default {
  getLaundries,
  getLaundryById,
  getAreas,
};
