
const express = require('express');
const { verifyToken, procurementManagerOrAdmin, vendorAccess, authenticatedUser } = require('../middleware/auth');

const router = express.Router();

// Get all vendors
router.get('/', verifyToken, authenticatedUser, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const { status, category, search } = req.query;
    let query = 'SELECT * FROM vendors WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (company_name ILIKE $${paramCount} OR contact_person ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const vendors = await pool.query(query, params);
    res.json(vendors.rows);

  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ message: 'Server error fetching vendors' });
  }
});

// Get vendor by ID
router.get('/:id', verifyToken, authenticatedUser, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const vendor = await pool.query('SELECT * FROM vendors WHERE id = $1', [req.params.id]);

    if (vendor.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json(vendor.rows[0]);

  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({ message: 'Server error fetching vendor' });
  }
});

// Create new vendor
router.post('/', verifyToken, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const {
      companyName, contactPerson, email, phone, address, city, state, country,
      postalCode, taxId, website, category
    } = req.body;

    // Check if vendor already exists
    const existingVendor = await pool.query('SELECT * FROM vendors WHERE email = $1', [email]);

    if (existingVendor.rows.length > 0) {
      return res.status(400).json({ message: 'Vendor with this email already exists' });
    }

    const newVendor = await pool.query(
      `INSERT INTO vendors 
       (company_name, contact_person, email, phone, address, city, state, country, postal_code, tax_id, website, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [companyName, contactPerson, email, phone, address, city, state, country, postalCode, taxId, website, category]
    );

    res.status(201).json({
      message: 'Vendor created successfully',
      vendor: newVendor.rows[0]
    });

  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({ message: 'Server error creating vendor' });
  }
});

// Update vendor
router.put('/:id', verifyToken, procurementManagerOrAdmin, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const {
      companyName, contactPerson, email, phone, address, city, state, country,
      postalCode, taxId, website, category, rating
    } = req.body;

    const updatedVendor = await pool.query(
      `UPDATE vendors SET 
       company_name = $1, contact_person = $2, email = $3, phone = $4, address = $5, 
       city = $6, state = $7, country = $8, postal_code = $9, tax_id = $10, 
       website = $11, category = $12, rating = $13
       WHERE id = $14 RETURNING *`,
      [companyName, contactPerson, email, phone, address, city, state, country, 
       postalCode, taxId, website, category, rating, req.params.id]
    );

    if (updatedVendor.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json({
      message: 'Vendor updated successfully',
      vendor: updatedVendor.rows[0]
    });

  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ message: 'Server error updating vendor' });
  }
});

// Approve vendor
router.put('/:id/approve', verifyToken, procurementManagerOrAdmin, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const updatedVendor = await pool.query(
      `UPDATE vendors SET 
       status = 'Approved', approved_by = $1, approved_date = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [req.user.id, req.params.id]
    );

    if (updatedVendor.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json({
      message: 'Vendor approved successfully',
      vendor: updatedVendor.rows[0]
    });

  } catch (error) {
    console.error('Approve vendor error:', error);
    res.status(500).json({ message: 'Server error approving vendor' });
  }
});

// Reject vendor
router.put('/:id/reject', verifyToken, procurementManagerOrAdmin, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const updatedVendor = await pool.query(
      `UPDATE vendors SET 
       status = 'Rejected', approved_by = $1, approved_date = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [req.user.id, req.params.id]
    );

    if (updatedVendor.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json({
      message: 'Vendor rejected successfully',
      vendor: updatedVendor.rows[0]
    });

  } catch (error) {
    console.error('Reject vendor error:', error);
    res.status(500).json({ message: 'Server error rejecting vendor' });
  }
});

// Get vendor performance
router.get('/:id/performance', verifyToken, authenticatedUser, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const performance = await pool.query(
      `SELECT vp.*, po.po_number, po.total_amount 
       FROM vendor_performance vp
       LEFT JOIN purchase_orders po ON vp.po_id = po.id
       WHERE vp.vendor_id = $1
       ORDER BY vp.evaluation_date DESC`,
      [req.params.id]
    );

    res.json(performance.rows);

  } catch (error) {
    console.error('Get vendor performance error:', error);
    res.status(500).json({ message: 'Server error fetching vendor performance' });
  }
});

module.exports = router;
