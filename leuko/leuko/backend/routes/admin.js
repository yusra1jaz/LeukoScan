const express = require('express');
const bcrypt = require('bcryptjs');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Get doctor by ID (for edit)
router.get('/doctors/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const doctorId = parseInt(req.params.id);
    
    if (!doctorId || isNaN(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }

    const doctor = await db.get('SELECT * FROM doctors WHERE id = ?', [doctorId]);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get doctor requests (for admin approval)
router.get('/doctor-requests', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const requests = await db.all('SELECT * FROM doctor_requests ORDER BY created_at DESC');
    console.log('Doctor requests from database:', requests);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching doctor requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Approve doctor request
router.put('/doctor-requests/:id/approve', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const requestId = parseInt(req.params.id);
    
    if (!requestId || isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }
    
    // Get the request details
    const request = await db.get('SELECT * FROM doctor_requests WHERE id = ?', [requestId]);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Create doctor account
    const { fullname, email, phone, gender, country, area, specialty, department, degree, experience, designation, license } = request;
    
    // Generate a temporary password (in real app, you'd send email)
    const bcrypt = require('bcryptjs');
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Insert into doctors table
    const doctorResult = await db.run(`
      INSERT INTO doctors (name, email, phone, gender, country, area, specialty, 
      department, degree, experience, designation, password, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [fullname, email, phone, gender, country, area, specialty, department, degree, experience, designation, hashedPassword]);
    
    // Update request status
    await db.run('UPDATE doctor_requests SET status = "approved" WHERE id = ?', [requestId]);
    
    res.json({ 
      message: 'Doctor request approved successfully',
      doctorId: doctorResult.id,
      tempPassword: tempPassword // In real app, you'd send this via email
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject doctor request
router.put('/doctor-requests/:id/reject', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const requestId = parseInt(req.params.id);
    
    if (!requestId || isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }
    
    // Get request details for email
    const request = await db.get('SELECT * FROM doctor_requests WHERE id = ?', [requestId]);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Update request status
    await db.run('UPDATE doctor_requests SET status = "rejected" WHERE id = ?', [requestId]);
    
    // Send rejection email
    try {
      await sendRejectionEmail(request);
      console.log('Rejection email sent to:', request.email);
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Don't fail the rejection if email fails, but log it
    }
    
    res.json({ message: 'Doctor request rejected successfully' });
    
  } catch (error) {
    console.error('Error rejecting doctor request:', error);
    res.status(500).json({ message: error.message });
  }
});

// Send rejection email function
async function sendRejectionEmail(request) {
  const nodemailer = require('nodemailer');
  
  // Create email transporter
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
  
  // Email content
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@gmail.com',
    to: request.email,
    subject: 'Your Doctor Registration Request - Status Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; border: 1px solid #dee2e6;">
          <h2 style="color: #dc3545; margin-bottom: 20px;">Doctor Registration Request Status</h2>
          
          <p>Dear <strong>${request.fullname}</strong>,</p>
          
          <p>We regret to inform you that your doctor registration request has been carefully reviewed and unfortunately, we are unable to approve your application at this time.</p>
          
          <div style="background-color: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #495057; margin-top: 0;">Request Details:</h3>
            <ul style="color: #6c757d;">
              <li><strong>Full Name:</strong> ${request.fullname}</li>
              <li><strong>Email:</strong> ${request.email}</li>
              <li><strong>Specialty:</strong> ${request.specialty}</li>
              <li><strong>Department:</strong> ${request.department}</li>
              <li><strong>License:</strong> ${request.license}</li>
              <li><strong>Submitted:</strong> ${new Date(request.created_at).toLocaleDateString()}</li>
            </ul>
          </div>
          
          <p style="color: #6c757d;">This decision was made after careful consideration of all submitted information and requirements.</p>
          
          <p style="color: #6c757d;">If you believe this decision was made in error or would like to submit additional information, please contact our administration team.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 14px;">
              Best regards,<br>
              Medical Center Administration Team<br>
              <small>This is an automated message. Please do not reply to this email.</small>
            </p>
          </div>
        </div>
      </div>
    `
  };
  
  // Send email
  await transporter.sendMail(mailOptions);
}

// Delete doctor request
router.delete('/doctor-requests/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    console.log('Delete request received for ID:', req.params.id);
    const db = require('../models/database');
    const requestId = parseInt(req.params.id);
    
    console.log('Parsed request ID:', requestId);
    
    if (!requestId || isNaN(requestId)) {
      console.log('Invalid request ID:', requestId);
      return res.status(400).json({ message: 'Invalid request ID' });
    }
    
    // Get request details to check for files to delete
    const request = await db.get('SELECT * FROM doctor_requests WHERE id = ?', [requestId]);
    console.log('Request found:', request);
    if (!request) {
      console.log('Request not found for ID:', requestId);
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Delete associated files if they exist
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../uploads');
    
    // Delete profile picture if exists
    if (request.profile_picture) {
      const profilePicPath = path.join(uploadsDir, request.profile_picture);
      if (fs.existsSync(profilePicPath)) {
        fs.unlinkSync(profilePicPath);
      }
    }
    
    // Delete documents if they exist
    if (request.documents) {
      try {
        const documents = JSON.parse(request.documents);
        documents.forEach((doc) => {
          const docPath = path.join(uploadsDir, doc);
          if (fs.existsSync(docPath)) {
            fs.unlinkSync(docPath);
          }
        });
      } catch (error) {
        console.error('Error parsing documents for deletion:', error);
      }
    }
    
    // Delete the request from database
    console.log('Deleting request from database...');
    await db.run('DELETE FROM doctor_requests WHERE id = ?', [requestId]);
    console.log('Request deleted from database');
    
    res.json({ message: 'Doctor request deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting doctor request:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add new doctor (with file upload)
router.post('/doctors', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const { upload } = require('../config');
    
    // Handle file upload middleware
    upload.single('photo')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: 'File upload error: ' + err.message });
      }
      
      const { name, email, username, password, specialty, phone, dob, gender, address, department, degree, designation, experience, license } = req.body;
      
      if (!name || !email || !username || !password || !specialty) {
        return res.status(400).json({ message: 'Required fields missing' });
      }

      // Check if username or email already exists
      const existingUser = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
      if (existingUser) {
        return res.status(400).json({ message: 'Username or Email already exists in users' });
      }

      const existingDoctor = await db.get('SELECT * FROM doctors WHERE username = ? OR email = ?', [username, email]);
      if (existingDoctor) {
        return res.status(400).json({ message: 'Username or Email already exists in doctors' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const photo = req.file ? `/uploads/${req.file.filename}` : "";
      const expNum = experience ? Number(experience) : 0;

      // Insert into both tables in a transaction
      await db.run('BEGIN TRANSACTION');
      
      try {
        // Get next doctor ID
        const lastDoctor = await db.get('SELECT id FROM users WHERE role = "doctor" ORDER BY id DESC LIMIT 1');
        const newDoctorId = lastDoctor ? lastDoctor.id + 1 : 1000;
        
        // Insert into users table first (to get the ID)
        await db.run(
          'INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
          [newDoctorId, username, email, hashedPassword, "doctor"]
        );
        
        // Insert into doctors table
        const doctorResult = await db.run(
          `INSERT INTO doctors
            (name,email,phone,dob,gender,address,specialty,department,degree,designation,experience,license,username,password,plain_password,photo)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [name, email, phone, dob, gender, address, specialty, department, degree, designation, expNum, license || '', username, hashedPassword, password, photo]
        );
        
        await db.run('COMMIT');
        
        // Get the inserted doctor with user ID
        const newDoctor = await db.get('SELECT * FROM doctors WHERE id = ?', [doctorResult.id]);
        // Add the user ID to the response
        newDoctor.user_id = newDoctorId;
        
        res.status(201).json(newDoctor);
        
      } catch (error) {
        await db.run('ROLLBACK');
        throw error;
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Edit doctor
router.put('/doctors/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const { upload } = require('../config');
    const doctorId = parseInt(req.params.id);
    
    if (!doctorId || isNaN(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }
    
    // Handle file upload middleware
    upload.single('photo')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: 'File upload error: ' + err.message });
      }
      
      const { name, email, username, password, specialty, phone, dob, gender, address, department, degree, designation, experience, license } = req.body;

      const doctor = await db.get('SELECT * FROM doctors WHERE id = ?', [doctorId]);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      const hashedPassword = password ? await bcrypt.hash(password, 10) : doctor.password;
      const plainPassword = password || doctor.plain_password;
      const photo = req.file ? `/uploads/${req.file.filename}` : doctor.photo;
      const expNum = experience ? Number(experience) : doctor.experience;

      // Update both tables in a transaction
      await db.run('BEGIN TRANSACTION');
      
      try {
        // Update doctors table
        await db.run(
          `UPDATE doctors SET name=?, email=?, phone=?, dob=?, gender=?, address=?, specialty=?, department=?, degree=?, designation=?, experience=?, license=?, username=?, password=?, plain_password=?, photo=? WHERE id=?`,
          [name, email, phone, dob, gender, address, specialty, department, degree, designation, expNum, license || doctor.license, username, hashedPassword, plainPassword, photo, doctorId]
        );
        
        // Update users table if username or password changed
        if (username !== doctor.username || password) {
          await db.run(
            'UPDATE users SET username=?, email=?, password=? WHERE username = ?',
            [username, email, hashedPassword, doctor.username]
          );
        }
        
        await db.run('COMMIT');
        
        // Get updated doctor info
        const updatedDoctor = await db.get('SELECT * FROM doctors WHERE id = ?', [doctorId]);
        res.json(updatedDoctor);
        
      } catch (error) {
        await db.run('ROLLBACK');
        throw error;
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete doctor
router.delete('/doctors/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const doctorId = parseInt(req.params.id);
    
    if (!doctorId || isNaN(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }

    // Get doctor info first
    const doctor = await db.get('SELECT * FROM doctors WHERE id = ?', [doctorId]);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Delete from both tables in a transaction
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Delete from doctors table
      await db.run('DELETE FROM doctors WHERE id = ?', [doctorId]);
      
      // Delete from users table using username
      await db.run('DELETE FROM users WHERE username = ?', [doctor.username]);
      
      await db.run('COMMIT');
      
      res.json({ message: 'Doctor deleted successfully' });
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset doctor password
router.put('/doctors/:id/reset-password', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const doctorId = parseInt(req.params.id);
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    const doctor = await db.get('SELECT * FROM doctors WHERE id = ?', [doctorId]);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update both tables
    await db.run('BEGIN TRANSACTION');
    
    try {
      await db.run('UPDATE doctors SET password=?, plain_password=? WHERE id=?', [hashedPassword, newPassword, doctorId]);
      await db.run('UPDATE users SET password=? WHERE username=?', [hashedPassword, doctor.username]);
      await db.run('COMMIT');
      
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get patients for specific doctor
router.get('/doctors/:id/patients', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const doctorId = parseInt(req.params.id);
    
    const patients = await db.all(
      `SELECT u.id, u.username, u.email, u.created_at 
       FROM users u
       WHERE u.role = 'user' 
       ORDER BY u.created_at DESC`
    );
    
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users (for admin)
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
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

// Get dashboard counts
router.get('/dashboard-counts', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    
    const counts = {};
    
    const totalUsers = await db.get('SELECT COUNT(*) as total FROM users');
    counts.users = totalUsers?.total || 0;
    
    const totalDoctors = await db.get('SELECT COUNT(*) as total FROM doctors');
    counts.doctors = totalDoctors?.total || 0;
    
    const totalPatients = await db.get('SELECT COUNT(*) as total FROM users WHERE role = "user"');
    counts.patients = totalPatients?.total || 0;
    
    const totalAdmins = await db.get('SELECT COUNT(*) as total FROM users WHERE role = "admin"');
    counts.admins = totalAdmins?.total || 0;
    
    res.json(counts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all doctors (for Manage Doctors page)
router.get('/doctors', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    
    // Get doctors from doctors table (this is the authoritative source)
    const doctorsFromTable = await db.all(
      'SELECT * FROM doctors ORDER BY created_at DESC'
    );
    
    // Get user info for each doctor
    const doctors = [];
    for (const doctor of doctorsFromTable) {
      const userInfo = await db.get('SELECT id, fullName, email, phone, dob, gender, address, photo, created_at FROM users WHERE username = ?', [doctor.username]);
      
      if (userInfo) {
        doctors.push({
          // Use doctor ID from doctors table for consistency
          id: doctor.id,
          username: doctor.username,
          name: doctor.name || userInfo.fullName,
          email: userInfo.email,
          phone: userInfo.phone || doctor.phone,
          dob: userInfo.dob || doctor.dob,
          gender: userInfo.gender || doctor.gender,
          address: userInfo.address || doctor.address,
          photo: userInfo.photo || doctor.photo,
          created_at: doctor.created_at,
          specialty: doctor.specialty || 'General',
          department: doctor.department || '',
          degree: doctor.degree || '',
          experience: doctor.experience || 0,
          designation: doctor.designation || '',
          // Include user ID for reference if needed
          user_id: userInfo.id
        });
      }
    }
    
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all patients (for Manage Patients page)
router.get('/patients-list', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    
    const patients = await db.all(
      'SELECT id, username, fullName, email, phone, dob, gender, address, created_at FROM users WHERE role = "user" ORDER BY created_at DESC'
    );
    
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user (doctor or patient)
router.delete('/delete-user/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    console.log('Delete user request - User ID from params:', req.params.id);
    console.log('Delete user request - Authenticated user:', req.user);
    
    const db = require('../models/database');
    const userId = parseInt(req.params.id);
    
    if (!userId || isNaN(userId)) {
      console.log('Invalid user ID:', userId);
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      console.log('User trying to delete themselves:', userId);
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    console.log('Attempting to delete user ID:', userId);

    // Delete related records first
    await db.run('DELETE FROM patient_disease_info WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM symptom_entries WHERE user_id = ?', [userId]);
    
    // Delete from doctors table if exists (doctors table doesn't have user_id, only username)
    await db.run('DELETE FROM doctors WHERE username = (SELECT username FROM users WHERE id = ?)', [userId]);
    
    // Delete user
    const result = await db.run('DELETE FROM users WHERE id = ?', [userId]);
    
    console.log('Delete result - changes:', result.changes);
    
    if (result.changes === 0) {
      console.log('User not found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User deleted successfully:', userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all users by role (for admin dashboard)
router.get('/users-by-role', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    
    const users = await db.all(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    
    // Group by role
    const usersByRole = {
      admins: users.filter(u => u.role === 'admin'),
      doctors: users.filter(u => u.role === 'doctor'), 
      patients: users.filter(u => u.role === 'user')
    };
    
    res.json(usersByRole);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all admins
router.get('/admins', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    
    const admins = await db.all(
      'SELECT id, username, fullName, email, phone, created_at FROM users WHERE role = "admin" ORDER BY created_at DESC'
    );
    
    res.json({ admins });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new admin
router.post('/add', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const { username, fullName, email, password, phone } = req.body;

    if (!username || !fullName || !email || !password) {
      return res.status(400).json({ message: 'Username, full name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if username or email already exists
    const existingUser = await db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get next admin ID (1-999 range)
    const lastAdmin = await db.get('SELECT id FROM users WHERE role = "admin" ORDER BY id DESC LIMIT 1');
    let newAdminId;
    
    if (lastAdmin) {
      // Find next available ID in admin range (1-999)
      newAdminId = lastAdmin.id + 1;
      if (newAdminId > 999) {
        // If we've exceeded 999, find the first available slot in 1-999 range
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
        newAdminId = nextId;
      }
    } else {
      newAdminId = 1; // First admin starts at ID 1
    }

    // Insert new admin with both hashed and plain password and specific ID
    await db.run('INSERT INTO users (id, username, fullName, email, password, plain_password, role, phone) VALUES (?, ?, ?, ?, ?, ?, "admin", ?)',
      [newAdminId, username, fullName, email, hashedPassword, password, phone]
    );

    res.json({ message: 'Admin added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add admin' });
  }
});

// Delete admin
router.delete('/delete/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const adminId = parseInt(req.params.id);
    const currentUserId = req.user.id;

    if (!adminId || isNaN(adminId)) {
      return res.status(400).json({ message: 'Invalid admin ID' });
    }

    // Prevent admin from deleting themselves
    if (adminId === currentUserId) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    // Check if admin exists and get their info
    const admin = await db.get('SELECT username, role FROM users WHERE id = ?', [adminId]);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    if (admin.role !== 'admin') {
      return res.status(400).json({ message: 'User is not an admin' });
    }

    // Delete related records first
    await db.run('DELETE FROM patient_disease_info WHERE user_id = ?', [adminId]);
    await db.run('DELETE FROM symptom_entries WHERE user_id = ?', [adminId]);
    await db.run('DELETE FROM users WHERE id = ?', [adminId]);

    res.json({ message: `Admin "${admin.username}" deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all patients list
router.get('/patients', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    
    const patients = await db.all(
      'SELECT id, username, email, created_at FROM users WHERE role = "user" ORDER BY created_at DESC'
    );
    
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get patient details for assessment
router.get('/patients/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = require('../models/database');
    const patientId = parseInt(req.params.id);
    
    if (!patientId || isNaN(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    const patient = await db.get(
      'SELECT id, username, email, phone, dob, gender, address, created_at FROM users WHERE id = ? AND role = "user"', 
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
router.get('/patients/:id/disease', authMiddleware, adminOnly, async (req, res) => {
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
router.get('/patients/:id/notes', authMiddleware, adminOnly, async (req, res) => {
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
router.post('/patients/:id/notes', authMiddleware, adminOnly, async (req, res) => {
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

module.exports = router;
