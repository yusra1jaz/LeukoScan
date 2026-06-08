const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Get all doctors (public endpoint for patients)
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    
    // Allow any authenticated user to view doctors list
    const doctors = await db.all(`
      SELECT id, name, specialty, department, experience, designation, photo 
      FROM doctors 
      ORDER BY name
    `);
    
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors list:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get doctor profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    
    // Only allow doctors to access their own profile
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    // Try to find doctor record by username first, then by user_id
    let doctor = await db.get('SELECT * FROM doctors WHERE username = ?', [req.user.username]);
    
    if (doctor) {
      // Found doctor by username
      console.log(`[Doctor Profile] Found doctor by username: ${req.user.username}`);
      return res.json(doctor);
    }
    
    // Try to find by user_id
    doctor = await db.get('SELECT * FROM doctors WHERE user_id = ?', [req.user.id]);
    
    if (doctor) {
      // Found doctor by user_id
      console.log(`[Doctor Profile] Found doctor by user_id: ${req.user.id}`);
      return res.json(doctor);
    }
    
    // If no doctor record exists, check if there's a doctor record with matching email
    doctor = await db.get('SELECT * FROM doctors WHERE email = ?', [req.user.email]);
    
    if (doctor) {
      // Found doctor by email
      console.log(`[Doctor Profile] Found doctor by email: ${req.user.email}`);
      return res.json(doctor);
    }
    
    // No doctor record found at all, return basic user info
    console.log(`[Doctor Profile] No doctor record found for user: ${req.user.username}, returning user info`);
    return res.json({
      id: req.user.id,
      name: req.user.username,
      email: req.user.email,
      username: req.user.username,
      phone: '',
      dob: '',
      gender: '',
      address: '',
      specialty: '',
      department: '',
      degree: '',
      experience: 0,
      designation: '',
      license: '',
      photo: ''
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update doctor profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    
    // Only allow doctors to update their own profile
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    // Find existing doctor record
    let doctor = await db.get('SELECT * FROM doctors WHERE username = ?', [req.user.username]);
    
    if (!doctor) {
      // Try to find by user_id
      doctor = await db.get('SELECT * FROM doctors WHERE user_id = ?', [req.user.id]);
    }
    
    if (!doctor) {
      // Try to find by email
      doctor = await db.get('SELECT * FROM doctors WHERE email = ?', [req.user.email]);
    }

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    // Handle file upload if present
    const multer = require('multer');
    const path = require('path');
    
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/');
      },
      filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
      }
    });

    const upload = multer({ 
      storage: storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        cb(null, allowedTypes.includes(file.mimetype));
      }
    }).single('photo');

    // Process the file upload
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: 'File upload error: ' + err.message });
      }

      try {
        const { name, email, phone, dob, gender, address, specialty, department, degree, experience, designation, license, username } = req.body;
        
        // Update doctor record
        const photo = req.file ? `/uploads/${req.file.filename}` : doctor.photo;
        const expNum = experience ? Number(experience) : doctor.experience;

        await db.run(
          `UPDATE doctors SET 
            name=?, email=?, phone=?, dob=?, gender=?, address=?, 
            specialty=?, department=?, degree=?, designation=?, experience=?, license=?, photo=?
            WHERE id=?`,
          [name || doctor.name, email || doctor.email, phone || doctor.phone, 
           dob || doctor.dob, gender || doctor.gender, address || doctor.address,
           specialty || doctor.specialty, department || doctor.department, 
           degree || doctor.degree, designation || doctor.designation, 
           expNum, license || doctor.license || '', photo, doctor.id]
        );

        // Get updated doctor record
        const updatedDoctor = await db.get('SELECT * FROM doctors WHERE id = ?', [doctor.id]);
        
        res.json(updatedDoctor);
      } catch (updateError) {
        console.error('Error updating doctor profile:', updateError);
        res.status(500).json({ message: 'Failed to update profile' });
      }
    });
  } catch (error) {
    console.error('Error in profile update:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
