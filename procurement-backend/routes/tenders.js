
const express = require('express');
const { verifyToken, procurementManagerOrAdmin, authenticatedUser } = require('../middleware/auth');

const router = express.Router();

// Get all tenders
router.get('/', verifyToken, authenticatedUser, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const { status, category } = req.query;
    let query = `
      SELECT t.*, r.title as requisition_title, u.first_name || ' ' || u.last_name as created_by_name,
             (SELECT COUNT(*) FROM bids WHERE tender_id = t.id) as bid_count
      FROM tenders t
      LEFT JOIN requisitions r ON t.requisition_id = r.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND t.status = $${paramCount}`;
      params.push(status);
    }

    if (category) {
      paramCount++;
      query += ` AND t.category = $${paramCount}`;
      params.push(category);
    }

    query += ' ORDER BY t.created_at DESC';

    const tenders = await pool.query(query, params);
    res.json(tenders.rows);

  } catch (error) {
    console.error('Get tenders error:', error);
    res.status(500).json({ message: 'Server error fetching tenders' });
  }
});

// Get tender by ID
router.get('/:id', verifyToken, authenticatedUser, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const tender = await pool.query(
      `SELECT t.*, r.title as requisition_title, u.first_name || ' ' || u.last_name as created_by_name
       FROM tenders t
       LEFT JOIN requisitions r ON t.requisition_id = r.id
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (tender.rows.length === 0) {
      return res.status(404).json({ message: 'Tender not found' });
    }

    res.json(tender.rows[0]);

  } catch (error) {
    console.error('Get tender error:', error);
    res.status(500).json({ message: 'Server error fetching tender' });
  }
});

// Create new tender
router.post('/', verifyToken, procurementManagerOrAdmin, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const {
      requisitionId, title, description, category, budget, closingDate, termsConditions
    } = req.body;

    const newTender = await pool.query(
      `INSERT INTO tenders 
       (requisition_id, title, description, category, budget, closing_date, terms_conditions, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [requisitionId, title, description, category, budget, closingDate, termsConditions, req.user.id]
    );

    res.status(201).json({
      message: 'Tender created successfully',
      tender: newTender.rows[0]
    });

  } catch (error) {
    console.error('Create tender error:', error);
    res.status(500).json({ message: 'Server error creating tender' });
  }
});

// Update tender
router.put('/:id', verifyToken, procurementManagerOrAdmin, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const {
      title, description, category, budget, closingDate, termsConditions
    } = req.body;

    const updatedTender = await pool.query(
      `UPDATE tenders SET 
       title = $1, description = $2, category = $3, budget = $4, 
       closing_date = $5, terms_conditions = $6
       WHERE id = $7 AND status = 'Active'
       RETURNING *`,
      [title, description, category, budget, closingDate, termsConditions, req.params.id]
    );

    if (updatedTender.rows.length === 0) {
      return res.status(404).json({ message: 'Tender not found or cannot be updated' });
    }

    res.json({
      message: 'Tender updated successfully',
      tender: updatedTender.rows[0]
    });

  } catch (error) {
    console.error('Update tender error:', error);
    res.status(500).json({ message: 'Server error updating tender' });
  }
});

// Close tender
router.put('/:id/close', verifyToken, procurementManagerOrAdmin, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const updatedTender = await pool.query(
      `UPDATE tenders SET 
       status = 'Closed'
       WHERE id = $1 AND status = 'Active'
       RETURNING *`,
      [req.params.id]
    );

    if (updatedTender.rows.length === 0) {
      return res.status(404).json({ message: 'Tender not found or cannot be closed' });
    }

    res.json({
      message: 'Tender closed successfully',
      tender: updatedTender.rows[0]
    });

  } catch (error) {
    console.error('Close tender error:', error);
    res.status(500).json({ message: 'Server error closing tender' });
  }
});

// Get tender bids
router.get('/:id/bids', verifyToken, procurementManagerOrAdmin, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const bids = await pool.query(
      `SELECT b.*, v.company_name as vendor_name, u.first_name || ' ' || u.last_name as reviewed_by_name
       FROM bids b
       LEFT JOIN vendors v ON b.vendor_id = v.id
       LEFT JOIN users u ON b.reviewed_by = u.id
       WHERE b.tender_id = $1
       ORDER BY b.submitted_at DESC`,
      [req.params.id]
    );

    res.json(bids.rows);

  } catch (error) {
    console.error('Get tender bids error:', error);
    res.status(500).json({ message: 'Server error fetching tender bids' });
  }
});

module.exports = router;
