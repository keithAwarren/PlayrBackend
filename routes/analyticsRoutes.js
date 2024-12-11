const express = require('express');
const axios = require('axios');
const router = express.Router();

// Fetch Recently Played Tracks
router.get('/recently-played', async (req, res) => {
  const accessToken = req.headers.authorization?.split(' ')[1];
  if (!accessToken) {
    return res.status(401).json({ message: 'Access token is required.' });
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit: 20 }, // Fetch up to 20 recently played tracks
    });
    res.json(response.data.items); // Return the recently played tracks
  } catch (error) {
    console.error('Error fetching recently played tracks:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to fetch recently played tracks.' });
  }
});

module.exports = router;