// Test to verify patient authentication and access to doctor notes
const axios = require('axios');

async function testPatientAuth() {
  try {
    console.log('Testing patient authentication and doctor notes access...\n');
    
    // First, try to login as a patient
    const loginResponse = await axios.post('http://localhost:4000/api/login', {
      usernameOrEmail: 'yush', // Using the correct patient username
      password: 'yush123'
    }, {
      withCredentials: true
    });
    
    console.log('Login successful:', loginResponse.data.user);
    
    // Now try to fetch doctor notes
    const notesResponse = await axios.get(`http://localhost:4000/api/patients/${loginResponse.data.user.id}/notes-patient`, {
      withCredentials: true
    });
    
    console.log('\nDoctor notes for patient:');
    console.log(JSON.stringify(notesResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testPatientAuth();
