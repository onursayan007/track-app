const express = require('express');
const { sequelize } = require('./models');

const app = express();

app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', db_connected: true });
  } catch (error) {
    console.error('Health check DB connection failed:', error);
    res.status(500).json({ 
      status: 'error', 
      db_connected: false, 
      message: 'Database connection failed' 
    });
  }
});

module.exports = app;