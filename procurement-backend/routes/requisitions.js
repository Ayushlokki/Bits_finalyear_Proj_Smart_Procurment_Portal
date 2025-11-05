
const express = require('express');
const { verifyToken, employeeOrHigher, procurementManagerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all requisitions
router.get('/', verifyToken, employeeOrHigher, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const { status, department, priority } = req.query;
    let query = `
      SELECT r.*, u.first_name || ' ' || u.last_name as requested_by_name,
             a.first_name || ' ' || a.last_name as approved_by_name
      FROM requisitions r
      LEFT JOIN users u ON r.requested_by = u.id
      LEFT JOIN users a ON r.approved_by = a.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // If user is not admin/procurement manager, only show their own requisitions
    if (req.user.role === 'Employee') {
      paramCount++;
      query += ` AND r.requested_by = $${paramCount}`;
      params.push(req.user.id);
    }

    if (status) {
      paramCount++;
      query += ` AND r.status = $${paramCount}`;
      params.push(status);
    }

    if (department) {
      paramCount++;
      query += ` AND r.department = $${paramCount}`;
      params.push(department);
    }

    if (priority) {
      paramCount++;
      query += ` AND r.priority = $${paramCount}`;
      params.push(priority);
    }

    query += ' ORDER BY r.created_at DESC';

    const requisitions = await pool.query(query, params);
    res.json(requisitions.rows);

  } catch (error) {
    console.error('Get requisitions error:', error);
    res.status(500).json({ message: 'Server error fetching requisitions' });
  }
});

// Get requisition by ID
router.get('/:id', verifyToken, employeeOrHigher, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const requisition = await pool.query(
      `SELECT r.*, u.first_name || ' ' || u.last_name as requested_by_name,
              a.first_name || ' ' || a.last_name as approved_by_name
       FROM requisitions r
       LEFT JOIN users u ON r.requested_by = u.id
       LEFT JOIN users a ON r.approved_by = a.id
       WHERE r.id = $1`,
      [req.params.id]
    );

    if (requisition.rows.length === 0) {
      return res.status(404).json({ message: 'Requisition not found' });
    }

    // Check if user can access this requisition
    if (req.user.role === 'Employee' && requisition.rows[0].requested_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(requisition.rows[0]);

  } catch (error) {
    console.error('Get requisition error:', error);
    res.status(500).json({ message: 'Server error fetching requisition' });
  }
});

// Create new requisition
router.post('/', verifyToken, employeeOrHigher, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const {
      title, description, department, category, quantity, unitPrice, totalBudget,
      priority, requiredDate
    } = req.body;

    const newRequisition = await pool.query(
      `INSERT INTO requisitions 
       (title, description, department, category, quantity, unit_price, total_budget, priority, required_date, requested_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [title, description, department, category, quantity, unitPrice, totalBudget, priority, requiredDate, req.user.id]
    );

    res.status(201).json({
      message: 'Requisition created successfully',
      requisition: newRequisition.rows[0]
    });

  } catch (error) {
    console.error('Create requisition error:', error);
    res.status(500).json({ message: 'Server error creating requisition' });
  }
});

// Update requisition
router.put('/:id', verifyToken, employeeOrHigher, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const {
      title, description, department, category, quantity, unitPrice, totalBudget,
      priority, requiredDate
    } = req.body;

    // Check if requisition exists and user can update it
    const existingReq = await pool.query('SELECT * FROM requisitions WHERE id = $1', [req.params.id]);

    if (existingReq.rows.length === 0) {
      return res.status(404).json({ message: 'Requisition not found' });
    }

    // Only allow updates by the requester or admin/procurement manager
    if (req.user.role === 'Employee' && existingReq.rows[0].requested_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Don't allow updates if already approved
    if (existingReq.rows[0].status === 'Approved' || existingReq.rows[0].status === 'Completed') {
      return res.status(400).json({ message: 'Cannot update approved or completed requisition' });
    }

    const updatedRequisition = await pool.query(
      `UPDATE requisitions SET 
       title = $1, description = $2, department = $3, category = $4, quantity = $5,
       unit_price = $6, total_budget = $7, priority = $8, required_date = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
      [title, description, department, category, quantity, unitPrice, totalBudget, priority, requiredDate, req.params.id]
    );

    res.json({
      message: 'Requisition updated successfully',
      requisition: updatedRequisition.rows[0]
    });

  } catch (error) {
    console.error('Update requisition error:', error);
    res.status(500).json({ message: 'Server error updating requisition' });
  }
});

// Submit requisition for approval
router.put('/:id/submit', verifyToken, employeeOrHigher, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const updatedRequisition = await pool.query(
      `UPDATE requisitions SET 
       status = 'Submitted', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND requested_by = $2 AND status = 'Draft'
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (updatedRequisition.rows.length === 0) {
      return res.status(404).json({ message: 'Requisition not found or cannot be submitted' });
    }

    res.json({
      message: 'Requisition submitted for approval',
      requisition: updatedRequisition.rows[0]
    });

  } catch (error) {
    console.error('Submit requisition error:', error);
    res.status(500).json({ message: 'Server error submitting requisition' });
  }
});

// Approve requisition
router.put('/:id/approve', verifyToken, procurementManagerOrAdmin, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const updatedRequisition = await pool.query(
      `UPDATE requisitions SET 
       status = 'Approved', approved_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status IN ('Submitted', 'Under Review')
       RETURNING *`,
      [req.user.id, req.params.id]
    );

    if (updatedRequisition.rows.length === 0) {
      return res.status(404).json({ message: 'Requisition not found or cannot be approved' });
    }

    res.json({
      message: 'Requisition approved successfully',
      requisition: updatedRequisition.rows[0]
    });

  } catch (error) {
    console.error('Approve requisition error:', error);
    res.status(500).json({ message: 'Server error approving requisition' });
  }
});

// Reject requisition
router.put('/:id/reject', verifyToken, procurementManagerOrAdmin, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const { rejectionReason } = req.body;

    const updatedRequisition = await pool.query(
      `UPDATE requisitions SET 
       status = 'Rejected', approved_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status IN ('Submitted', 'Under Review')
       RETURNING *`,
      [req.user.id, req.params.id]
    );

    if (updatedRequisition.rows.length === 0) {
      return res.status(404).json({ message: 'Requisition not found or cannot be rejected' });
    }

    res.json({
      message: 'Requisition rejected',
      requisition: updatedRequisition.rows[0]
    });

  } catch (error) {
    console.error('Reject requisition error:', error);
    res.status(500).json({ message: 'Server error rejecting requisition' });
  }
});

module.exports = router;
