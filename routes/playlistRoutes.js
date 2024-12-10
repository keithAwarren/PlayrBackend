const express = require('express');
const axios = require('axios');
const { queryRecord, insertRecord, updateRecord, deleteRecord } = require('../utils/sqlFunctions');
const router = express.Router();

// Create a playlist locally and on Spotify
router.post('/playlists', async (req, res) => {
  const { name, description, userId } = req.body;

  try {
    // First, create the playlist in Spotify
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({ message: 'Access token is required.' });
    }

    const spotifyResponse = await axios.post(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      { name, description, public: false },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const spotifyPlaylist = spotifyResponse.data;

    // Then, store the playlist in your local database
    const dbResult = await insertRecord(
      'playlists',
      ['name', 'description', 'spotify_id'],
      [name, description, spotifyPlaylist.id]
    );

    res.status(201).json({
      id: dbResult.insertId,
      name,
      description,
      spotify_id: spotifyPlaylist.id,
    });
  } catch (error) {
    console.error('Error creating playlist:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error creating playlist' });
  }
});

// Get all playlists (local + Spotify sync)
router.get('/playlists', async (req, res) => {
  try {
    // Fetch playlists from the local database
    const playlists = await queryRecord('SELECT * FROM playlists');

    res.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ message: 'Error fetching playlists' });
  }
});

// Update playlist locally and on Spotify
router.put('/playlists/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    // Fetch the playlist's Spotify ID from the database
    const [playlist] = await queryRecord('SELECT spotify_id FROM playlists WHERE id = ?', [id]);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found in local database.' });
    }

    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({ message: 'Access token is required.' });
    }

    // Update the playlist on Spotify
    await axios.put(
      `https://api.spotify.com/v1/playlists/${playlist.spotify_id}`,
      { name, description },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // Update the playlist in the local database
    await updateRecord('playlists', ['name', 'description'], [name, description], `id = ${id}`);

    res.json({ message: 'Playlist updated successfully' });
  } catch (error) {
    console.error('Error updating playlist:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error updating playlist' });
  }
});

// Delete a playlist locally and on Spotify
router.delete('/playlists/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the playlist's Spotify ID from the database
    const [playlist] = await queryRecord('SELECT spotify_id FROM playlists WHERE id = ?', [id]);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found in local database.' });
    }

    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({ message: 'Access token is required.' });
    }

    // Delete the playlist on Spotify
    await axios.delete(`https://api.spotify.com/v1/playlists/${playlist.spotify_id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Delete the playlist from the local database
    await deleteRecord('playlists', 'id = ?', [id]);

    res.status(204).json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Error deleting playlist:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error deleting playlist' });
  }
});

module.exports = router;