const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const simulatorRoutes = require('./routes/simulator');
app.use('/api/simulator', simulatorRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'RISC-V Simulator API' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});