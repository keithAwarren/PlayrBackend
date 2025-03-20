const express = require("express");
const axios = require("axios");
const { requiresAuth } = require("../middleware/authMiddleware");
const { queryRecord } = require("../utils/sqlFunctions"); // Function to query DB
const router = express.Router();

// Fetch Recently Played Tracks
router.get("/recently-played", requiresAuth, async (req, res) => {
  try {
    // Get user ID from JWT
    const userId = req.user.userId;

    // Retrieve Spotify access token from database
    const [user] = await queryRecord("SELECT spotify_access_token FROM users WHERE id = ?", [userId]);
    if (!user || !user.spotify_access_token) {
      return res.status(401).json({ message: "Spotify access token missing." });
    }

    // Call Spotify API using the stored access token
    const response = await axios.get(
      "https://api.spotify.com/v1/me/player/recently-played",
      {
        headers: { Authorization: `Bearer ${user.spotify_access_token}` },
        params: { limit: 20 },
      }
    );

    res.json(response.data.items);
  } catch (error) {
    console.error("Error fetching recently played tracks:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to fetch recently played tracks." });
  }
});

// Fetch User's Top Tracks
router.get("/top-tracks", requiresAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [user] = await queryRecord("SELECT spotify_access_token FROM users WHERE id = ?", [userId]);
    if (!user || !user.spotify_access_token) {
      return res.status(401).json({ message: "Spotify access token missing." });
    }

    const { time_range = "medium_term", limit = 20 } = req.query;

    const response = await axios.get(
      "https://api.spotify.com/v1/me/top/tracks",
      {
        headers: { Authorization: `Bearer ${user.spotify_access_token}` },
        params: { time_range, limit },
      }
    );

    res.json(response.data.items);
  } catch (error) {
    console.error("Error fetching top tracks:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to fetch top tracks." });
  }
});

// Fetch User's Top Artists
router.get("/top-artists", requiresAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [user] = await queryRecord("SELECT spotify_access_token FROM users WHERE id = ?", [userId]);
    if (!user || !user.spotify_access_token) {
      return res.status(401).json({ message: "Spotify access token missing." });
    }

    const { time_range = "long_term", limit = 20 } = req.query;

    const response = await axios.get(
      "https://api.spotify.com/v1/me/top/artists",
      {
        headers: { Authorization: `Bearer ${user.spotify_access_token}` },
        params: { time_range, limit },
      }
    );

    res.json(response.data.items);
  } catch (error) {
    console.error("Error fetching top artists:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to fetch top artists." });
  }
});

module.exports = router;