const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 8080;

// Import routes and database connection
const authRoutes = require('./routes/authRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const lyricsRoutes = require('./routes/lyricsRoutes'); 
const { connectDB } = require('./db/db');
const { createTables } = require('./utils/sqlFunctions');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes); // Auth routes for login, callback, etc.
app.use('/api', playlistRoutes); // Playlist routes
app.use('/api', lyricsRoutes); // Lyrics routes

// Basic route
app.get('/', (req, res) => {
  res.send('Spotify Backend is running!');
});

// Connect to the database and create tables
connectDB();
createTables();

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});