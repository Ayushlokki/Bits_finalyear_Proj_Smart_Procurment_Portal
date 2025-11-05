
const express = require('express');
const { verifyToken, procurementManagerOrAdmin, vendorAccess, authenticatedUser } = require('../middleware/auth');

const router = express.Router();

// Get all invoices
router.get('/', verifyToken, authenticatedUser, async (req, res) => {
  const pool = req.app.get('db');

  try {
    let query = `
      SELECT i.*, po.po_number, v.company_name as vendor_name
      FROM invoices i
      LEFT JOIN purchase_orders po ON i.po_id = po.id
      LEFT JOIN vendors v ON i.vendor_id = v.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // If user is a vendor, only show their invoices
    if (req.user.role === 'Vendor') {
      const vendorQuery = await pool.query('SELECT id FROM vendors WHERE email = $1', [req.user.email]);
      if (vendorQuery.rows.length > 0) {
        paramCount++;
        query += ` AND i.vendor_id = $${paramCount}`;
        params.push(vendorQuery.rows[0].id);
      }
    }

    const { status, vendorId } = req.query;

    if (status) {
      paramCount++;
      query += ` AND i.status = $${paramCount}`;
      params.push(status);
    }

    if (vendorId && req.user.role !== 'Vendor') {
      paramCount++;
      query += ` AND i.vendor_id = $${paramCount}`;
      params.push(vendorId);
    }

    query += ' ORDER BY i.created_at DESC';

    const invoices = await pool.query(query, params);
    res.json(invoices.rows);

  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Server error fetching invoices' });
  }
});

// Get invoice by ID
router.get('/:id', verifyToken, authenticatedUser, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const invoice = await pool.query(
      `SELECT i.*, po.po_number, v.company_name as vendor_name
       FROM invoices i
       LEFT JOIN purchase_orders po ON i.po_id = po.id
       LEFT JOIN vendors v ON i.vendor_id = v.id
       WHERE i.id = $1`,
      [req.params.id]
    );

    if (invoice.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if vendor can access this invoice
    if (req.user.role === 'Vendor') {
      const vendorQuery = await pool.query('SELECT id FROM vendors WHERE email = $1', [req.user.email]);
      if (vendorQuery.rows.length === 0 || invoice.rows[0].vendor_id !== vendorQuery.rows[0].id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(invoice.rows[0]);

  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Server error fetching invoice' });
  }
});

// Create new invoice (vendors only)
router.post('/', verifyToken, vendorAccess, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const {
      invoiceNumber, poId, invoiceDate, dueDate, subtotal, taxAmount, totalAmount, notes
    } = req.body;

    // Get vendor ID for this user
    const vendorQuery = await pool.query('SELECT id FROM vendors WHERE email = $1', [req.user.email]);
    if (vendorQuery.rows.length === 0) {
      return res.status(400).json({ message: 'Vendor profile not found' });
    }

    const vendorId = vendorQuery.rows[0].id;

    // Verify that the PO belongs to this vendor
    const po = await pool.query(
      'SELECT * FROM purchase_orders WHERE id = $1 AND vendor_id = $2',
      [poId, vendorId]
    );

    if (po.rows.length === 0) {
      return res.status(400).json({ message: 'Purchase order not found or does not belong to your company' });
    }

    // Check if invoice number already exists
    const existingInvoice = await pool.query(
      'SELECT * FROM invoices WHERE invoice_number = $1',
      [invoiceNumber]
    );

    if (existingInvoice.rows.length > 0) {
      return res.status(400).json({ message: 'Invoice number already exists' });
    }

    const newInvoice = await pool.query(
      `INSERT INTO invoices 
       (invoice_number, po_id, vendor_id, invoice_date, due_date, subtotal, tax_amount, total_amount, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [invoiceNumber, poId, vendorId, invoiceDate, dueDate, subtotal, taxAmount, totalAmount, notes]
    );

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice: newInvoice.rows[0]
    });

  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Server error creating invoice' });
  }
});

// Update invoice status
router.put('/:id/status', verifyToken, procurementManagerOrAdmin, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const { status, notes } = req.body;

    const validStatuses = ['Received', 'Under Review', 'Approved', 'Paid', 'Disputed', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    let updateFields = 'status = $1, notes = $2';
    const params = [status, notes, req.params.id];

    // If marking as paid, set payment date
    if (status === 'Paid') {
      updateFields += ', payment_date = CURRENT_DATE';
    }

    const updatedInvoice = await pool.query(
      `UPDATE invoices SET ${updateFields} WHERE id = $3 RETURNING *`,
      params
    );

    if (updatedInvoice.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({
      message: 'Invoice status updated successfully',
      invoice: updatedInvoice.rows[0]
    });

  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ message: 'Server error updating invoice status' });
  }
});

module.exports = router;
