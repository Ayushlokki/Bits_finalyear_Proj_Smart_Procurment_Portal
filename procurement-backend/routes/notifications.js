
const express = require('express');
const { verifyToken, authenticatedUser } = require('../middleware/auth');

const router = express.Router();

// Get notifications for current user
router.get('/', verifyToken, authenticatedUser, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const notifications = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );

    res.json(notifications.rows);

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', verifyToken, authenticatedUser, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const updatedNotification = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (updatedNotification.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      message: 'Notification marked as read',
      notification: updatedNotification.rows[0]
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error marking notification as read' });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', verifyToken, authenticatedUser, async (req, res) => {
  const pool = req.app.get('db');

  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({ message: 'All notifications marked as read' });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Server error marking all notifications as read' });
  }
});

module.exports = router;
