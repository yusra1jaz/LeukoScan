const express = require('express');
const { authMiddleware, adminOrDoctorOnly } = require('../middleware/auth');
const router = express.Router();

// Get all patients list (for doctors and admins)
router.get('/', authMiddleware, adminOrDoctorOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    
    const patients = await db.all(
      'SELECT id, username, fullName, email, phone, dob, gender, address, mr_number, created_at FROM users WHERE role = "user" ORDER BY created_at DESC'
    );
    
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get patient details for assessment
router.get('/:id', authMiddleware, adminOrDoctorOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const patientId = parseInt(req.params.id);
    
    if (!patientId || isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const patient = await db.get(
      'SELECT id, username, fullName, email, phone, dob, gender, address, mr_number, created_at FROM users WHERE id = ? AND role = "user"', 
      [patientId]
    );
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.json({ patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get patient disease information
router.get('/:id/disease', authMiddleware, adminOrDoctorOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const patientId = parseInt(req.params.id);
    
    if (!patientId || isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const diseaseInfo = await db.get(
      'SELECT leukemia_type as leukemiaType, stage, medications, hospital FROM patient_disease_info WHERE user_id = ?', 
      [patientId]
    );
    
    res.json({ disease: diseaseInfo || {} });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get patient doctor notes
router.get('/:id/notes', authMiddleware, adminOrDoctorOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const patientId = parseInt(req.params.id);
    
    if (!patientId || isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const notes = await db.all(
      'SELECT n.*, u.username as doctor_name FROM doctor_notes n JOIN users u ON n.doctor_id = u.id WHERE n.patient_id = ? ORDER BY n.created_at DESC', 
      [patientId]
    );
    
    res.json({ notes: notes || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add doctor note for patient
router.post('/:id/notes', authMiddleware, adminOrDoctorOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const patientId = parseInt(req.params.id);
    const { note } = req.body;
    const doctorId = req.user.id;

    if (!patientId || isNaN(patientId) || !note) {
      return res.status(400).json({ message: 'Patient ID and note are required' });
    }

    // Insert the note
    const result = await db.run('INSERT INTO doctor_notes (patient_id, doctor_id, note) VALUES (?, ?, ?)',
      [patientId, doctorId, note]
    );
    
    // Get the inserted note with doctor name
    const insertedNote = await db.get(`SELECT n.*, u.username as doctor_name FROM doctor_notes n 
               JOIN users u ON n.doctor_id = u.id 
               WHERE n.id = ?`, [result.id]);
    
    res.json({ note: insertedNote });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get symptom entries for a specific patient (for doctors)
router.get('/:id/symptoms', authMiddleware, adminOrDoctorOnly, async (req, res) => {
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

// Verify MR number for patient access
router.post('/:id/verify-mr', authMiddleware, adminOrDoctorOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const patientId = parseInt(req.params.id);
    const { mrNumber } = req.body;
    
    if (!patientId || isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }
    
    if (!mrNumber || !mrNumber.trim()) {
      return res.status(400).json({ message: 'MR number is required' });
    }

    // Get patient's MR number
    const patient = await db.get(
      'SELECT mr_number FROM users WHERE id = ? AND role = "user"', 
      [patientId]
    );
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    if (!patient.mr_number) {
      return res.status(400).json({ message: 'Patient does not have an MR number assigned' });
    }
    
    // Verify MR number (case insensitive)
    if (patient.mr_number.toUpperCase() !== mrNumber.trim().toUpperCase()) {
      return res.status(401).json({ message: 'Invalid MR number' });
    }
    
    res.json({ 
      message: 'MR number verified successfully',
      verified: true
    });
    
  } catch (error) {
    console.error('MR verification error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get doctor notes for patient (patient access)
router.get('/:id/notes-patient', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const patientId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Ensure user can only access their own notes
    if (userId !== patientId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const notes = await db.all(
      'SELECT n.*, u.username as doctor_name FROM doctor_notes n JOIN users u ON n.doctor_id = u.id WHERE n.patient_id = ? AND (n.hidden = 0 OR n.hidden IS NULL) ORDER BY n.created_at DESC', 
      [patientId]
    );
    
    res.json({ notes: notes || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete doctor note
router.delete('/:id/notes/:noteId', authMiddleware, adminOrDoctorOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const patientId = parseInt(req.params.id);
    const noteId = parseInt(req.params.noteId);
    
    if (isNaN(patientId) || isNaN(noteId)) {
      return res.status(400).json({ message: 'Invalid patient ID or note ID' });
    }

    // Check if the note exists and belongs to the patient
    const note = await db.get('SELECT * FROM doctor_notes WHERE id = ? AND patient_id = ?', [noteId, patientId]);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Delete the note
    await db.run('DELETE FROM doctor_notes WHERE id = ?', [noteId]);
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: error.message });
  }
});

// Hide doctor note from patient view (patient portal)
router.patch('/:id/notes/:noteId/hide', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const patientId = parseInt(req.params.id);
    const noteId = parseInt(req.params.noteId);
    const userId = req.user.id;
    
    if (isNaN(patientId) || isNaN(noteId)) {
      return res.status(400).json({ message: 'Invalid patient ID or note ID' });
    }

    // Ensure user can only hide their own notes
    if (userId !== patientId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if the note exists and belongs to the patient
    const note = await db.get('SELECT * FROM doctor_notes WHERE id = ? AND patient_id = ?', [noteId, patientId]);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Hide the note (set hidden = 1)
    await db.run('UPDATE doctor_notes SET hidden = 1 WHERE id = ?', [noteId]);
    
    res.json({ message: 'Note hidden successfully' });
  } catch (error) {
    console.error('Error hiding note:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
