const express = require('express');
const { authMiddleware, adminOrDoctorOnly } = require('../middleware/auth');
const router = express.Router();

// Get all symptom entries for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const userId = req.user.id;
    
    const rows = await db.all(
      'SELECT * FROM symptom_entries WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );
    
    const entries = rows.map(row => ({
      id: row.id.toString(),
      date: row.date,
      symptoms: JSON.parse(row.symptoms),
      notes: row.notes
    }));
    
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new symptom entry
router.post('/', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const { symptoms, notes, userId } = req.body;
    
    // Determine the user ID - either the logged-in user (for patients) or the specified user (for doctors/admins)
    let targetUserId = req.user.id;
    
    // If userId is provided in the body, only allow admins and doctors to use it
    if (userId) {
      if (req.user.role !== 'admin' && req.user.role !== 'doctor') {
        return res.status(403).json({ message: 'Access denied. Admin or doctor role required to add symptoms for other users.' });
      }
      targetUserId = userId;
    }
    
    if (!symptoms) return res.status(400).json({ message: 'Symptoms required' });

    const date = new Date().toISOString();
    const result = await db.run(
      'INSERT INTO symptom_entries (user_id, date, symptoms, notes) VALUES (?, ?, ?, ?)',
      [targetUserId, date, JSON.stringify(symptoms), notes || '']
    );
    
    res.json({
      id: result.id.toString(),
      user_id: targetUserId,
      date,
      symptoms,
      notes,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get symptom entries for a specific patient (for doctors)
router.get('/patients/:id', authMiddleware, adminOrDoctorOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const patientId = parseInt(req.params.id);

    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const rows = await db.all(
      'SELECT * FROM symptom_entries WHERE user_id = ? ORDER BY date DESC',
      [patientId]
    );
    
    const entries = rows.map(row => ({
      id: row.id.toString(),
      date: row.date,
      symptoms: JSON.parse(row.symptoms),
      notes: row.notes,
      created_at: row.created_at
    }));
    
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update symptom entry (for all users)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const entryId = parseInt(req.params.id);
    const { symptoms, notes } = req.body;

    if (isNaN(entryId) || !symptoms) {
      return res.status(400).json({ message: 'Invalid entry ID or symptoms required' });
    }

    const result = await db.run(
      'UPDATE symptom_entries SET symptoms = ?, notes = ? WHERE id = ?',
      [JSON.stringify(symptoms), notes || '', entryId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Symptom entry not found' });
    }
    
    res.json({ message: 'Symptom entry updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete symptom entry (for all users)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const entryId = parseInt(req.params.id);

    if (isNaN(entryId)) {
      return res.status(400).json({ message: 'Invalid entry ID' });
    }

    const result = await db.run('DELETE FROM symptom_entries WHERE id = ?', [entryId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Symptom entry not found' });
    }
    
    res.json({ message: 'Symptom entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
