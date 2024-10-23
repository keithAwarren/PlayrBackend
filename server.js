const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const querystring = require('querystring');
const axios = require('axios');
dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 8080;

// Import routes and database connection
const playlistRoutes = require('./routes/playlistRoutes');
const { connectDB } = require('./db/db');

// Determine the redirect URI based on the environment
const redirectUri = process.env.NODE_ENV === 'production'
  ? 'https://your-production-domain.com/callback'
  : 'http://localhost:8080/callback';

// Middleware
app.use(cors());
app.use(express.json());

// Spotify Login Route - Redirect to Spotify's authorization page
app.get('/login', (req, res) => {
  const scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative';
  const params = querystring.stringify({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scope,
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

// Spotify Callback Route - Exchange authorization code for an access token
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;

  const data = querystring.stringify({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri, 
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
  });

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', data);
    const { access_token, refresh_token } = response.data;

    // Store tokens or use them as needed
    res.json({ access_token, refresh_token });
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.send('Error during authentication');
  }
});

// Route to Fetch Spotify Playlists using access token
app.get('/api/spotify/playlists', async (req, res) => {
  const accessToken = req.headers.authorization.split(' ')[1]; // Get access token from headers

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    res.json(response.data.items); // Send playlists to the client
  } catch (error) {
    console.error('Error fetching playlists from Spotify:', error);
    res.status(500).send('Error fetching playlists');
  }
});

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
