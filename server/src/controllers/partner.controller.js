import { query, withTransaction } from '../db/index.js';
import { calculateOrderTotals } from '../services/commission.service.js';

export async function getPartnerOrders(req, res) {
  try {
    const laundryId = req.user.laundry_id;
    if (!laundryId) {
      return res.status(403).json({ error: 'You are not linked to an active laundry partner profile.' });
    }

    const { tab } = req.query; // 'new' | 'active' | 'completed' | 'all'

    let sql = `
      SELECT o.*,
             c.default_address, c.area AS customer_area,
             u.full_name AS customer_name, u.phone AS customer_phone, u.email AS customer_email
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      JOIN users u ON u.id = c.user_id
      WHERE o.laundry_id = $1
    `;
    const params = [laundryId];

    if (tab === 'new') {
      sql += ` AND o.status = 'placed'`;
    } else if (tab === 'active') {
      sql += ` AND o.status IN ('accepted', 'picked_up', 'garments_verified', 'price_pending', 'processing', 'ready', 'out_for_delivery')`;
    } else if (tab === 'completed') {
      sql += ` AND o.status = 'completed'`;
    }

    sql += ` ORDER BY o.created_at DESC`;

    const result = await query(sql, params);
    const orders = result.rows;

    const itemsRes = await query(`SELECT order_id, COUNT(*) AS count FROM order_items GROUP BY order_id`);
    const itemCounts = {};
    itemsRes.rows.forEach((r) => { itemCounts[r.order_id] = parseInt(r.count); });

    const pcrRes = await query(`SELECT id, order_id, old_total, new_total, reason, status FROM price_change_requests WHERE status = 'pending'`);
    const pendingPcrMap = {};
    pcrRes.rows.forEach((r) => { if (!pendingPcrMap[r.order_id]) pendingPcrMap[r.order_id] = r; });

    const enrichedOrders = orders.map((o) => ({
      ...o,
      item_count: itemCounts[o.id] || 0,
      pending_price_change: pendingPcrMap[o.id] || null,
    }));

    return res.json({ orders: enrichedOrders });
  } catch (err) {
    console.error('getPartnerOrders error:', err);
    return res.status(500).json({ error: 'Failed to retrieve partner orders.' });
  }
}

export async function respondToOrder(req, res) {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // 'accept' or 'reject'
    const laundryId = req.user.laundry_id;

    const orderRes = await query(`SELECT * FROM orders WHERE id = $1 AND laundry_id = $2`, [id, laundryId]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderRes.rows[0];
    if (order.status !== 'placed') {
      return res.status(400).json({ error: `Cannot respond to order in status '${order.status}'.` });
    }

    if (action === 'accept') {
      const updatedRes = await query(
        `UPDATE orders
         SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      await query(
        `INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by_user_id, notes)
         VALUES ($1, 'placed', 'accepted', $2, 'Order accepted by laundry partner')`,
        [id, req.user.id]
      );

      return res.json({ message: 'Order accepted!', order: updatedRes.rows[0] });
    } else if (action === 'reject') {
      const updatedRes = await query(
        `UPDATE orders
         SET status = 'rejected', rejection_reason = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [reason || 'Capacity exceeded or scheduling conflict', id]
      );

      await query(
        `INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by_user_id, notes)
         VALUES ($1, 'placed', 'rejected', $2, $3)`,
        [id, req.user.id, `Order rejected by laundry: ${reason || 'Not specified'}`]
      );

      return res.json({ message: 'Order rejected.', order: updatedRes.rows[0] });
    }

    return res.status(400).json({ error: 'Action must be accept or reject.' });
  } catch (err) {
    console.error('respondToOrder error:', err);
    return res.status(500).json({ error: 'Failed to update order.' });
  }
}

export async function recordGarmentIntake(req, res) {
  try {
    const { id } = req.params;
    const { items = [], generalNotes } = req.body;
    const laundryId = req.user.laundry_id;

    const orderRes = await query(`SELECT * FROM orders WHERE id = $1 AND laundry_id = $2`, [id, laundryId]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    const order = orderRes.rows[0];

    if (!['accepted', 'picked_up', 'garments_verified'].includes(order.status)) {
      return res.status(400).json({ error: `Garment intake cannot be recorded while the order is '${order.status}'.` });
    }

    const nextStatus = order.status === 'garments_verified' ? order.status : 'garments_verified';
    await withTransaction(async (tx) => {
      // Update or verify each item
      for (const item of items) {
        if (item.id) {
          await tx.query(
            `UPDATE order_items
             SET condition_notes = $1,
                 intake_verified = TRUE,
                 quantity = COALESCE($2, quantity),
                 photo_url = COALESCE($3, photo_url)
             WHERE id = $4 AND order_id = $5`,
            [item.conditionNotes || '', item.quantity, item.photoUrl || null, item.id, id]
          );
        }
      }

      // Only move forward; never pull a later status (processing, ready...) back
      await tx.query(
        `UPDATE orders
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [nextStatus, id]
      );

      // Record history
      await tx.query(
        `INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by_user_id, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          id,
          order.status,
          nextStatus,
          req.user.id,
          generalNotes ? `Intake verified: ${generalNotes}` : 'Physical garment intake and condition audit verified by laundry staff',
        ]
      );
    });

    // Fetch updated items
    const updatedItems = await query(`SELECT * FROM order_items WHERE order_id = $1 ORDER BY id`, [id]);

    return res.json({
      message: 'Garment intake verified and recorded in the chain of custody.',
      items: updatedItems.rows,
      status: nextStatus,
    });
  } catch (err) {
    console.error('recordGarmentIntake error:', err);
    return res.status(500).json({ error: 'Failed to record garment intake.' });
  }
}

