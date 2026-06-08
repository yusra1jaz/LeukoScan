// Check what patients exist in the database
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./users.db');

async function checkPatients() {
  try {
    console.log('Checking patients in database...\n');
    
    // Get all users with role 'user' (patients)
    const patients = await new Promise((resolve, reject) => {
      db.all('SELECT id, username, fullName, email, role FROM users WHERE role = "user" ORDER BY id DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('Patients found:');
    console.log(patients);
    
    // Check if any of these patients have doctor notes
    for (const patient of patients) {
      const notes = await new Promise((resolve, reject) => {
        db.all(
          'SELECT n.*, u.username as doctor_name FROM doctor_notes n JOIN users u ON n.doctor_id = u.id WHERE n.patient_id = ? AND (n.hidden = 0 OR n.hidden IS NULL) ORDER BY n.created_at DESC',
          [patient.id],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
      
      if (notes.length > 0) {
        console.log(`\nPatient ${patient.username} (ID: ${patient.id}) has ${notes.length} doctor notes:`);
        console.log(notes);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    db.close();
  }
}

checkPatients();
