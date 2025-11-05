
const express = require('express');
const { verifyToken, vendorAccess, procurementManagerOrAdmin, authenticatedUser } = require('../middleware/auth');

const router = express.Router();

// Get all bids (filtered by user role)
router.get('/', verifyToken, authenticatedUser, async (req, res) => {
  const pool = req.app.get('db');

  try {
    let query = `
      SELECT b.*, t.title as tender_title, v.company_name as vendor_name,
             u.first_name || ' ' || u.last_name as reviewed_by_name
      FROM bids b
      LEFT JOIN tenders t ON b.tender_id = t.id
      LEFT JOIN vendors v ON b.vendor_id = v.id
      LEFT JOIN users u ON b.reviewed_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // If user is a vendor, only show their bids
    if (req.user.role === 'Vendor') {
      // Get vendor ID for this user
      const vendorQuery = await pool.query('SELECT id FROM vendors WHERE email = $1', [req.user.email]);
      if (vendorQuery.rows.length > 0) {
        paramCount++;
        query += ` AND b.vendor_id = $${paramCount}`;
        params.push(vendorQuery.rows[0].id);
      }
    }

    const { tenderId, status } = req.query;

    if (tenderId) {
      paramCount++;
      query += ` AND b.tender_id = $${paramCount}`;
      params.push(tenderId);
    }

    if (status) {
      paramCount++;
      query += ` AND b.status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY b.submitted_at DESC';

    const bids = await pool.query(query, params);
    res.json(bids.rows);

  } catch (error) {
    console.error('Get bids error:', error);
    res.status(500).json({ message: 'Server error fetching bids' });
  }
});

// Get bid by ID
router.get('/:id', verifyToken, authenticatedUser, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const bid = await pool.query(
      `SELECT b.*, t.title as tender_title, v.company_name as vendor_name,
              u.first_name || ' ' || u.last_name as reviewed_by_name
       FROM bids b
       LEFT JOIN tenders t ON b.tender_id = t.id
       LEFT JOIN vendors v ON b.vendor_id = v.id
       LEFT JOIN users u ON b.reviewed_by = u.id
       WHERE b.id = $1`,
      [req.params.id]
    );

    if (bid.rows.length === 0) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    // Check if vendor can access this bid
    if (req.user.role === 'Vendor') {
      const vendorQuery = await pool.query('SELECT id FROM vendors WHERE email = $1', [req.user.email]);
      if (vendorQuery.rows.length === 0 || bid.rows[0].vendor_id !== vendorQuery.rows[0].id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(bid.rows[0]);

  } catch (error) {
    console.error('Get bid error:', error);
    res.status(500).json({ message: 'Server error fetching bid' });
  }
});

// Submit new bid (vendors only)
router.post('/', verifyToken, vendorAccess, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const { tenderId, bidAmount, deliveryTime, specifications } = req.body;

    // Get vendor ID for this user
    const vendorQuery = await pool.query('SELECT id FROM vendors WHERE email = $1', [req.user.email]);
    if (vendorQuery.rows.length === 0) {
      return res.status(400).json({ message: 'Vendor profile not found' });
    }

    const vendorId = vendorQuery.rows[0].id;

    // Check if tender is still active
    const tender = await pool.query(
      'SELECT * FROM tenders WHERE id = $1 AND status = $2 AND closing_date > CURRENT_DATE',
      [tenderId, 'Active']
    );

    if (tender.rows.length === 0) {
      return res.status(400).json({ message: 'Tender is not available for bidding' });
    }

    // Check if vendor already submitted a bid for this tender
    const existingBid = await pool.query(
      'SELECT * FROM bids WHERE tender_id = $1 AND vendor_id = $2',
      [tenderId, vendorId]
    );

    if (existingBid.rows.length > 0) {
      return res.status(400).json({ message: 'You have already submitted a bid for this tender' });
    }

    const newBid = await pool.query(
      `INSERT INTO bids (tender_id, vendor_id, bid_amount, delivery_time, specifications)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tenderId, vendorId, bidAmount, deliveryTime, specifications]
    );

    res.status(201).json({
      message: 'Bid submitted successfully',
      bid: newBid.rows[0]
    });

  } catch (error) {
    console.error('Submit bid error:', error);
    res.status(500).json({ message: 'Server error submitting bid' });
  }
});

// Update bid (vendors only, before review)
router.put('/:id', verifyToken, vendorAccess, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const { bidAmount, deliveryTime, specifications } = req.body;

    // Get vendor ID for this user
    const vendorQuery = await pool.query('SELECT id FROM vendors WHERE email = $1', [req.user.email]);
    if (vendorQuery.rows.length === 0) {
      return res.status(400).json({ message: 'Vendor profile not found' });
    }

    const vendorId = vendorQuery.rows[0].id;

    const updatedBid = await pool.query(
      `UPDATE bids SET 
       bid_amount = $1, delivery_time = $2, specifications = $3
       WHERE id = $4 AND vendor_id = $5 AND status = 'Submitted'
       RETURNING *`,
      [bidAmount, deliveryTime, specifications, req.params.id, vendorId]
    );

    if (updatedBid.rows.length === 0) {
      return res.status(404).json({ message: 'Bid not found or cannot be updated' });
    }

    res.json({
      message: 'Bid updated successfully',
      bid: updatedBid.rows[0]
    });

  } catch (error) {
    console.error('Update bid error:', error);
    res.status(500).json({ message: 'Server error updating bid' });
  }
});

// Accept bid
router.put('/:id/accept', verifyToken, procurementManagerOrAdmin, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const { reviewNotes } = req.body;

    const updatedBid = await pool.query(
      `UPDATE bids SET 
       status = 'Accepted', reviewed_by = $1, review_notes = $2
       WHERE id = $3 AND status = 'Submitted'
       RETURNING *`,
      [req.user.id, reviewNotes, req.params.id]
    );

    if (updatedBid.rows.length === 0) {
      return res.status(404).json({ message: 'Bid not found or cannot be accepted' });
    }

    res.json({
      message: 'Bid accepted successfully',
      bid: updatedBid.rows[0]
    });

  } catch (error) {
    console.error('Accept bid error:', error);
    res.status(500).json({ message: 'Server error accepting bid' });
  }
});

// Reject bid
router.put('/:id/reject', verifyToken, procurementManagerOrAdmin, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const { reviewNotes } = req.body;

    const updatedBid = await pool.query(
      `UPDATE bids SET 
       status = 'Rejected', reviewed_by = $1, review_notes = $2
       WHERE id = $3 AND status = 'Submitted'
       RETURNING *`,
      [req.user.id, reviewNotes, req.params.id]
    );

    if (updatedBid.rows.length === 0) {
      return res.status(404).json({ message: 'Bid not found or cannot be rejected' });
    }

    res.json({
      message: 'Bid rejected',
      bid: updatedBid.rows[0]
    });

  } catch (error) {
    console.error('Reject bid error:', error);
    res.status(500).json({ message: 'Server error rejecting bid' });
  }
});

module.exports = router;
