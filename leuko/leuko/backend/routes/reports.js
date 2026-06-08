const express = require('express');
const { authMiddleware, adminOrDoctorOnly } = require('../middleware/auth');
const router = express.Router();

// Get all reports (for doctors/admins)
router.get('/', authMiddleware, adminOrDoctorOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    
    const rows = await db.all(
      'SELECT * FROM medical_reports ORDER BY created_at DESC'
    );
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get reports for a specific patient (for doctors/admins)
router.get('/patient/:id', authMiddleware, adminOrDoctorOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const patientId = parseInt(req.params.id);

    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const rows = await db.all(
      'SELECT * FROM medical_reports WHERE patient_id = ? ORDER BY created_at DESC',
      [patientId]
    );
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user's reports (for patients)
router.get('/my-reports', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const patientId = req.user.id;

    // Get patient information
    const patient = await db.get(
      'SELECT id, username, email, phone, dob, gender, address FROM users WHERE id = ?',
      [patientId]
    );

    // Get reports
    const reports = await db.all(
      'SELECT * FROM medical_reports WHERE patient_id = ? AND (hidden = 0 OR hidden IS NULL) ORDER BY created_at DESC',
      [patientId]
    );

    // Combine patient info with each report
    const reportsWithPatientInfo = reports.map(report => ({
      ...report,
      patient_info: patient
    }));
    
    res.json(reportsWithPatientInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new medical report
router.post('/', authMiddleware, adminOrDoctorOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const {
      patient_id,
      patient_name,
      report_type,
      chief_complaint,
      history_present_illness,
      physical_examination,
      assessment,
      plan,
      medications,
      follow_up,
      additional_notes
    } = req.body;

    if (!patient_id || !patient_name || !report_type) {
      return res.status(400).json({ message: 'Patient ID, patient name, and report type are required' });
    }

    const doctor_name = req.user.username;

    const result = await db.run(
      `INSERT INTO medical_reports (
        patient_id, patient_name, report_type, chief_complaint, 
        history_present_illness, physical_examination, assessment, 
        plan, medications, follow_up, additional_notes, doctor_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient_id, patient_name, report_type, chief_complaint,
        history_present_illness, physical_examination, assessment,
        plan, medications, follow_up, additional_notes, doctor_name
      ]
    );
    
    // Return the created report
    const createdReport = await db.get(
      'SELECT * FROM medical_reports WHERE id = ?',
      [result.id]
    );
    
    res.json(createdReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific report
router.get('/:id', authMiddleware, adminOrDoctorOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const reportId = parseInt(req.params.id);

    if (isNaN(reportId)) {
      return res.status(400).json({ message: 'Invalid report ID' });
    }

    const report = await db.get(
      'SELECT * FROM medical_reports WHERE id = ?',
      [reportId]
    );
    
    if (!report) return res.status(404).json({ message: 'Report not found' });
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a report
router.delete('/:id', authMiddleware, adminOrDoctorOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const reportId = parseInt(req.params.id);

    if (isNaN(reportId)) {
      return res.status(400).json({ message: 'Invalid report ID' });
    }

    const result = await db.run('DELETE FROM medical_reports WHERE id = ?', [reportId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Hide report from patient view (patient portal)
router.patch('/:id/hide', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const reportId = parseInt(req.params.id);
    const userId = req.user.id;
    
    if (isNaN(reportId)) {
      return res.status(400).json({ message: 'Invalid report ID' });
    }

    // Check if the report exists and belongs to the patient
    const report = await db.get('SELECT * FROM medical_reports WHERE id = ? AND patient_id = ?', [reportId, userId]);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Hide the report (set hidden = 1)
    await db.run('UPDATE medical_reports SET hidden = 1 WHERE id = ?', [reportId]);
    
    res.json({ message: 'Report hidden successfully' });
  } catch (error) {
    console.error('Error hiding report:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
