const express = require('express');
const querystring = require('querystring');
const axios = require('axios');
const { insertRecord, queryRecord } = require('../utils/sqlFunctions');
const router = express.Router();

const redirectUri = process.env.NODE_ENV === 'production'
  ? 'https://your-production-domain.com/callback'
  : 'http://localhost:3000/MusicPlayr/callback';

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

    const userProfileResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const { id: spotify_id, display_name, email, images } = userProfileResponse.data;

    const [existingUser] = await queryRecord('SELECT * FROM users WHERE spotify_id = ?', [spotify_id]);

    let userId;
    if (existingUser) {
      userId = existingUser.id;
    } else {
      const result = await insertRecord('users', ['spotify_id', 'display_name', 'email', 'profile_image'], [spotify_id, display_name, email, images[0]?.url]);
      userId = result.insertId;
    }

    // Include userId and access_token in the redirect URL to store on the frontend
    res.redirect(`http://localhost:3000?access_token=${access_token}&user_id=${userId}`);
  } catch (error) {
    console.error('Error exchanging code for token or storing user data:', error);
    res.send('Error during authentication');
  }
});

module.exports = router;