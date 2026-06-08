// Check patient passwords (for testing purposes only)
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./users.db');

async function checkPasswords() {
  try {
    console.log('Checking patient login credentials...\n');
    
    // Get patients with their plain passwords (if available)
    const patients = await new Promise((resolve, reject) => {
      db.all('SELECT id, username, fullName, email, password, plain_password FROM users WHERE role = "user" ORDER BY id DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('Patients and their credentials:');
    patients.forEach(patient => {
      console.log(`Username: ${patient.username}, Plain Password: ${patient.plain_password || 'Not available'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    db.close();
  }
}

checkPasswords();
