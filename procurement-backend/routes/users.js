
const express = require('express');
const { verifyToken, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', verifyToken, adminOnly, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const users = await pool.query(
      'SELECT id, username, email, first_name, last_name, role, department, phone, status, created_at FROM users ORDER BY created_at DESC'
    );

    res.json(users.rows);

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Get user by ID
router.get('/:id', verifyToken, async (req, res) => {
  const pool = req.app.get('db');

  try {
    // Users can only access their own profile unless they're admin
    if (req.user.role !== 'Admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await pool.query(
      'SELECT id, username, email, first_name, last_name, role, department, phone, status, created_at FROM users WHERE id = $1',
      [req.params.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.rows[0]);

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
});

// Update user status (admin only)
router.put('/:id/status', verifyToken, adminOnly, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const { status } = req.body;

    const validStatuses = ['Active', 'Inactive', 'Suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updatedUser = await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, first_name, last_name, role, department, phone, status',
      [status, req.params.id]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User status updated successfully',
      user: updatedUser.rows[0]
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
});

module.exports = router;
