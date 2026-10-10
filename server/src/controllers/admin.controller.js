import { query } from '../db/index.js';

export async function getAdminStats(req, res) {
  try {
    const ordersRes = await query(`SELECT status, total_amount, platform_commission_amount, laundry_payout_amount FROM orders`);
    const orders = ordersRes.rows;

    const completed = orders.filter((o) => o.status === 'completed');
    const active = orders.filter((o) => ['placed', 'accepted', 'picked_up', 'garments_verified', 'price_pending', 'processing', 'ready', 'out_for_delivery'].includes(o.status));
    const cancelled = orders.filter((o) => o.status === 'cancelled');

    const totalGmv = completed.reduce((acc, o) => acc + parseFloat(o.total_amount || 0), 0);
    const totalCommission = completed.reduce((acc, o) => acc + parseFloat(o.platform_commission_amount || 0), 0);
    const totalPayouts = completed.reduce((acc, o) => acc + parseFloat(o.laundry_payout_amount || 0), 0);

    const laundriesRes = await query(`SELECT is_approved FROM laundries`);
    const approvedLaundries = laundriesRes.rows.filter((l) => l.is_approved).length;
    const pendingLaundries = laundriesRes.rows.filter((l) => !l.is_approved).length;

    const customersRes = await query(`SELECT id FROM customers`);
    const disputesRes = await query(`SELECT id FROM disputes WHERE status = 'open'`);

    return res.json({
      stats: {
        total_orders: orders.length,
        completed_orders: completed.length,
        active_orders: active.length,
        cancelled_orders: cancelled.length,
        total_gmv: totalGmv,
        total_commission_earned: totalCommission,
        total_payouts_due: totalPayouts,
        approved_laundries: approvedLaundries,
        pending_laundries: pendingLaundries,
        total_customers: customersRes.rows.length,
        open_disputes: disputesRes.rows.length,
      },
    });
  } catch (err) {
    console.error('getAdminStats error:', err);
    return res.status(500).json({ error: 'Failed to fetch admin stats.' });
  }
}

export async function getAdminPartners(req, res) {
  try {
    const { status } = req.query; // 'pending' | 'approved' | 'all'

    let sql = `
      SELECT l.*,
             u.full_name AS owner_name, u.email AS owner_email
      FROM laundries l
      JOIN users u ON u.id = l.user_id
    `;

    if (status === 'pending') {
      sql += ` WHERE l.is_approved = FALSE`;
    } else if (status === 'approved') {
      sql += ` WHERE l.is_approved = TRUE`;
    }

    sql += ` ORDER BY l.created_at DESC`;

    const result = await query(sql);
    const partners = result.rows;

    const ordersRes = await query(`SELECT laundry_id, status, platform_commission_amount, laundry_payout_amount FROM orders`);
    const allOrders = ordersRes.rows;

    const enriched = partners.map((l) => {
      const pOrders = allOrders.filter((o) => o.laundry_id === l.id);
      const completed = pOrders.filter((o) => o.status === 'completed');
      const commission = completed.reduce((acc, o) => acc + parseFloat(o.platform_commission_amount || 0), 0);
      const payout = completed.reduce((acc, o) => acc + parseFloat(o.laundry_payout_amount || 0), 0);
      return {
        ...l,
        total_orders: pOrders.length,
        total_commission_paid: commission,
        total_payout_received: payout,
      };
    });

    return res.json({ partners: enriched });
  } catch (err) {
    console.error('getAdminPartners error:', err);
    return res.status(500).json({ error: 'Failed to retrieve partners.' });
  }
}

export async function approvePartner(req, res) {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE laundries
       SET is_approved = TRUE, is_active = TRUE
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Laundry partner not found.' });
    }

    return res.json({
      message: `Laundry partner '${result.rows[0].business_name}' is now approved and live for customer bookings!`,
      partner: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to approve partner.' });
  }
}

export async function rejectPartner(req, res) {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE laundries
       SET is_approved = FALSE, is_active = FALSE
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Laundry partner not found.' });
    }

    return res.json({
      message: `Laundry partner '${result.rows[0].business_name}' status revoked.`,
      partner: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to revoke partner.' });
  }
}

