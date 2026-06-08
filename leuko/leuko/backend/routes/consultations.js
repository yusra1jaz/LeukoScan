const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Request a consultation
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    
    // Only allow patients/users to request consultations
    if (req.user.role === 'admin' || req.user.role === 'doctor') {
      return res.status(403).json({ message: 'Access denied. Patient role required.' });
    }

    const {
      doctor_id,
      patient_id,
      preferred_date,
      preferred_time,
      consultation_type,
      symptoms,
      urgency,
      notes
    } = req.body;

    // Validate required fields
    if (!doctor_id || !patient_id || !preferred_date || !preferred_time || !consultation_type || !symptoms) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify patient_id matches authenticated user (convert to string for comparison)
    if (patient_id != req.user.id) {
      return res.status(403).json({ message: 'Unauthorized: Patient ID mismatch' });
    }

    // Verify doctor exists
    const doctor = await db.get('SELECT * FROM doctors WHERE id = ?', [parseInt(doctor_id)]);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Create consultation request
    const result = await db.run(`
      INSERT INTO consultation_requests (
        doctor_id, patient_id, preferred_date, preferred_time, 
        consultation_type, symptoms, urgency, notes, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    `, [
      doctor_id, patient_id, preferred_date, preferred_time,
      consultation_type, symptoms, urgency, notes
    ]);

    // Get the created consultation request
    const consultation = await db.get('SELECT * FROM consultation_requests WHERE id = ?', [result.id]);

    res.status(201).json({
      message: 'Consultation request submitted successfully',
      consultation
    });

  } catch (error) {
    console.error('Error creating consultation request:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get consultation requests for doctors
router.get('/doctor-requests', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    
    // Only allow doctors to view their consultation requests
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    // Find doctor record
    const doctor = await db.get('SELECT * FROM doctors WHERE username = ?', [req.user.username]);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Get consultation requests for this doctor
    const requests = await db.all(`
      SELECT cr.id, cr.patient_id, 
             COALESCE(u.fullName, u.username) as patient_name, u.email as patient_email, 
             u.dob, u.gender, cr.preferred_date, cr.preferred_time, cr.consultation_type, 
             cr.symptoms, cr.urgency, cr.notes, cr.status, cr.created_at
      FROM consultation_requests cr
      JOIN users u ON cr.patient_id = u.id
      WHERE cr.doctor_id = ?
      ORDER BY cr.created_at DESC
    `, [doctor.id]);

    res.json(requests);

  } catch (error) {
    console.error('Error fetching consultation requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get consultation requests for patients
router.get('/patient-requests', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    
    // Only allow patients to view their consultation requests
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Access denied. Patient role required.' });
    }

    // Get consultation requests for this patient
    const requests = await db.all(`
      SELECT cr.*, d.name as doctor_name, d.specialty, d.department
      FROM consultation_requests cr
      JOIN doctors d ON cr.doctor_id = d.id
      WHERE cr.patient_id = ?
      ORDER BY cr.created_at DESC
    `, [req.user.id]);

    res.json(requests);

  } catch (error) {
    console.error('Error fetching patient consultation requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update consultation request status (for doctors)
router.put('/update-status/:id', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    
    // Only allow doctors to update consultation status
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    const { status } = req.body;
    const requestId = parseInt(req.params.id);

    if (!['pending', 'approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find doctor record
    const doctor = await db.get('SELECT * FROM doctors WHERE username = ?', [req.user.username]);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Get the consultation request
    const consultation = await db.get('SELECT * FROM consultation_requests WHERE id = ?', [requestId]);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation request not found' });
    }

    // Verify this consultation belongs to the doctor
    if (consultation.doctor_id !== doctor.id) {
      return res.status(403).json({ message: 'Unauthorized: This consultation is not assigned to you' });
    }

    // Update status
    await db.run('UPDATE consultation_requests SET status = ?, updated_at = datetime("now") WHERE id = ?', [
      status, requestId
    ]);

    // Get updated consultation
    const updatedConsultation = await db.get('SELECT * FROM consultation_requests WHERE id = ?', [requestId]);

    res.json({
      message: 'Consultation status updated successfully',
      consultation: updatedConsultation
    });

  } catch (error) {
    console.error('Error updating consultation status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Cancel consultation request (for patients)
router.put('/cancel/:id', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    
    // Only allow patients to cancel their own consultation requests
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Access denied. Patient role required.' });
    }

    const requestId = parseInt(req.params.id);

    // Get the consultation request
    const consultation = await db.get('SELECT * FROM consultation_requests WHERE id = ?', [requestId]);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation request not found' });
    }

    // Verify this consultation belongs to the patient
    if (consultation.patient_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized: This consultation is not yours' });
    }

    // Only allow cancellation if status is pending or approved
    if (!['pending', 'approved'].includes(consultation.status)) {
      return res.status(400).json({ message: 'Cannot cancel consultation in current status' });
    }

    // Update status to cancelled
    await db.run('UPDATE consultation_requests SET status = "cancelled", updated_at = datetime("now") WHERE id = ?', [
      requestId
    ]);

    // Get updated consultation
    const updatedConsultation = await db.get('SELECT * FROM consultation_requests WHERE id = ?', [requestId]);

    res.json({
      message: 'Consultation cancelled successfully',
      consultation: updatedConsultation
    });

  } catch (error) {
    console.error('Error cancelling consultation:', error);
    res.status(500).json({ message: error.message });
  }
});

// Request a consultation with file uploads
router.post('/request-with-files', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const { upload } = require('../config');
    
    // Only allow patients/users to request consultations
    if (req.user.role === 'admin' || req.user.role === 'doctor') {
      return res.status(403).json({ message: 'Access denied. Patient role required.' });
    }

    
    // Handle file upload middleware
    upload.array('documents', 5)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: 'File upload error: ' + err.message });
      }

      const {
        doctor_id,
        patient_id,
        preferred_date,
        preferred_time,
        consultation_type,
        symptoms,
        urgency,
        notes
      } = req.body;

      // Validate required fields
      if (!doctor_id || !patient_id || !preferred_date || !preferred_time || !consultation_type || !symptoms) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Verify patient_id matches authenticated user (convert to string for comparison)
      if (patient_id != req.user.id) {
        return res.status(403).json({ message: 'Unauthorized: Patient ID mismatch' });
      }

      // Verify doctor exists
      const doctor = await db.get('SELECT * FROM doctors WHERE id = ?', [parseInt(doctor_id)]);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      // Create consultation request
      const result = await db.run(`
        INSERT INTO consultation_requests (
          doctor_id, patient_id, preferred_date, preferred_time, 
          consultation_type, symptoms, urgency, notes, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
      `, [
        doctor_id, patient_id, preferred_date, preferred_time,
        consultation_type, symptoms, urgency, notes
      ]);

      // Handle uploaded files
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          await db.run(`
            INSERT INTO consultation_documents (
              consultation_id, filename, original_name, file_path, file_size, uploaded_at
            ) VALUES (?, ?, ?, ?, ?, datetime('now'))
          `, [
            result.id,
            file.filename,
            file.originalname,
            file.path,
            file.size
          ]);
        }
      }

      // Get the created consultation request with documents
      const consultation = await db.get('SELECT * FROM consultation_requests WHERE id = ?', [result.id]);
      const documents = await db.all('SELECT * FROM consultation_documents WHERE consultation_id = ?', [result.id]);

      res.status(201).json({
        message: 'Consultation request submitted successfully',
        consultation: {
          ...consultation,
          documents
        }
      });
    });
  } catch (error) {
    console.error('Error creating consultation request with files:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get consultation documents
router.get('/documents/:consultationId', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const consultationId = parseInt(req.params.consultationId);
    
    if (!consultationId || isNaN(consultationId)) {
      return res.status(400).json({ message: 'Invalid consultation ID' });
    }

    const documents = await db.all(`
      SELECT id, filename, original_name, file_path, file_size, uploaded_at
      FROM consultation_documents 
      WHERE consultation_id = ?
      ORDER BY uploaded_at DESC
    `, [consultationId]);

    res.json(documents);
  } catch (error) {
    console.error('Error fetching consultation documents:', error);
    res.status(500).json({ message: error.message });
  }
});

