const express = require('express');
const bcrypt = require('bcryptjs');
const { authMiddleware, adminOnly, adminOrDoctorOnly } = require('../middleware/auth');
const router = express.Router();
const db = require('../models/database');

// Function to generate unique MR number
const generateMRNumber = async () => {
  let mrNumber;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100;

  while (!isUnique && attempts < maxAttempts) {
    // Generate MR number: 1 alphabet + 5 numbers
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const alphabetChar = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    const numbers = Math.floor(10000 + Math.random() * 90000); // 5-digit number
    mrNumber = `${alphabetChar}${numbers}`;

    // Check if MR number already exists
    const existing = await db.get('SELECT mr_number FROM users WHERE mr_number = ?', [mrNumber]);
    
    if (!existing) {
      isUnique = true;
    }
    
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique MR number after multiple attempts');
  }

  return mrNumber;
};

// Get user info for manage account
router.get('/info', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const userId = req.user.id;
    
    // Get all personal info from users table
    let user = await db.get(
      'SELECT id, username, fullName, email, phone, dob, gender, country, address, photo, role, created_at, password, mr_number FROM users WHERE id = ?', 
      [userId]
    );

    // Generate MR number if user doesn't have one
    if (!user.mr_number) {
      const mrNumber = await generateMRNumber();
      await db.run('UPDATE users SET mr_number = ? WHERE id = ?', [mrNumber, userId]);
      user.mr_number = mrNumber;
    }
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Get disease info for patients
    const diseaseInfo = await db.get(
      'SELECT leukemia_type as leukemiaType, stage, medications, hospital FROM patient_disease_info WHERE user_id = ?', 
      [userId]
    );
    
    // Construct photo URL if photo exists
    const userData = {
      ...user,
      fullName: user.fullName || '', // Add fullName field
      country: user.country || '', // Add country field
      mrNumber: user.mr_number, // Add MR number
      ...(diseaseInfo || {})
    };
    
    if (userData.photo) {
      userData.photo = `/uploads/${userData.photo}`;
    }
    
    res.json({
      user: userData,
      message: 'User info retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current password for admin users
router.get('/current-password', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const userId = req.user.id;
    
    // Only allow admins to get their current password (return plain text for admin purposes)
    const user = await db.get(
      'SELECT plain_password FROM users WHERE id = ? AND role = ?', 
      [userId, 'admin']
    );
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Return plain text password for admin users (for display purposes only)
    // Check if plain_password exists, if not return empty string
    const plainPassword = user.plain_password || '';
    res.json({ password: plainPassword });
  } catch (error) {
    console.error('Error fetching password:', error);
    res.status(500).json({ message: 'Failed to fetch password' });
  }
});

// Update user info (handles both JSON and multipart/form-data)
router.put('/info', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const { upload } = require('../config');
    const userId = req.user.id;
    
    // Handle file upload middleware
    upload.single('photo')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: 'File upload error: ' + err.message });
      }
      
      const { username, email, phone, dob, gender, country, address, fullName, name, leukemiaType, stage, medications, hospital } = req.body;
      
      let photoPath = null;
      if (req.file) {
        photoPath = req.file.filename;
      }
      
      // Update personal info including photo if uploaded
      const updateQuery = photoPath 
        ? 'UPDATE users SET username = ?, fullName = ?, email = ?, phone = ?, dob = ?, gender = ?, country = ?, address = ?, photo = ? WHERE id = ?'
        : 'UPDATE users SET username = ?, fullName = ?, email = ?, phone = ?, dob = ?, gender = ?, country = ?, address = ? WHERE id = ?';
      
      const updateParams = photoPath
        ? [username || name, fullName || name, email, phone, dob, gender, country, address, photoPath, userId]
        : [username || name, fullName || name, email, phone, dob, gender, country, address, userId];
      
      await db.run(updateQuery, updateParams);
      
      // Update disease info if provided (for patients)
      if (leukemiaType || stage || medications || hospital) {
        await db.run(`INSERT OR REPLACE INTO patient_disease_info 
                (user_id, leukemia_type, stage, medications, hospital) 
                VALUES (?, ?, ?, ?, ?)`,
          [userId, leukemiaType, stage, medications, hospital]
        );
      }
      
      // Get updated user data
      const updatedUser = await db.get(
        'SELECT id, username, email, phone, dob, gender, address, photo FROM users WHERE id = ?', 
        [userId]
      );
      
      const userData = { ...updatedUser };
      if (userData.photo) {
        userData.photo = `/uploads/${userData.photo}`;
      }
      
      res.json({
        user: userData,
        message: 'Account updated successfully'
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user account
router.delete('/delete', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const userId = req.user.id;
    
    // Delete related records first
    await db.run('DELETE FROM patient_disease_info WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM symptom_entries WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM users WHERE id = ?', [userId]);
    
    res.clearCookie('token');
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user preferences
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const userId = req.user.id;
    
    const prefs = await db.get('SELECT theme, notifications FROM user_preferences WHERE user_id = ?', [userId]);
    
    res.json({
      preferences: prefs || { theme: 'light', notifications: true }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const userId = req.user.id;
    const { theme, notifications } = req.body;
    
    await db.run(`INSERT OR REPLACE INTO user_preferences 
            (user_id, theme, notifications) 
            VALUES (?, ?, ?)`,
      [userId, theme || 'light', notifications !== undefined ? notifications : true]
    );
    
    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const db = require('../models/database');
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Check each field individually for better error messages
    if (!currentPassword || currentPassword.trim() === '') {
      return res.status(400).json({ message: 'Current password is required' });
    }
    if (!newPassword || newPassword.trim() === '') {
      return res.status(400).json({ message: 'New password is required' });
    }
    if (!confirmPassword || confirmPassword.trim() === '') {
      return res.status(400).json({ message: 'Confirm password is required' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password must match' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    // Get current user password
    const user = await db.get('SELECT password FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
