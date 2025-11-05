
const express = require('express');
const { verifyToken, procurementManagerOrAdmin, authenticatedUser } = require('../middleware/auth');

const router = express.Router();

// Generate PO number
function generatePONumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PO-${year}${month}-${random}`;
}

// Get all purchase orders
router.get('/', verifyToken, authenticatedUser, async (req, res) => {
  const pool = req.app.get('db');

  try {
    let query = `
      SELECT po.*, v.company_name as vendor_name, r.title as requisition_title,
             u.first_name || ' ' || u.last_name as created_by_name
      FROM purchase_orders po
      LEFT JOIN vendors v ON po.vendor_id = v.id
      LEFT JOIN requisitions r ON po.requisition_id = r.id
      LEFT JOIN users u ON po.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // If user is a vendor, only show their purchase orders
    if (req.user.role === 'Vendor') {
      const vendorQuery = await pool.query('SELECT id FROM vendors WHERE email = $1', [req.user.email]);
      if (vendorQuery.rows.length > 0) {
        paramCount++;
        query += ` AND po.vendor_id = $${paramCount}`;
        params.push(vendorQuery.rows[0].id);
      }
    }

    const { status, vendorId } = req.query;

    if (status) {
      paramCount++;
      query += ` AND po.status = $${paramCount}`;
      params.push(status);
    }

    if (vendorId && req.user.role !== 'Vendor') {
      paramCount++;
      query += ` AND po.vendor_id = $${paramCount}`;
      params.push(vendorId);
    }

    query += ' ORDER BY po.created_at DESC';

    const purchaseOrders = await pool.query(query, params);
    res.json(purchaseOrders.rows);

  } catch (error) {
    console.error('Get purchase orders error:', error);
    res.status(500).json({ message: 'Server error fetching purchase orders' });
  }
});

// Get purchase order by ID
router.get('/:id', verifyToken, authenticatedUser, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const po = await pool.query(
      `SELECT po.*, v.company_name as vendor_name, r.title as requisition_title,
              u.first_name || ' ' || u.last_name as created_by_name
       FROM purchase_orders po
       LEFT JOIN vendors v ON po.vendor_id = v.id
       LEFT JOIN requisitions r ON po.requisition_id = r.id
       LEFT JOIN users u ON po.created_by = u.id
       WHERE po.id = $1`,
      [req.params.id]
    );

    if (po.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    // Check if vendor can access this PO
    if (req.user.role === 'Vendor') {
      const vendorQuery = await pool.query('SELECT id FROM vendors WHERE email = $1', [req.user.email]);
      if (vendorQuery.rows.length === 0 || po.rows[0].vendor_id !== vendorQuery.rows[0].id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Get PO items
    const items = await pool.query(
      'SELECT * FROM po_items WHERE po_id = $1',
      [req.params.id]
    );

    res.json({
      ...po.rows[0],
      items: items.rows
    });

  } catch (error) {
    console.error('Get purchase order error:', error);
    res.status(500).json({ message: 'Server error fetching purchase order' });
  }
});

// Create new purchase order
router.post('/', verifyToken, procurementManagerOrAdmin, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const {
      requisitionId, vendorId, bidId, totalAmount, taxAmount, finalAmount,
      deliveryAddress, expectedDelivery, items
    } = req.body;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Generate PO number
      const poNumber = generatePONumber();

      // Create purchase order
      const newPO = await client.query(
        `INSERT INTO purchase_orders 
         (po_number, requisition_id, vendor_id, bid_id, total_amount, tax_amount, final_amount,
          delivery_address, expected_delivery, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [poNumber, requisitionId, vendorId, bidId, totalAmount, taxAmount, finalAmount,
         deliveryAddress, expectedDelivery, req.user.id]
      );

      const poId = newPO.rows[0].id;

      // Add PO items if provided
      if (items && items.length > 0) {
        for (const item of items) {
          await client.query(
            `INSERT INTO po_items (po_id, item_description, quantity, unit_price, total_price)
             VALUES ($1, $2, $3, $4, $5)`,
            [poId, item.description, item.quantity, item.unitPrice, item.totalPrice]
          );
        }
      }

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Purchase order created successfully',
        purchaseOrder: newPO.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Create purchase order error:', error);
    res.status(500).json({ message: 'Server error creating purchase order' });
  }
});

// Update purchase order status
router.put('/:id/status', verifyToken, authenticatedUser, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const { status } = req.body;

    // Validate status transition
    const validStatuses = ['Created', 'Sent', 'Acknowledged', 'In Progress', 'Delivered', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    let query = 'UPDATE purchase_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    const params = [status, req.params.id];

    // If user is vendor, they can only acknowledge orders
    if (req.user.role === 'Vendor') {
      if (status !== 'Acknowledged') {
        return res.status(403).json({ message: 'Vendors can only acknowledge orders' });
      }

      const vendorQuery = await pool.query('SELECT id FROM vendors WHERE email = $1', [req.user.email]);
      if (vendorQuery.rows.length > 0) {
        query += ' AND vendor_id = $3';
        params.push(vendorQuery.rows[0].id);
      }
    }

    query += ' RETURNING *';

    const updatedPO = await pool.query(query, params);

    if (updatedPO.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase order not found or cannot be updated' });
    }

    res.json({
      message: 'Purchase order status updated successfully',
      purchaseOrder: updatedPO.rows[0]
    });

  } catch (error) {
    console.error('Update PO status error:', error);
    res.status(500).json({ message: 'Server error updating purchase order status' });
  }
});

module.exports = router;
