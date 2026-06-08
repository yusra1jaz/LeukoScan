const express = require('express');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Get all doctors (for admin dashboard)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    
    const doctors = await db.all(
      'SELECT id, name, email, phone, specialty, department, experience, created_at FROM doctors ORDER BY created_at DESC'
    );
    
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users (for admin dashboard - to count admins)
router.get('/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    
    const users = await db.all(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
