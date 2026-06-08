const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function authMiddleware(req, res, next) {
  try {
    const token = req.cookies.token;
    console.log('Auth middleware - Token present:', !!token);
    console.log('Auth middleware - Request URL:', req.url);
    console.log('Auth middleware - Request method:', req.method);
    
    if (!token) {
      console.log('Auth middleware - No token found');
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const payload = jwt.verify(token, JWT_SECRET);
    console.log('Auth middleware - Token verified, user:', payload.username, 'role:', payload.role);
    req.user = payload;
    next();
  } catch (error) {
    console.log('Auth middleware - Token verification failed:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. ${allowedRoles.join(' or ')} role required.` 
      });
    }
    
    next();
  };
}

function adminOnly(req, res, next) {
  return roleMiddleware(['admin'])(req, res, next);
}

function adminOrDoctorOnly(req, res, next) {
  return roleMiddleware(['admin', 'doctor'])(req, res, next);
}

module.exports = {
  authMiddleware,
  roleMiddleware,
  adminOnly,
  adminOrDoctorOnly
};
