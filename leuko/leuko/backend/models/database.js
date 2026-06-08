const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { DB_PATH } = require('../config');

class Database {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
    this.initializeTables();
  }

  initializeTables() {
    this.db.serialize(() => {
      // Users table
      this.db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT,
        plain_password TEXT,
        role TEXT DEFAULT 'user',
        phone TEXT,
        dob TEXT,
        gender TEXT,
        address TEXT,
        photo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Add plain_password column to existing table if it doesn't exist
      this.db.run(`ALTER TABLE users ADD COLUMN plain_password TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding plain_password column:', err);
        } else if (!err) {
          console.log('plain_password column added successfully');
        }
      });

      // Add mr_number column to existing table if it doesn't exist
      this.db.run(`ALTER TABLE users ADD COLUMN mr_number TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding mr_number column:', err);
        } else if (!err) {
          console.log('mr_number column added successfully');
        }
      });

      // Add fullName column to existing table if it doesn't exist
      this.db.run(`ALTER TABLE users ADD COLUMN fullName TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding fullName column:', err);
        } else if (!err) {
          console.log('fullName column added successfully');
        }
      });

      // Add country column to existing table if it doesn't exist
      this.db.run(`ALTER TABLE users ADD COLUMN country TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding country column:', err);
        } else if (!err) {
          console.log('country column added successfully');
        }
      });

      // Preferences table
      this.db.run(`CREATE TABLE IF NOT EXISTS user_preferences (
        user_id INTEGER UNIQUE,
        theme TEXT DEFAULT 'light',
        notifications INTEGER DEFAULT 1,
        professionalWebsite INTEGER DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      // Doctors table
      this.db.run(`CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        specialty TEXT,
        department TEXT,
        degree TEXT,
        designation TEXT,
        experience INTEGER DEFAULT 0,
        license TEXT,
        username TEXT UNIQUE,
        password TEXT,
        plain_password TEXT,
        photo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Add license column to existing doctors table if it doesn't exist
      this.db.run(`ALTER TABLE doctors ADD COLUMN license TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding license column:', err);
        } else if (!err) {
          console.log('license column added successfully');
        }
      });

      // Patient-Doctor relation
      this.db.run(`CREATE TABLE IF NOT EXISTS patient_doctor (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        doctor_id INTEGER,
        FOREIGN KEY(patient_id) REFERENCES users(id),
        FOREIGN KEY(doctor_id) REFERENCES doctors(id)
      )`);

      // Appointments table
      this.db.run(`CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        doctor_id INTEGER,
        date TEXT,
        time TEXT,
        notes TEXT,
        FOREIGN KEY(patient_id) REFERENCES users(id),
        FOREIGN KEY(doctor_id) REFERENCES doctors(id)
      )`);

      // Patient disease info
      this.db.run(`CREATE TABLE IF NOT EXISTS patient_disease_info (
        user_id INTEGER PRIMARY KEY,
        leukemia_type TEXT,
        stage TEXT,
        medications TEXT,
        hospital TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      // Password reset tokens
      this.db.run(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        used_at DATETIME,
        FOREIGN KEY(email) REFERENCES users(email)
      )`);

      // Chat tables
      this.db.run(`CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT DEFAULT 'New Chat',
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      this.db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER,
        sender TEXT,
        text TEXT,
        timestamp TEXT,
        FOREIGN KEY(chat_id) REFERENCES chats(id)
      )`);

      // Symptom entries
      this.db.run(`CREATE TABLE IF NOT EXISTS symptom_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        symptoms TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      // Medical reports
      this.db.run(`CREATE TABLE IF NOT EXISTS medical_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        patient_name TEXT NOT NULL,
        report_type TEXT NOT NULL,
        chief_complaint TEXT,
        history_present_illness TEXT,
        physical_examination TEXT,
        assessment TEXT,
        plan TEXT,
        medications TEXT,
        follow_up TEXT,
        additional_notes TEXT,
        doctor_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        hidden INTEGER DEFAULT 0,
        FOREIGN KEY (patient_id) REFERENCES users (id)
      )`);

      // Add hidden column to existing medical_reports table if it doesn't exist
      this.db.run(`ALTER TABLE medical_reports ADD COLUMN hidden INTEGER DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding hidden column to medical_reports:', err);
        } else if (!err) {
          console.log('hidden column added successfully to medical_reports');
        }
      });

      // Doctor notes
      this.db.run(`CREATE TABLE IF NOT EXISTS doctor_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        note TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        hidden INTEGER DEFAULT 0,
        FOREIGN KEY (patient_id) REFERENCES users (id),
        FOREIGN KEY (doctor_id) REFERENCES users (id)
      )`);

      // Add hidden column to existing doctor_notes table if it doesn't exist
      this.db.run(`ALTER TABLE doctor_notes ADD COLUMN hidden INTEGER DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding hidden column:', err);
        } else if (!err) {
          console.log('hidden column added successfully');
        }
      });

      // AI Diagnosis Results
      this.db.run(`CREATE TABLE IF NOT EXISTS diagnosis_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        prediction TEXT NOT NULL,
        confidence REAL NOT NULL,
        ensemble_details TEXT,
        heatmap_data TEXT,
        image_filename TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      // Doctor requests table (for admin approval)
      this.db.run(`CREATE TABLE IF NOT EXISTS doctor_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        gender TEXT,
        country TEXT,
        area TEXT,
        specialty TEXT,
        department TEXT,
        degree TEXT,
        experience TEXT,
        designation TEXT,
        license TEXT NOT NULL,
        profile_picture TEXT,
        documents TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Error creating doctor_requests table:', err);
        } else {
          console.log('doctor_requests table created successfully');
        }
      });

      // Consultation requests table
      this.db.run(`CREATE TABLE IF NOT EXISTS consultation_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_id INTEGER NOT NULL,
        patient_id INTEGER NOT NULL,
        preferred_date TEXT NOT NULL,
        preferred_time TEXT NOT NULL,
        consultation_type TEXT NOT NULL,
        symptoms TEXT NOT NULL,
        urgency TEXT DEFAULT 'medium',
        notes TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(doctor_id) REFERENCES doctors(id),
        FOREIGN KEY(patient_id) REFERENCES users(id)
      )`, (err) => {
        if (err) {
          console.error('Error creating consultation_requests table:', err);
        } else {
          console.log('consultation_requests table created successfully');
        }
      });

      // Consultation documents table
      this.db.run(`CREATE TABLE IF NOT EXISTS consultation_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consultation_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(consultation_id) REFERENCES consultation_requests(id)
      )`, (err) => {
        if (err) {
          console.error('Error creating consultation_documents table:', err);
        } else {
          console.log('consultation_documents table created successfully');
        }
      });

      // Migration: Add user_id to existing chats table if needed
      this.migrateChatsTable();
    });
  }

  migrateChatsTable() {
    // Check if user_id column exists in chats table
    this.db.all("PRAGMA table_info(chats)", (err, columns) => {
      if (err) {
        console.error('Error checking chats table structure:', err);
        return;
      }
      
      const hasUserIdColumn = columns.some(col => col.name === 'user_id');
      
      if (!hasUserIdColumn) {
        console.log('Migrating chats table - adding user_id column...');
        
        // Add user_id column
        this.db.run(`ALTER TABLE chats ADD COLUMN user_id INTEGER`, (err) => {
          if (err) {
            console.error('Error adding user_id column:', err);
            return;
          }
          
          console.log('user_id column added successfully');
          
          // Update existing chats to belong to admin user (id: 1)
          this.db.run(`UPDATE chats SET user_id = 1 WHERE user_id IS NULL`, function(err) {
            if (err) {
              console.error('Error updating existing chats:', err);
              return;
            }
            
            console.log(`Updated ${this.changes} existing chats to belong to admin user`);
            console.log('Chats table migration completed!');
          });
        });
      }
    });
  }

  
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  
  close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) console.error('Error closing database:', err);
        resolve();
      });
    });
  }
}

module.exports = new Database();
