const express = require("express");
const querystring = require("querystring");
const axios = require("axios");
const { insertRecord, queryRecord } = require("../utils/sqlFunctions");
const router = express.Router();

const redirectUri = "http://localhost:3000/MusicPlayr/callback";

router.get("/login", (req, res) => {
  const scope =
    "user-read-private user-read-email playlist-read-private playlist-read-collaborative user-read-recently-played";
  const params = querystring.stringify({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: scope,
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

router.get("/callback", async (req, res) => {
  const code = req.query.code || null;

  try {
    // Exchange authorization code for access and refresh tokens
    const data = querystring.stringify({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET,
    });

    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      data
    );
    const { access_token, refresh_token } = response.data;

    // Fetch user profile data from Spotify
    const userProfileResponse = await axios.get(
      "https://api.spotify.com/v1/me",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const {
      id: spotify_id,
      display_name,
      email,
      images,
    } = userProfileResponse.data;

    console.log("Spotify User Profile Data:", {
      spotify_id,
      display_name,
      email,
    });

    // Check if user exists in the database
    const [existingUser] = await queryRecord(
      "SELECT * FROM users WHERE spotify_id = ?",
      [spotify_id]
    );

    let userId;
    if (existingUser) {
      userId = existingUser.id;
      console.log(`Existing user found with ID: ${userId}`);
    } else {
      const result = await insertRecord(
        "users",
        ["spotify_id", "display_name", "email", "profile_image"],
        [spotify_id, display_name, email, images[0]?.url]
      );
      userId = result.insertId;
      console.log(`New user created with ID: ${userId}`);
    }

    // Redirect to frontend with access_token, refresh_token, and user_id
    console.log(
      `Redirecting to frontend with access_token, refresh_token, and user_id: ${userId}`
    );
    res.redirect(
      `http://localhost:3000/MusicPlayr/dashboard#access_token=${access_token}&refresh_token=${refresh_token}&user_id=${userId}`
    );
  } catch (error) {
    console.error("Error during authentication:", error);

    // Fallback: Redirect with a failure status if something goes wrong
    res.redirect(
      `http://localhost:3000/MusicPlayr/login?error=authentication_error`
    );
  }
});

// Refresh token route
router.post("/refresh", async (req, res) => {
  const refreshToken = req.body.refresh_token;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required." });
  }

  try {
    const data = querystring.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET,
    });

    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      data
    );

    const { access_token, expires_in } = response.data;

    console.log(
      `Refreshed access token: ${access_token}, expires in: ${expires_in}`
    );
    res.json({ access_token, expires_in });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ message: "Failed to refresh token." });
  }
});

module.exports = router;