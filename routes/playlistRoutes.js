const express = require('express');
const router = express.Router();

let playlists = [];

// Create a playlist (POST /api/playlists)
router.post('/playlists', (req, res) => {
  const { name, description } = req.body;
  const newPlaylist = {
    id: playlists.length + 1,
    name,
    description,
    tracks: []
  };
  playlists.push(newPlaylist);
  res.status(201).json(newPlaylist);
});

// Get all playlists (GET /api/playlists)
router.get('/playlists', (req, res) => {
  res.json(playlists);
});

// Get a single playlist by ID (GET /api/playlists/:id)
router.get('/playlists/:id', (req, res) => {
  const playlist = playlists.find(p => p.id === parseInt(req.params.id));
  if (playlist) {
    res.json(playlist);
  } else {
    res.status(404).json({ message: 'Playlist not found' });
  }
});

// Update a playlist by ID (PUT /api/playlists/:id)
router.put('/playlists/:id', (req, res) => {
  const playlist = playlists.find(p => p.id === parseInt(req.params.id));
  if (playlist) {
    const { name, description } = req.body;
    playlist.name = name || playlist.name;
    playlist.description = description || playlist.description;
    res.json(playlist);
  } else {
    res.status(404).json({ message: 'Playlist not found' });
  }
});

// Delete a playlist by ID (DELETE /api/playlists/:id)
router.delete('/playlists/:id', (req, res) => {
  const playlistIndex = playlists.findIndex(p => p.id === parseInt(req.params.id));
  if (playlistIndex !== -1) {
    playlists.splice(playlistIndex, 1);
    res.status(204).json({ message: 'Playlist deleted' });
  } else {
    res.status(404).json({ message: 'Playlist not found' });
  }
});

module.exports = router;
