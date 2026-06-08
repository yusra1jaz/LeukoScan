// Test script to verify doctor notes to patient connection
const sqlite3 = require('sqlite3').verbose();

// Connect to database
const db = new sqlite3.Database('./users.db');

async function testConnection() {
  console.log('Testing doctor notes to patient connection...\n');
  
  try {
    // Check if doctor_notes table exists and has data
    const notes = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM doctor_notes ORDER BY created_at DESC LIMIT 5', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('Recent doctor notes:');
    console.log(notes);
    
    // Check if there are notes for a specific patient
    if (notes.length > 0) {
      const patientId = notes[0].patient_id;
      console.log(`\nTesting patient ${patientId} access to notes:`);
      
      const patientNotes = await new Promise((resolve, reject) => {
        db.all(
          'SELECT n.*, u.username as doctor_name FROM doctor_notes n JOIN users u ON n.doctor_id = u.id WHERE n.patient_id = ? AND (n.hidden = 0 OR n.hidden IS NULL) ORDER BY n.created_at DESC',
          [patientId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
      
      console.log('Patient should see these notes:');
      console.log(patientNotes);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    db.close();
  }
}

testConnection();
