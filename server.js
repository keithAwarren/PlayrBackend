const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 8080;

// Import routes and database connection
const playlistRoutes = require('./routes/playlistRoutes');
const { connectDB } = require('./db/db');

// Middleware
app.use(cors());
app.use(express.json());

// Use the playlist routes
app.use('/api', playlistRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Spotify Backend is running!');
});

// Connect to the database
connectDB();

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});