// Download consultation document
router.get('/download-document/:documentId', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const documentId = parseInt(req.params.documentId);
    
    if (!documentId || isNaN(documentId)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }

    // Get document info from database
    const document = await db.get(`
      SELECT filename, original_name, file_path
      FROM consultation_documents 
      WHERE id = ?
    `, [documentId]);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const fs = require('fs');
    
    // Use the file_path directly since it's already an absolute path
    const fullPath = document.file_path;
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${document.original_name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Send the file
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete consultation request
router.delete('/delete/:requestId', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const requestId = parseInt(req.params.requestId);
    
    console.log('🗑️ DELETE REQUEST - Request ID:', requestId, 'User:', req.user.username, 'Role:', req.user.role);
    
    if (!requestId || isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    // Only allow doctors to delete their own consultation requests
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    // Find doctor record
    const doctor = await db.get('SELECT * FROM doctors WHERE username = ?', [req.user.username]);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Check if the consultation request belongs to this doctor
    const consultation = await db.get('SELECT * FROM consultation_requests WHERE id = ? AND doctor_id = ?', [requestId, doctor.id]);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation request not found or access denied' });
    }

    // Delete associated documents first
    await db.run('DELETE FROM consultation_documents WHERE consultation_id = ?', [requestId]);

    // Delete the consultation request
    await db.run('DELETE FROM consultation_requests WHERE id = ?', [requestId]);

    console.log('✅ CONSULTATION REQUEST DELETED - ID:', requestId);
    res.json({ message: 'Consultation request deleted successfully' });
  } catch (error) {
    console.error('Error deleting consultation request:', error);
    res.status(500).json({ message: error.message });
  }
});

// Withdraw consultation request (for patients - complete removal)
router.delete('/withdraw/:requestId', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const requestId = parseInt(req.params.requestId);
    
    if (!requestId || isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    // Only allow patients to withdraw their own consultation requests
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Access denied. Patient role required.' });
    }

    // Check if the consultation request belongs to this patient
    const consultation = await db.get('SELECT * FROM consultation_requests WHERE id = ? AND patient_id = ?', [requestId, req.user.id]);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation request not found or access denied' });
    }

    // Only allow withdrawal if status is pending (not approved or completed)
    if (consultation.status !== 'pending') {
      return res.status(400).json({ message: 'Can only withdraw pending consultation requests' });
    }

    console.log('🗑️ PATIENT WITHDRAWAL - Request ID:', requestId, 'User:', req.user.username);

    // Delete associated documents first
    await db.run('DELETE FROM consultation_documents WHERE consultation_id = ?', [requestId]);

    // Delete the consultation request completely
    await db.run('DELETE FROM consultation_requests WHERE id = ?', [requestId]);

    console.log('✅ CONSULTATION REQUEST WITHDRAWN - ID:', requestId);
    res.json({ message: 'Consultation request withdrawn successfully' });

  } catch (error) {
    console.error('Error withdrawing consultation request:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