export async function getAdminOrders(req, res) {
  try {
    const { status, laundryId } = req.query;

    let sql = `
      SELECT o.*,
             l.business_name AS laundry_name, l.area AS laundry_area,
             u.full_name AS customer_name, u.phone AS customer_phone
      FROM orders o
      JOIN laundries l ON l.id = o.laundry_id
      JOIN customers c ON c.id = o.customer_id
      JOIN users u ON u.id = c.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND o.status = $${params.length}`;
    }

    if (laundryId && laundryId !== 'all') {
      params.push(laundryId);
      sql += ` AND o.laundry_id = $${params.length}`;
    }

    sql += ` ORDER BY o.created_at DESC`;

    const result = await query(sql, params);
    const orders = result.rows;

    const itemsRes = await query(`SELECT order_id, COUNT(*) AS count FROM order_items GROUP BY order_id`);
    const itemCounts = {};
    itemsRes.rows.forEach((r) => { itemCounts[r.order_id] = parseInt(r.count); });

    const enriched = orders.map((o) => ({
      ...o,
      item_count: itemCounts[o.id] || 0,
    }));

    return res.json({ orders: enriched });
  } catch (err) {
    console.error('getAdminOrders error:', err);
    return res.status(500).json({ error: 'Failed to fetch orders.' });
  }
}

export async function getCommissionReport(req, res) {
  try {
    const laundriesRes = await query(`SELECT id, business_name, area FROM laundries WHERE is_approved = TRUE ORDER BY business_name ASC`);
    const laundries = laundriesRes.rows;

    const ordersRes = await query(`SELECT laundry_id, status, item_subtotal, platform_commission_amount, laundry_payout_amount, total_amount, platform_commission_rate FROM orders`);
    const allOrders = ordersRes.rows;
    const completedOrders = allOrders.filter((o) => o.status === 'completed');

    const byLaundry = laundries.map((l) => {
      const lCompleted = completedOrders.filter((o) => o.laundry_id === l.id);
      const totalVolume = lCompleted.reduce((acc, o) => acc + parseFloat(o.item_subtotal || 0), 0);
      const commission = lCompleted.reduce((acc, o) => acc + parseFloat(o.platform_commission_amount || 0), 0);
      const payout = lCompleted.reduce((acc, o) => acc + parseFloat(o.laundry_payout_amount || 0), 0);
      return {
        laundry_id: l.id,
        business_name: l.business_name,
        area: l.area,
        completed_orders_count: lCompleted.length,
        total_item_volume: totalVolume,
        total_commission_earned: commission,
        total_payout_amount: payout,
      };
    });

    const allTimeCommission = completedOrders.reduce((acc, o) => acc + parseFloat(o.platform_commission_amount || 0), 0);
    const allTimeVolume = completedOrders.reduce((acc, o) => acc + parseFloat(o.total_amount || 0), 0);
    const allTimePayouts = completedOrders.reduce((acc, o) => acc + parseFloat(o.laundry_payout_amount || 0), 0);

    return res.json({
      summary: {
        all_time_commission: allTimeCommission,
        all_time_volume: allTimeVolume,
        all_time_payouts: allTimePayouts,
        total_completed_orders: completedOrders.length,
        avg_commission_rate: 0.10,
      },
      byLaundry,
      platformRate: 0.10,
    });
  } catch (err) {
    console.error('getCommissionReport error:', err);
    return res.status(500).json({ error: 'Failed to generate commission report.' });
  }
}

export async function getAdminDisputes(req, res) {
  try {
    const result = await query(`
      SELECT d.*,
             o.order_number, o.status AS order_status, o.total_amount,
             l.business_name AS laundry_name,
             u.full_name AS raised_by_name, u.email AS raised_by_email, u.role AS raised_by_role,
             ru.full_name AS resolved_by_name
      FROM disputes d
      JOIN orders o ON o.id = d.order_id
      JOIN laundries l ON l.id = o.laundry_id
      JOIN users u ON u.id = d.raised_by_user_id
      LEFT JOIN users ru ON ru.id = d.resolved_by_user_id
      ORDER BY d.created_at DESC
    `);

    return res.json({ disputes: result.rows });
  } catch (err) {
    console.error('getAdminDisputes error:', err);
    return res.status(500).json({ error: 'Failed to retrieve disputes.' });
  }
}

export async function resolveDispute(req, res) {
  try {
    const { id } = req.params;
    const { status = 'resolved', resolutionNotes } = req.body;

    const result = await query(
      `UPDATE disputes
       SET status = $1,
           resolution_notes = $2,
           resolved_by_user_id = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, resolutionNotes || 'Resolved following chain of custody inspection', req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dispute not found.' });
    }

    return res.json({ message: 'Dispute updated successfully.', dispute: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to resolve dispute.' });
  }
}

export async function getAdminUsers(req, res) {
  try {
    const result = await query(`
      SELECT u.id, u.email, u.role, u.full_name, u.phone, u.created_at,
             l.business_name, l.is_approved
      FROM users u
      LEFT JOIN laundries l ON l.user_id = u.id
      ORDER BY u.created_at DESC
    `);

    return res.json({ users: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user list.' });
  }
}

export default {
  getAdminStats,
  getAdminPartners,
  approvePartner,
  rejectPartner,
  getAdminOrders,
  getCommissionReport,
  getAdminDisputes,
  resolveDispute,
  getAdminUsers,
};
