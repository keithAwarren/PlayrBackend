const express = require("express");
const querystring = require("querystring");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { insertRecord, queryRecord } = require("../utils/sqlFunctions");
const { requiresAuth } = require("../middleware/authMiddleware");

const router = express.Router();

const redirectUri = "https://playrofficial.netlify.app/";

// Redirects the user to Spotify's authorization page for login.
router.get("/login", (req, res) => {
  const scope =
    "user-read-private user-read-email playlist-read-private playlist-read-collaborative user-top-read user-read-recently-played";

  const params = querystring.stringify({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: scope,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

/**
 * Handles the callback from Spotify after login. Exchanges the authorization code for tokens,
 * retrieves user profile data, stores or updates the user in the database, generates a JWT, 
 * and redirects to the frontend with all tokens.
 */
router.get("/callback", async (req, res) => {
  const code = req.query.code || null;

  try {
    const data = querystring.stringify({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET,
    });

    const response = await axios.post("https://accounts.spotify.com/api/token", data);
    const { access_token, refresh_token } = response.data;

    const userProfileResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id: spotify_id, display_name, email, images } = userProfileResponse.data;

    console.log("Spotify User Profile Data:", {
      spotify_id,
      display_name,
      email,
    });

    const [existingUser] = await queryRecord(
      "SELECT * FROM users WHERE spotify_id = ?",
      [spotify_id]
    );

    let userId;
    if (existingUser) {
      userId = existingUser.id;
    } else {
      const result = await insertRecord(
        "users",
        ["spotify_id", "display_name", "email", "profile_image"],
        [spotify_id, display_name, email, images[0]?.url]
      );
      userId = result.insertId;
      console.log(`New user created with ID: ${userId}`);
    }

    const jwtPayload = { userId: userId, spotify_id, email };
    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.redirect(
      `https://playrofficial.netlify.app/#/dashboard?access_token=${access_token}&refresh_token=${refresh_token}&jwt=${jwtToken}`
    );
  } catch (error) {
    console.error("Error during authentication:", error);

    res.redirect("https://playrofficial.netlify.app/#/login?error=authentication_error");
  }
});

// Refreshes the Spotify access token using the refresh token.
router.post("/refresh", requiresAuth, async (req, res) => {
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

    const response = await axios.post("https://accounts.spotify.com/api/token", data);
    const { access_token, expires_in } = response.data;

    res.json({ access_token, expires_in });
  } catch (error) {
    console.error("Error refreshing token:", error);

    if (error.response && error.response.status === 400) {
      return res.status(400).json({ message: "Invalid refresh token." });
    }

    res.status(500).json({ message: "Failed to refresh token." });
  }
});

module.exports = router;