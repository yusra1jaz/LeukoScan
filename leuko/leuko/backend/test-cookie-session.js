// Test cookie/session handling between requests
const axios = require('axios');

async function testCookieSession() {
  try {
    console.log('Testing cookie/session handling...\n');
    
    // Create axios instance with cookie jar
    const axiosInstance = axios.create({
      withCredentials: true,
      baseURL: 'http://localhost:4000'
    });
    
    // First, login
    console.log('1. Logging in...');
    const loginResponse = await axiosInstance.post('/api/login', {
      usernameOrEmail: 'yush',
      password: 'yush123'
    });
    
    console.log('Login successful:', loginResponse.data.user);
    
    // Check if we have cookies
    const setCookieHeader = loginResponse.headers['set-cookie'];
    console.log('Set-Cookie headers:', setCookieHeader);
    
    // Now try to access a protected endpoint
    console.log('\n2. Testing protected endpoint access...');
    try {
      const meResponse = await axiosInstance.get('/api/me');
      console.log('/api/me response:', meResponse.data);
    } catch (error) {
      console.error('/api/me failed:', error.response?.data);
    }
    
    // Now try to fetch doctor notes
    console.log('\n3. Testing doctor notes endpoint...');
    try {
      const notesResponse = await axiosInstance.get(`/api/patients/${loginResponse.data.user.id}/notes-patient`);
      console.log('Doctor notes response:', notesResponse.data);
    } catch (error) {
      console.error('Doctor notes failed:', error.response?.data);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testCookieSession();
