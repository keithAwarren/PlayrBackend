const express = require('express');
const querystring = require('querystring');
const axios = require('axios');
const { insertRecord, queryRecord } = require('../utils/sqlFunctions');
const router = express.Router();

// Determine the redirect URI based on the environment
const redirectUri = process.env.NODE_ENV === 'production'
  ? 'https://your-production-domain.com/callback'
  : 'http://localhost:3000/callback';

// Spotify Login Route - Redirect to Spotify's authorization page
router.get('/login', (req, res) => {
  const scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative';
  const params = querystring.stringify({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scope,
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

// Spotify Callback Route - Exchange authorization code for an access token and redirect to front end
router.get('/callback', async (req, res) => {
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

    // Fetch user profile from Spotify API
    const userProfileResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const { id: spotify_id, display_name, email, images } = userProfileResponse.data;

    // Check if user already exists in the database
    const existingUser = await queryRecord('SELECT * FROM users WHERE spotify_id = ?', [spotify_id]);

    // If the user doesn't exist, store the user in the database
    if (existingUser.length === 0) {
      await insertRecord('users', ['spotify_id', 'display_name', 'email', 'profile_image'], [spotify_id, display_name, email, images[0]?.url]);
    }

    // Redirect to the front end with the access token as a query parameter
    res.redirect(`http://localhost:3000?access_token=${access_token}`);
  } catch (error) {
    console.error('Error exchanging code for token or storing user data:', error);
    res.send('Error during authentication');
  }
});

// Route to refresh Spotify access token
router.get('/refresh_token', async (req, res) => {
  const refreshToken = req.query.refresh_token;

  const data = querystring.stringify({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
  });

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', data);
    const newAccessToken = response.data.access_token;

    res.json({ access_token: newAccessToken });
  } catch (error) {
    console.error('Error refreshing access token:', error);
    res.status(500).send('Error refreshing access token');
  }
});

module.exports = router;