export async function requestPriceChange(req, res) {
  try {
    const { id } = req.params;
    const { newSubtotal, reason } = req.body;
    const laundryId = req.user.laundry_id;

    if (!newSubtotal || !reason || !String(reason).trim()) {
      return res.status(400).json({ error: 'Please provide both the proposed new subtotal and detailed reason.' });
    }
    const proposed = parseFloat(newSubtotal);
    if (!Number.isFinite(proposed) || proposed <= 0 || proposed > 5000000) {
      return res.status(400).json({ error: 'The proposed subtotal must be a positive amount in Naira.' });
    }

    const orderRes = await query(`SELECT * FROM orders WHERE id = $1 AND laundry_id = $2`, [id, laundryId]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderRes.rows[0];
    const proposedSubtotal = proposed;

    if (!['accepted', 'picked_up', 'garments_verified', 'processing'].includes(order.status)) {
      return res.status(400).json({ error: `A price change cannot be requested while the order is '${order.status}'.` });
    }
    const openReq = await query(`SELECT id FROM price_change_requests WHERE order_id = $1 AND status = 'pending'`, [id]);
    if (openReq.rows.length > 0) {
      return res.status(400).json({ error: 'There is already a price change waiting for the customer.' });
    }

    // Calculate what the new customer total will be
    const newTotals = calculateOrderTotals({
      itemSubtotal: proposedSubtotal,
      serviceType: order.service_type,
      laundryDeliveryFee: order.delivery_fee,
    });

    const pcrRes = await withTransaction(async (tx) => {
      // Create pending price change request
      const pcrIns = await tx.query(
        `INSERT INTO price_change_requests (
          order_id, old_subtotal, new_subtotal, old_total, new_total, reason, status, requested_by
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
        RETURNING *`,
        [
          id,
          order.item_subtotal,
          proposedSubtotal,
          order.total_amount,
          newTotals.totalAmount,
          reason,
          req.user.id,
        ]
      );

      // Set order status to price_pending so customer is prompted
      await tx.query(
        `UPDATE orders
         SET status = 'price_pending', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );

      // Log in history
      await tx.query(
        `INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by_user_id, notes)
         VALUES ($1, $2, 'price_pending', $3, $4)`,
        [
          id,
          order.status,
          req.user.id,
          `Price adjustment requested: ₦${proposedSubtotal.toLocaleString()} (was ₦${parseFloat(order.item_subtotal).toLocaleString()}). Reason: ${reason}. Awaiting customer approval.`,
        ]
      );
      return pcrIns;
    });

    return res.status(201).json({
      message: 'Price modification submitted! Customer must approve before processing resumes.',
      request: pcrRes.rows[0],
    });
  } catch (err) {
    console.error('requestPriceChange error:', err);
    return res.status(500).json({ error: 'Failed to request price change.' });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const laundryId = req.user.laundry_id;

    const validStatuses = [
      'picked_up',
      'garments_verified',
      'processing',
      'ready',
      'out_for_delivery',
      'completed',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status: '${status}'.` });
    }

    const orderRes = await query(`SELECT * FROM orders WHERE id = $1 AND laundry_id = $2`, [id, laundryId]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderRes.rows[0];

    // Orders may only move ONE legal step forward. This also means an order that is
    // waiting for the customer's price approval ('price_pending'), rejected, cancelled
    // or completed can never be pushed along by the laundry.
    const ALLOWED_NEXT = {
      accepted: ['picked_up'],
      picked_up: ['garments_verified'],
      garments_verified: ['processing'],
      processing: ['ready'],
      ready: ['out_for_delivery', 'completed'],
      out_for_delivery: ['completed'],
    };
    const allowed = ALLOWED_NEXT[order.status] || [];
    if (!allowed.includes(status)) {
      const msg = order.status === 'price_pending'
        ? 'Customer has not yet approved the pending price change. Processing cannot proceed until the customer approves.'
        : `An order that is '${order.status}' cannot move to '${status}'.`;
      return res.status(400).json({ error: msg });
    }

    const updatedRes = await withTransaction(async (tx) => {
      let extraUpdates = '';
      const params = [status, id];

      if (status === 'completed') {
        extraUpdates = `, actual_return_date = CURRENT_TIMESTAMP`;
      }

      const upd = await tx.query(
        `UPDATE orders
         SET status = $1, updated_at = CURRENT_TIMESTAMP ${extraUpdates}
         WHERE id = $2
         RETURNING *`,
        params
      );

      await tx.query(
        `INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by_user_id, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, order.status, status, req.user.id, notes || `Status updated to ${status.replace(/_/g, ' ')}`]
      );
      return upd;
    });

    return res.json({
      message: `Order status advanced to ${status.replace(/_/g, ' ')}.`,
      order: updatedRes.rows[0],
    });
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    return res.status(500).json({ error: 'Failed to update order status.' });
  }
}

export async function getPartnerProfile(req, res) {
  try {
    const laundryId = req.user.laundry_id;
    const result = await query(`SELECT * FROM laundries WHERE id = $1`, [laundryId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Laundry not found.' });
    }
    return res.json({ laundry: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
}

export async function updatePartnerProfile(req, res) {
  try {
    const laundryId = req.user.laundry_id;
    const {
      businessName,
      description,
      address,
      area,
      phone,
      turnaroundDays,
      offersPickup,
      deliveryFee,
    } = req.body;

    const result = await query(
      `UPDATE laundries
       SET business_name = COALESCE($1, business_name),
           description = COALESCE($2, description),
           address = COALESCE($3, address),
           area = COALESCE($4, area),
           phone = COALESCE($5, phone),
           turnaround_days = COALESCE($6, turnaround_days),
           offers_pickup = COALESCE($7, offers_pickup),
           delivery_fee = COALESCE($8, delivery_fee)
       WHERE id = $9
       RETURNING *`,
      [
        businessName,
        description,
        address,
        area,
        phone,
        turnaroundDays ? parseInt(turnaroundDays) : null,
        offersPickup !== undefined ? offersPickup : null,
        deliveryFee !== undefined ? parseFloat(deliveryFee) : null,
        laundryId,
      ]
    );

    return res.json({ message: 'Profile updated successfully!', laundry: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
}

export async function getPartnerServices(req, res) {
  try {
    const laundryId = req.user.laundry_id;
    const result = await query(
      `SELECT * FROM services WHERE laundry_id = $1 ORDER BY category, name ASC`,
      [laundryId]
    );
    return res.json({ services: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve services.' });
  }
}

export async function createPartnerService(req, res) {
  try {
    const laundryId = req.user.laundry_id;
    const { name, category, description, unitPrice, unitType } = req.body;

    if (!name || !category || unitPrice === undefined) {
      return res.status(400).json({ error: 'Please provide service name, category, and price.' });
    }

    const result = await query(
      `INSERT INTO services (laundry_id, name, category, description, unit_price, unit_type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING *`,
      [laundryId, name, category, description || '', parseFloat(unitPrice), unitType || 'per_piece']
    );

    return res.status(201).json({ message: 'Service added!', service: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add service.' });
  }
}

export async function updatePartnerService(req, res) {
  try {
    const laundryId = req.user.laundry_id;
    const { id } = req.params;
    const { name, category, description, unitPrice, unitType, isActive } = req.body;

    const result = await query(
      `UPDATE services
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           description = COALESCE($3, description),
           unit_price = COALESCE($4, unit_price),
           unit_type = COALESCE($5, unit_type),
           is_active = COALESCE($6, is_active)
       WHERE id = $7 AND laundry_id = $8
       RETURNING *`,
      [
        name,
        category,
        description,
        unitPrice !== undefined ? parseFloat(unitPrice) : null,
        unitType,
        isActive !== undefined ? isActive : null,
        id,
        laundryId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    return res.json({ message: 'Service updated!', service: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update service.' });
  }
}

export async function deletePartnerService(req, res) {
  try {
    const laundryId = req.user.laundry_id;
    const { id } = req.params;

    // Soft delete by setting is_active = false
    await query(
      `UPDATE services SET is_active = FALSE WHERE id = $1 AND laundry_id = $2`,
      [id, laundryId]
    );

    return res.json({ message: 'Service deactivated successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete service.' });
  }
}

export async function getPartnerStats(req, res) {
  try {
    const laundryId = req.user.laundry_id;

    const statsRes = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'placed' THEN 1 ELSE 0 END), 0) AS new_requests,
         COALESCE(SUM(CASE WHEN status IN ('accepted', 'picked_up', 'garments_verified', 'price_pending', 'processing') THEN 1 ELSE 0 END), 0) AS in_progress,
         COALESCE(SUM(CASE WHEN status IN ('ready', 'out_for_delivery') THEN 1 ELSE 0 END), 0) AS ready_for_delivery,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_orders,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN laundry_payout_amount ELSE 0 END), 0) AS total_earnings
       FROM orders
       WHERE laundry_id = $1`,
      [laundryId]
    );

    return res.json({ stats: statsRes.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch partner stats.' });
  }
}

export default {
  getPartnerOrders,
  respondToOrder,
  recordGarmentIntake,
  requestPriceChange,
  updateOrderStatus,
  getPartnerProfile,
  updatePartnerProfile,
  getPartnerServices,
  createPartnerService,
  updatePartnerService,
  deletePartnerService,
  getPartnerStats,
};
