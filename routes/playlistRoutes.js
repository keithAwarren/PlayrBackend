const express = require('express');
const router = express.Router();
const { query } = require('../db/db');

// Create a playlist (POST /api/playlists)
router.post('/playlists', async (req, res) => {
  const { name, description } = req.body;
  try {
    const result = await query(
      'INSERT INTO playlists (name, description, tracks) VALUES (?, ?, ?)',
      [name, description, JSON.stringify([])]
    );
    res.status(201).json({ id: result.insertId, name, description, tracks: [] });
  } catch (error) {
    res.status(500).json({ message: 'Error creating playlist', error });
  }
});

// Get all playlists (GET /api/playlists)
router.get('/playlists', async (req, res) => {
  try {
    const playlists = await query('SELECT * FROM playlists');
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching playlists', error });
  }
});

// Get a single playlist by ID (GET /api/playlists/:id)
router.get('/playlists/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [playlist] = await query('SELECT * FROM playlists WHERE id = ?', [id]);
    if (playlist) {
      res.json(playlist);
    } else {
      res.status(404).json({ message: 'Playlist not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching playlist', error });
  }
});

// Update a playlist by ID (PUT /api/playlists/:id)
router.put('/playlists/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    await query(
      'UPDATE playlists SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );
    res.json({ message: 'Playlist updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating playlist', error });
  }
});

// Delete a playlist by ID (DELETE /api/playlists/:id)
router.delete('/playlists/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM playlists WHERE id = ?', [id]);
    res.status(204).json({ message: 'Playlist deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting playlist', error });
  }
});

module.exports = router;
