const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const playlistRoutes = require('./routes/playlistRoutes');

// Middleware
app.use(cors());
app.use(express.json());

// Use the playlist routes
app.use('/api', playlistRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Spotify Backend is running!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});