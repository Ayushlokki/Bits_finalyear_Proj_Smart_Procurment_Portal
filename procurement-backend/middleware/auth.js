
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Check user role
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

// Admin only middleware
const adminOnly = checkRole(['Admin']);

// Procurement manager or admin
const procurementManagerOrAdmin = checkRole(['Admin', 'Procurement Manager']);

// Employee or higher
const employeeOrHigher = checkRole(['Admin', 'Procurement Manager', 'Employee']);

// Vendor access
const vendorAccess = checkRole(['Vendor']);

// Any authenticated user
const authenticatedUser = checkRole(['Admin', 'Procurement Manager', 'Employee', 'Vendor']);

module.exports = {
  verifyToken,
  checkRole,
  adminOnly,
  procurementManagerOrAdmin,
  employeeOrHigher,
  vendorAccess,
  authenticatedUser
};
