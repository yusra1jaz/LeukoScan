const express = require('express');
const bcrypt = require('bcryptjs');
const { setTokenCookie, generateResetToken } = require('../utils/helpers');
const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  const { username, fullname, email, phone, gender, country, password, role } = req.body;
  if (!username || !email || !password) return res.status(400).json({ message: 'Missing fields' });

  try {
    const db = require('../models/database');
    
    // Check if user exists
    const existingUser = await db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) return res.status(409).json({ message: 'Username or email exists' });

    const hashed = await bcrypt.hash(password, 10);
    const assignedRole = role || 'user';
    
    // Assign ID based on role with proper range validation
    let newId;
    if (assignedRole === 'admin') {
      // Admin range: 1-999
      const lastAdmin = await db.get('SELECT id FROM users WHERE role = "admin" ORDER BY id DESC LIMIT 1');
      
      if (lastAdmin) {
        newId = lastAdmin.id + 1;
        if (newId > 999) {
          // Find first available slot in 1-999 range
          const existingAdminIds = await db.all('SELECT id FROM users WHERE role = "admin" AND id <= 999 ORDER BY id');
          let nextId = 1;
          for (const admin of existingAdminIds) {
            if (admin.id === nextId) {
              nextId++;
            } else {
              break; // Found a gap
            }
          }
          if (nextId > 999) {
            return res.status(400).json({ message: 'Maximum admin limit reached (999 admins)' });
          }
          newId = nextId;
        }
      } else {
        newId = 1; // First admin starts at ID 1
      }
    } else if (assignedRole === 'doctor') {
      // Doctor range: 1000-1999
      const lastDoctor = await db.get('SELECT id FROM users WHERE role = "doctor" ORDER BY id DESC LIMIT 1');
      
      if (lastDoctor) {
        newId = lastDoctor.id + 1;
        if (newId > 1999) {
          // Find first available slot in 1000-1999 range
          const existingDoctorIds = await db.all('SELECT id FROM users WHERE role = "doctor" AND id >= 1000 AND id <= 1999 ORDER BY id');
          let nextId = 1000;
          for (const doctor of existingDoctorIds) {
            if (doctor.id === nextId) {
              nextId++;
            } else {
              break; // Found a gap
            }
          }
          if (nextId > 1999) {
            return res.status(400).json({ message: 'Maximum doctor limit reached (1000 doctors)' });
          }
          newId = nextId;
        }
      } else {
        newId = 1000; // First doctor starts at ID 1000
      }
    } else {
      // Patient/User range: 2000+
      const lastUser = await db.get('SELECT id FROM users WHERE role = "user" ORDER BY id DESC LIMIT 1');
      newId = lastUser ? Math.max(lastUser.id + 1, 2000) : 2000;
    }
    
    // Store plain password only for admins, others get null
    const plainPasswordToStore = assignedRole === 'admin' ? password : null;
    
    const result = await db.run(
      'INSERT INTO users (id, username, fullName, email, phone, gender, country, password, plain_password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newId, username, fullname, email, phone, gender, country, hashed, plainPasswordToStore, assignedRole]
    );
    
    const user = { id: newId, username, email, role: assignedRole };
    setTokenCookie(res, { id: user.id, username: user.username, role: user.role });
    res.status(201).json({ message: 'User created', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  
  try {
    const db = require('../models/database');
    
    const user = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [usernameOrEmail, usernameOrEmail]);
    if (!user) return res.status(401).json({ message: 'Username or email not found' });
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Incorrect password' });
    
    setTokenCookie(res, { id: user.id, username: user.username, role: user.role });
    res.json({ message: 'Logged in', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// Current user
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../config');
    const payload = jwt.verify(token, JWT_SECRET);
    
    // Get full user information from database
    const db = require('../models/database');
    const user = await db.get('SELECT id, username, fullName, email, role FROM users WHERE id = ?', [payload.id]);
    
    if (!user) return res.status(401).json({ message: 'User not found' });
    
    res.json({ user });
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  try {
    const db = require('../models/database');
    
    // Check if user exists
    const user = await db.get('SELECT email FROM users WHERE email = ?', [email]);
    if (!user) return res.status(404).json({ message: 'No account found with this email' });
    
    // Generate reset token
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Store token in database
    await db.run('INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, ?)',
      [email, token, expiresAt.toISOString()]
    );
    
    // In a real application, you would send an email here
    const resetLink = `http://localhost:5173/reset-password?token=${token}&email=${email}`;
    
    console.log('Password reset link:', resetLink);
    
    res.json({
      message: 'Password reset link sent to your email',
      // For demo only - remove this in production
      resetLink: resetLink,
      token: token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const { token, email, newPassword } = req.body;
  
  if (!token || !email || !newPassword) {
    return res.status(400).json({ message: 'Token, email, and new password are required' });
  }
  
  try {
    const db = require('../models/database');
    
    // Verify token is valid and not expired
    const resetToken = await db.get(
      'SELECT * FROM password_reset_tokens WHERE email = ? AND token = ? AND expires_at > datetime("now") AND used_at IS NULL',
      [email, token]
    );
    
    if (!resetToken) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    await db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
    
    // Mark token as used
    await db.run('UPDATE password_reset_tokens SET used_at = datetime("now") WHERE id = ?', [resetToken.id]);
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Doctor Request (for admin approval)
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
}).any();

router.post('/signup/doctor', upload, async (req, res) => {
  try {
    const db = require('../models/database');
    
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('Received request body:', req.body);
    console.log('Received files:', req.files);
    
    // Parse FormData properly
    const { fullname, email, phone, gender, country, area, specialty, department, degree, experience, designation, license } = req.body;
    
    console.log('Extracted fields:', { fullname, email, phone, gender, country, area, specialty, department, degree, experience, designation, license });
    
    if (!fullname || !email || !license) {
      console.log('Missing fields - fullname:', fullname, 'email:', email, 'license:', license);
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Store doctor request in database with files
    console.log('Processing files...');
    
    // Handle profile picture
    let profilePicturePath = null;
    console.log('All req.files keys:', Object.keys(req.files));
    console.log('req.files structure:', req.files);
    
    // Handle profile picture - multer.any() creates an array of all files
    const profilePictureFile = req.files.find((file) => file.fieldname === 'profilePicture');
    if (profilePictureFile) {
      profilePicturePath = profilePictureFile.filename;
      console.log('Profile picture path extracted:', profilePicturePath);
    }
    
    // Handle documents sent as documents[0], documents[1], etc.
    const documentFiles = [];
    const documentKeys = req.files
      .filter((file) => file.fieldname.startsWith('documents['))
      .sort((a, b) => {
        const aIndex = parseInt(a.fieldname.match(/\d+/)[0]);
        const bIndex = parseInt(b.fieldname.match(/\d+/)[0]);
        return aIndex - bIndex;
      });
    
    documentKeys.forEach((file) => {
      documentFiles.push(file.filename);
      console.log(`Document filename extracted: ${file.filename}`);
    });
    
    const documentsPaths = documentFiles.length > 0 ? JSON.stringify(documentFiles) : null;
    console.log('Final documents paths:', documentsPaths);
    
    console.log('Profile picture path:', profilePicturePath);
    console.log('Documents paths:', documentsPaths);
    console.log('Document files found:', documentFiles);
    console.log('All files:', req.files);
    
    const result = await db.run(`
      INSERT INTO doctor_requests (
        fullname, email, phone, gender, country, area, specialty, 
        department, degree, experience, designation, license, 
        profile_picture, documents, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    `, [
      fullname, email, phone, gender, country, area, specialty,
      department, degree, experience, designation, license,
      profilePicturePath, documentsPaths
    ]);
    
    console.log('Doctor request inserted:', result);
    console.log('Inserted data:', {
      fullname, email, phone, gender, country, area, specialty,
      department, degree, experience, designation, license,
      profilePicturePath, documentsPaths
    });
    
    res.status(201).json({ 
      message: 'Doctor request submitted successfully',
      status: 'pending',
      profilePicture: profilePicturePath,
      documents: documentsPaths
    });
    
  } catch (error) {
    console.error('Doctor request error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
