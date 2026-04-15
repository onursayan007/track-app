const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3000/api/v1/auth/login', {
      identifier: 'admin@servisimgeliyor.com',
      password: 'password123'
    });
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testLogin();
