require('dotenv').config();
const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require("body-parser");
const authRoutes = require('./routes/authRoutes');
const userRoutes = require("./routes/userRoutes");
const shiftmanagementRoutes = require("./routes/shiftmanagementRoutes");
const overtimeRoutes = require('./routes/overtimeRoutes');
const shiftSwapRequestRoutes = require('./routes/shiftSwapRequestRoutes');
const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, 
  },
});

const allowedOrigins = [
  'http://localhost:5173', // local dev
  'https://frontend-main-73r1aulme-simbas-projects-6dbb6201.vercel.app' // production
];

app.use(express.json()); // Enable JSON body parsing
app.use(express.urlencoded({ extended: true })); // Enable form data parsing

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/users", userRoutes);  
app.use('/api', shiftmanagementRoutes);  
// Overtime routes
app.use('/api/overtime', overtimeRoutes);

// Shift swap request routes
app.use('/api/shift-swap-requests', shiftSwapRequestRoutes);

// Example query route
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});