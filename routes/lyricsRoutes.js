const express = require("express");
const axios = require("axios");
const { queryRecord, insertRecord } = require("../utils/sqlFunctions");
const { requiresAuth } = require("../middleware/authMiddleware");
const router = express.Router();

// Route to fetch song lyrics from Musixmatch
router.get("/lyrics", requiresAuth, async (req, res) => {
  const { trackName, artistName } = req.query; // Get track and artist from query parameters

  try {
    // Check if lyrics are cached in the database
    const cachedLyrics = await queryRecord(
      "SELECT lyrics FROM lyrics WHERE track_name = ? AND artist_name = ?",
      [trackName, artistName]
    );

    if (cachedLyrics.length > 0) {
      return res.json({ lyrics: cachedLyrics[0].lyrics }); // Return cached lyrics
    }

    // Fetch lyrics from Musixmatch API
    const response = await axios.get(
      "https://api.musixmatch.com/ws/1.1/matcher.lyrics.get",
      {
        params: {
          q_track: trackName,
          q_artist: artistName,
          apikey: process.env.MUSIXMATCH_API_KEY,
        },
      }
    );

    const lyrics = response.data.message.body.lyrics.lyrics_body;

    // Cache the lyrics in the database
    await insertRecord(
      "lyrics",
      ["track_name", "artist_name", "lyrics"],
      [trackName, artistName, lyrics]
    );

    res.json({ lyrics });
  } catch (error) {
    console.error("Error fetching lyrics:", error);
    res.status(500).send("Error fetching lyrics");
  }
});

module.exports = router;