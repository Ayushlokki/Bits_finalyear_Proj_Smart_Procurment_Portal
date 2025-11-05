
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register new user
router.post('/register', async (req, res) => {
  const pool = req.app.get('db');

  try {
    const { username, email, password, firstName, lastName, role, department } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role, department) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, email, first_name, last_name, role, department`,
      [username, email, hashedPassword, firstName, lastName, role, department]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: newUser.rows[0].id, 
        username: newUser.rows[0].username,
        role: newUser.rows[0].role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: newUser.rows[0]
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
 
  const pool = req.app.get('db');

  try {
    const { username, password } = req.body;
     console.log("VALUES",username,password);
     const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

     console.log("PASS",hashedPassword);


    // Find user
    const user = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [username]
    );
      
    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const userData = user.rows[0];


    // Check password
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);
    console.log("VALUES1",isValidPassword);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: userData.id, 
        username: userData.username,
        role: userData.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Don't send password hash
    const { password_hash, ...userWithoutPassword } = userData;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const user = await pool.query(
      'SELECT id, username, email, first_name, last_name, role, department, phone, status, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.rows[0]);

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const { firstName, lastName, email, phone, department } = req.body;

    const updatedUser = await pool.query(
      `UPDATE users SET 
       first_name = $1, last_name = $2, email = $3, phone = $4, department = $5, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6 
       RETURNING id, username, email, first_name, last_name, role, department, phone, status`,
      [firstName, lastName, email, phone, department, req.user.id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.rows[0]
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;
