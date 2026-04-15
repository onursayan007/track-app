const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- Mock API Endpoints ---

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;

  if (phone === '5551234567') {
    return res.json({
      role: 'DRIVER',
      name: 'Ahmet Yılmaz',
      token: 'mock-jwt-driver'
    });
  } else if (phone === '5559876543') {
    return res.json({
      role: 'PASSENGER',
      name: 'Ayşe Demir',
      token: 'mock-jwt-passenger'
    });
  }

  return res.status(401).json({ message: 'Unauthorized' });
});

// POST /api/driver/start-session
app.post('/api/driver/start-session', (req, res) => {
  const { vehicleId, routeId } = req.body;
  
  return res.json({
    success: true,
    sessionId: 123,
    message: 'Sefer Başladı'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Mock Server running on port ${PORT}`);
});