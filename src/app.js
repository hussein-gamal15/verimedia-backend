const express = require('express');
const cors = require('cors');
const analyzeRoutes = require('./routes/analyze.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'VeriMedia API is healthy.' });
});

app.use('/api/v1', analyzeRoutes);

module.exports = app;