require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require("body-parser");
const authRoutes = require('./routes/authRoutes');
const userRoutes = require("./routes/userRoutes");
const shiftmanagementRoutes = require("./routes/shiftmanagementRoutes");
const overtimeRoutes = require('./routes/overtimeRoutes');
const shiftSwapRequestRoutes = require('./routes/shiftSwapRequestRoutes');

dotenv.config();

const app = express();

app.use(express.json()); // Enable JSON body parsing
app.use(express.urlencoded({ extended: true })); // Enable form data parsing

// Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});