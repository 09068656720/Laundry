import { query, withTransaction } from '../db/index.js';
import { calculateOrderTotals } from '../services/commission.service.js';
import { paymentService } from '../services/payment.service.js';

export async function createOrder(req, res) {
  try {
    const {
      laundryId,
      serviceType = 'pickup',
      pickupAddress,
      deliveryAddress,
      pickupDate,
      items = [],
      customerNotes,
      paymentMethod = 'simulated_card',
    } = req.body;

    if (!laundryId) {
      return res.status(400).json({ error: 'Please select a laundry partner.' });
    }
    if (!['pickup', 'dropoff'].includes(serviceType)) {
      return res.status(400).json({ error: "serviceType must be 'pickup' or 'dropoff'." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one garment must be selected.' });
    }
    if (items.length > 50) {
      return res.status(400).json({ error: 'Too many different items in one order (max 50).' });
    }
    if (serviceType === 'pickup' && !(pickupAddress && String(pickupAddress).trim())) {
      return res.status(400).json({ error: 'A pickup address is required for home pickup.' });
    }
    if (!['simulated_card', 'simulated_transfer'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Unsupported payment method.' });
    }

    // Pickup date: valid and not in the past
    const pDate = pickupDate ? new Date(pickupDate) : new Date();
    if (Number.isNaN(pDate.getTime())) {
      return res.status(400).json({ error: 'Invalid pickup date.' });
    }
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (pickupDate && pDate < startOfToday) {
      return res.status(400).json({ error: 'Pickup date cannot be in the past.' });
    }

    // Laundry must exist, be active AND approved by the admin
    const laundryRes = await query(
      `SELECT id, business_name, turnaround_days, offers_pickup, delivery_fee, is_approved
       FROM laundries
       WHERE id = $1 AND is_active = TRUE`,
      [laundryId]
    );
    if (laundryRes.rows.length === 0) {
      return res.status(404).json({ error: 'Laundry partner not found.' });
    }
    const laundry = laundryRes.rows[0];

    if (!laundry.is_approved) {
      return res.status(400).json({ error: 'This laundry is not yet approved to receive orders.' });
    }
    if (serviceType === 'pickup' && !laundry.offers_pickup) {
      return res.status(400).json({ error: `${laundry.business_name} does not offer pickup service. Please choose drop-off.` });
    }

    // PRICES COME FROM THE DATABASE, never from the browser.
    // The client only tells us WHICH service and HOW MANY.
    const serviceIds = [...new Set(items.map((i) => parseInt(i.serviceId)).filter(Number.isInteger))];
    if (serviceIds.length === 0) {
      return res.status(400).json({ error: 'Each garment must reference a service from the laundry menu.' });
    }
    const servicesRes = await query(
      `SELECT id, name, category, unit_price
       FROM services
       WHERE id = ANY($1::int[]) AND laundry_id = $2 AND is_active = TRUE`,
      [serviceIds, laundry.id]
    );
    const serviceMap = new Map(servicesRes.rows.map((s) => [s.id, s]));

    let itemSubtotal = 0;
    const validatedItems = [];
    for (const item of items) {
      const service = serviceMap.get(parseInt(item.serviceId));
      if (!service) {
        return res.status(400).json({ error: 'One of the selected services is not available at this laundry.' });
      }
      const qty = parseInt(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
        return res.status(400).json({ error: 'Quantity for each item must be a whole number between 1 and 100.' });
      }
      const unitPrice = parseFloat(service.unit_price);
      const totalPrice = parseFloat((qty * unitPrice).toFixed(2));
      itemSubtotal += totalPrice;

      validatedItems.push({
        serviceId: service.id,
        itemName: service.name,
        category: service.category,
        quantity: qty,
        unitPrice,
        totalPrice,
        conditionNotes: String(item.conditionNotes || '').slice(0, 500),
      });
    }

    // Estimated return date = pickup date + the laundry's turnaround time
    const estReturnDate = new Date(pDate);
    estReturnDate.setDate(estReturnDate.getDate() + (laundry.turnaround_days || 2));

    const totals = calculateOrderTotals({
      itemSubtotal,
      serviceType,
      laundryDeliveryFee: laundry.delivery_fee,
    });

    // Save the whole order in ONE transaction: order + garments + history (all or nothing)
    const { createdOrder, paymentDetails } = await withTransaction(async (tx) => {
      // Customer profile (created on first order if missing)
      let customerId = req.user.customer_id;
      if (!customerId) {
        const custRes = await tx.query(
          `INSERT INTO customers (user_id, default_address, city, area)
           VALUES ($1, $2, 'Kano', 'Kano')
           ON CONFLICT (user_id) DO UPDATE SET default_address = COALESCE(customers.default_address, EXCLUDED.default_address)
           RETURNING id`,
          [req.user.id, pickupAddress || null]
        );
        customerId = custRes.rows[0].id;
      }

      // Collision-free order number from a database sequence
      const seqRes = await tx.query(`SELECT nextval('order_number_seq') AS n`);
      const orderNumber = `KN-${new Date().getFullYear()}-${seqRes.rows[0].n}`;

      const orderInsertRes = await tx.query(
        `INSERT INTO orders (
          order_number, customer_id, laundry_id, service_type,
          pickup_address, delivery_address, pickup_date, estimated_return_date,
          status, payment_status, payment_method,
          item_subtotal, delivery_fee, service_fee, total_amount,
          platform_commission_rate, platform_commission_amount, laundry_payout_amount,
          customer_notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          'placed', 'pending', $9,
          $10, $11, $12, $13,
          $14, $15, $16,
          $17
        ) RETURNING *`,
        [
          orderNumber,
          customerId,
          laundry.id,
          serviceType,
          serviceType === 'pickup' ? String(pickupAddress).trim() : null,
          serviceType === 'pickup' ? (deliveryAddress || pickupAddress || '') : null,
          pDate,
          estReturnDate,
          paymentMethod,
          totals.itemSubtotal,
          totals.deliveryFee,
          totals.serviceFee,
          totals.totalAmount,
          totals.commissionRate,
          totals.commissionAmount,
          totals.laundryPayoutAmount,
          customerNotes ? String(customerNotes).slice(0, 1000) : null,
        ]
      );
      const order = orderInsertRes.rows[0];

      for (const it of validatedItems) {
        await tx.query(
          `INSERT INTO order_items (
            order_id, service_id, item_name, category, quantity, unit_price, total_price, condition_notes, intake_verified
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)`,
          [order.id, it.serviceId, it.itemName, it.category, it.quantity, it.unitPrice, it.totalPrice, it.conditionNotes]
        );
      }

      await tx.query(
        `INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by_user_id, notes)
         VALUES ($1, NULL, 'placed', $2, $3)`,
        [
          order.id,
          req.user.id,
          `Order placed by customer via web portal (${serviceType === 'pickup' ? 'Home Pickup requested' : 'Customer Drop-off'})`,
        ]
      );

      // Payment (simulated for now). If it throws, the whole order is rolled back.
      const payRes = await paymentService.processPayment({
        amount: totals.totalAmount,
        orderNumber,
        customerEmail: req.user.email,
        paymentMethod,
      });

      let finalOrder = order;
      if (payRes.success) {
        const upd = await tx.query(
          `UPDATE orders SET payment_status = 'paid' WHERE id = $1 RETURNING *`,
          [order.id]
        );
        finalOrder = upd.rows[0];
      }

      return { createdOrder: finalOrder, paymentDetails: payRes.success ? payRes : null };
    });

    return res.status(201).json({
      message: 'Order placed successfully!',
      order: createdOrder,
      payment: paymentDetails,
    });
  } catch (err) {
    console.error('createOrder error:', err);
    return res.status(500).json({ error: 'Failed to create order.' });
  }
}

export async function getCustomerOrders(req, res) {
  try {
    const customerId = req.user.customer_id;
    if (!customerId) {
      return res.json({ orders: [] });
    }

    const result = await query(
      `SELECT o.*,
              l.business_name AS laundry_name, l.phone AS laundry_phone, l.address AS laundry_address, l.area AS laundry_area
       FROM orders o
       JOIN laundries l ON l.id = o.laundry_id
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC`,
      [customerId]
    );

    const orders = result.rows;
    if (orders.length === 0) {
      return res.json({ orders: [] });
    }

    const orderIds = orders.map((o) => o.id);

    // Fetch items count and pending price changes
    const itemsRes = await query(
      `SELECT order_id, COUNT(*) AS count FROM order_items GROUP BY order_id`
    );
    const itemCounts = {};
    itemsRes.rows.forEach((r) => {
      itemCounts[r.order_id] = parseInt(r.count);
    });

    const pcrRes = await query(
      `SELECT id, order_id, old_total, new_total, reason, status
       FROM price_change_requests
       WHERE status = 'pending'
       ORDER BY id DESC`
    );
    const pendingPcrMap = {};
    pcrRes.rows.forEach((r) => {
      if (!pendingPcrMap[r.order_id]) {
        pendingPcrMap[r.order_id] = r;
      }
    });

    const enrichedOrders = orders.map((o) => ({
      ...o,
      item_count: itemCounts[o.id] || 0,
      pending_price_change: pendingPcrMap[o.id] || null,
    }));

    return res.json({ orders: enrichedOrders });
  } catch (err) {
    console.error('getCustomerOrders error:', err);
    return res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
}

export async function getOrderById(req, res) {
  try {
    const { id } = req.params;

    const orderRes = await query(
      `SELECT o.*,
              l.business_name AS laundry_name, l.phone AS laundry_phone, l.address AS laundry_address, l.area AS laundry_area, l.email AS laundry_email,
              c.user_id AS customer_user_id,
              u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
       FROM orders o
       LEFT JOIN laundries l ON l.id = o.laundry_id
       LEFT JOIN customers c ON c.id = o.customer_id
       LEFT JOIN users u ON u.id = c.user_id
       WHERE o.id = $1`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderRes.rows[0];

    // Role-based access check
    if (req.user.role === 'customer' && order.customer_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only view your own orders.' });
    }
    if (req.user.role === 'partner' && order.laundry_id !== req.user.laundry_id) {
      return res.status(403).json({ error: 'Access denied. You can only view orders assigned to your laundry.' });
    }

    // Fetch items
    const itemsRes = await query(
      `SELECT id, service_id, item_name, category, quantity, unit_price, total_price, condition_notes, intake_verified, photo_url
       FROM order_items
       WHERE order_id = $1
       ORDER BY id ASC`,
      [id]
    );

    // Fetch status history
    const historyRes = await query(
      `SELECT osh.*, u.full_name AS changed_by_name, u.role AS changed_by_role
       FROM order_status_history osh
       LEFT JOIN users u ON u.id = osh.changed_by_user_id
       WHERE osh.order_id = $1
       ORDER BY osh.created_at ASC`,
      [id]
    );

    // Fetch price change requests
    const priceChangeRes = await query(
      `SELECT * FROM price_change_requests
       WHERE order_id = $1
       ORDER BY id DESC`,
      [id]
    );

    // Fetch disputes
    const disputeRes = await query(
      `SELECT d.*, u.full_name AS raised_by_name
       FROM disputes d
       LEFT JOIN users u ON u.id = d.raised_by_user_id
       WHERE d.order_id = $1
       ORDER BY d.created_at DESC`,
      [id]
    );

    // Fetch review
    const reviewRes = await query(
      `SELECT * FROM reviews WHERE order_id = $1 LIMIT 1`,
      [id]
    );

    return res.json({
      order: {
        ...order,
        items: itemsRes.rows,
        history: historyRes.rows,
        priceChangeRequests: priceChangeRes.rows,
        pendingPriceChange: priceChangeRes.rows.find((p) => p.status === 'pending') || null,
        disputes: disputeRes.rows,
        review: reviewRes.rows[0] || null,
      },
    });
  } catch (err) {
    console.error('getOrderById error:', err);
    return res.status(500).json({ error: 'Failed to retrieve order details.' });
  }
}

export async function approvePriceChange(req, res) {
  try {
    const { id } = req.params;
    const { requestId } = req.body;

    // Verify order ownership
    const orderRes = await query(
      `SELECT o.*, c.user_id AS customer_user_id, l.delivery_fee AS laundry_delivery_fee
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       JOIN laundries l ON l.id = o.laundry_id
       WHERE o.id = $1`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderRes.rows[0];
    if (order.customer_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the ordering customer can approve price changes.' });
    }

    // Find pending request
    let pcrRes;
    if (requestId) {
      pcrRes = await query(`SELECT * FROM price_change_requests WHERE id = $1 AND order_id = $2`, [requestId, id]);
    } else {
      pcrRes = await query(`SELECT * FROM price_change_requests WHERE order_id = $1 AND status = 'pending' ORDER BY id DESC LIMIT 1`, [id]);
    }

    if (pcrRes.rows.length === 0) {
      return res.status(400).json({ error: 'No pending price change request found for this order.' });
    }

    const pcr = pcrRes.rows[0];

    if (pcr.status !== 'pending' || order.status !== 'price_pending') {
      return res.status(400).json({ error: 'This price change is no longer awaiting your approval.' });
    }

    // Calculate new commission & laundry payout on new subtotal
    const newTotals = calculateOrderTotals({
      itemSubtotal: pcr.new_subtotal,
      serviceType: order.service_type,
      laundryDeliveryFee: order.delivery_fee,
    });

    const updatedOrderRes = await withTransaction(async (tx) => {
      // Update price change request
      await tx.query(
        `UPDATE price_change_requests
         SET status = 'approved', responded_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [pcr.id]
      );

      // Update order with new total, commission, and payout
      const updatedRes = await tx.query(
        `UPDATE orders
         SET item_subtotal = $1,
             total_amount = $2,
             platform_commission_amount = $3,
             laundry_payout_amount = $4,
             status = CASE WHEN status = 'price_pending' THEN 'processing' ELSE status END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [
          newTotals.itemSubtotal,
          newTotals.totalAmount,
          newTotals.commissionAmount,
          newTotals.laundryPayoutAmount,
          id,
        ]
      );

      // Log in status history
      await tx.query(
        `INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by_user_id, notes)
         VALUES ($1, $2, $2, $3, $4)`,
        [
          id,
          order.status,
          req.user.id,
          `Customer APPROVED price adjustment. New subtotal: ₦${newTotals.itemSubtotal.toLocaleString()}, Total: ₦${newTotals.totalAmount.toLocaleString()} (Reason: ${pcr.reason})`,
        ]
      );
      return updatedRes;
    });

    return res.json({
      message: 'Price change approved successfully! Order processing will continue.',
      order: updatedOrderRes.rows[0],
    });
  } catch (err) {
    console.error('approvePriceChange error:', err);
    return res.status(500).json({ error: 'Failed to approve price change.' });
  }
}

export async function declinePriceChange(req, res) {
  try {
    const { id } = req.params;
    const { requestId } = req.body;

    const orderRes = await query(
      `SELECT o.*, c.user_id AS customer_user_id
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE o.id = $1`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderRes.rows[0];
    if (order.customer_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the ordering customer can decline price changes.' });
    }

    let pcrRes;
    if (requestId) {
      pcrRes = await query(`SELECT * FROM price_change_requests WHERE id = $1 AND order_id = $2`, [requestId, id]);
    } else {
      pcrRes = await query(`SELECT * FROM price_change_requests WHERE order_id = $1 AND status = 'pending' ORDER BY id DESC LIMIT 1`, [id]);
    }

    if (pcrRes.rows.length === 0) {
      return res.status(400).json({ error: 'No pending price change request found.' });
    }

    const pcr = pcrRes.rows[0];

    if (pcr.status !== 'pending' || order.status !== 'price_pending') {
      return res.status(400).json({ error: 'This price change is no longer awaiting your decision.' });
    }

    const updatedOrderRes = await withTransaction(async (tx) => {
      // Mark declined
      await tx.query(
        `UPDATE price_change_requests
         SET status = 'declined', responded_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [pcr.id]
      );

      // Update order status to cancelled
      const updatedRes = await tx.query(
        `UPDATE orders
         SET status = 'cancelled',
             cancellation_reason = 'Customer declined price adjustment after inspection. Garments to be returned.',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      // Log status history
      await tx.query(
        `INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by_user_id, notes)
         VALUES ($1, $2, 'cancelled', $3, 'Customer DECLINED price adjustment. Order cancelled and clothes will be returned without charge.')`,
        [id, order.status, req.user.id]
      );
      return updatedRes;
    });

    return res.json({
      message: 'Price adjustment declined. Order has been cancelled and garments will be returned.',
      order: updatedOrderRes.rows[0],
    });
  } catch (err) {
    console.error('declinePriceChange error:', err);
    return res.status(500).json({ error: 'Failed to decline price change.' });
  }
}

export async function cancelOrder(req, res) {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by customer' } = req.body;

    const orderRes = await query(
      `SELECT o.*, c.user_id AS customer_user_id
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE o.id = $1`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderRes.rows[0];
    if (order.customer_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (order.status !== 'placed') {
      return res.status(400).json({
        error: `Order cannot be cancelled because it is already in '${order.status}' status. Please contact support.`,
      });
    }

    const updatedRes = await query(
      `UPDATE orders
       SET status = 'cancelled', cancellation_reason = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [reason, id]
    );

    await query(
      `INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by_user_id, notes)
       VALUES ($1, 'placed', 'cancelled', $2, $3)`,
      [id, req.user.id, `Order cancelled by customer: ${reason}`]
    );

    return res.json({ message: 'Order cancelled successfully.', order: updatedRes.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to cancel order.' });
  }
}

export async function raiseDispute(req, res) {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;

    if (!reason || !description) {
      return res.status(400).json({ error: 'Please provide both dispute reason and description.' });
    }

    const orderRes = await query(`SELECT * FROM orders WHERE id = $1`, [id]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const dispRes = await query(
      `INSERT INTO disputes (order_id, raised_by_user_id, reason, description, status)
       VALUES ($1, $2, $3, $4, 'open')
       RETURNING *`,
      [id, req.user.id, reason, description]
    );

    // Log history
    await query(
      `INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by_user_id, notes)
       VALUES ($1, $2, $2, $3, $4)`,
      [id, orderRes.rows[0].status, req.user.id, `Dispute opened by ${req.user.role}: ${reason}`]
    );

    return res.status(201).json({ message: 'Dispute submitted. Admin team will review.', dispute: dispRes.rows[0] });
  } catch (err) {
    console.error('raiseDispute error:', err);
    return res.status(500).json({ error: 'Failed to raise dispute.' });
  }
}

export async function createReview(req, res) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Please provide a star rating between 1 and 5.' });
    }

    const orderRes = await query(
      `SELECT o.*, c.user_id AS customer_user_id
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE o.id = $1`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderRes.rows[0];
    if (order.customer_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the ordering customer can leave a review.' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Reviews can only be submitted for completed orders.' });
    }

    const revRes = await query(
      `INSERT INTO reviews (order_id, customer_id, laundry_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, order.customer_id, order.laundry_id, rating, comment || null]
    );

    // Update laundry average rating
    await query(
      `UPDATE laundries
       SET rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE laundry_id = $1)
       WHERE id = $1`,
      [order.laundry_id]
    );

    return res.status(201).json({ message: 'Thank you for your review!', review: revRes.rows[0] });
  } catch (err) {
    console.error('createReview error:', err);
    return res.status(500).json({ error: 'Failed to submit review.' });
  }
}

export default {
  createOrder,
  getCustomerOrders,
  getOrderById,
  approvePriceChange,
  declinePriceChange,
  cancelOrder,
  raiseDispute,
  createReview,
};
