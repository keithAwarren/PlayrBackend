const express = require('express');
const axios = require('axios');
const router = express.Router();

// Spotify Search Endpoint
router.get('/search', async (req, res) => {
  const { q: query, type = 'track,artist,album', limit = 10 } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Search query is required.' });
  }

  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({ message: 'Access token is required.' });
    }

    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { q: query, type, limit },
    });

    res.json(response.data); // Forward Spotify's search results to the client
  } catch (error) {
    console.error('Error fetching search results:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching search results.' });
  }
});

module.exports = router; 