const express = require("express");
const querystring = require("querystring");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { insertRecord, queryRecord } = require("../utils/sqlFunctions");
const { requiresAuth } = require("../middleware/authMiddleware");

const router = express.Router();

const redirectUri = "https://playrofficial.netlify.app/callback";

// Redirects user to Spotify's authorization page
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

// Handles the callback from Spotify after login
router.get("/callback", async (req, res) => {
  const code = req.query.code || null;

  if (!code) {
    console.error("Missing authorization code");
    return res.redirect("https://playrofficial.netlify.app/#/login?error=missing_code");
  }

  try {
    // Use `Authorization` header instead of passing client_secret in the body
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
        },
      }
    );

    const { access_token, refresh_token } = tokenResponse.data;

    if (!access_token) {
      throw new Error("No access token received from Spotify.");
    }

    // Fetch user's profile information using the access token
    const userProfileResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id: spotify_id, display_name, email = null, images } = userProfileResponse.data;

    console.log("Spotify User Profile Data:", { spotify_id, display_name, email });

    // Check if user exists in database
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
        [spotify_id, display_name, email || null, images[0]?.url || null]
      );
      userId = result.insertId;
      console.log(`New user created with ID: ${userId}`);
    }

    // Generate a JWT token
    const jwtPayload = { userId, spotify_id, email };
    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    //  Redirect user to frontend with tokens in hash
    res.redirect(
      `https://playrofficial.netlify.app/#access_token=${access_token}&refresh_token=${refresh_token}&jwt=${jwtToken}`
    );
  } catch (error) {
    console.error("Error during authentication:", error.response?.data || error.message);
    res.redirect("https://playrofficial.netlify.app/#/login?error=authentication_error");
  }
});

// Refresh access token using the refresh token
router.post("/refresh", requiresAuth, async (req, res) => {
  const refreshToken = req.body.refresh_token;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required." });
  }

  try {
    const refreshResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
        },
      }
    );

    const { access_token, expires_in } = refreshResponse.data;

    res.json({ access_token, expires_in });
  } catch (error) {
    console.error("Error refreshing token:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to refresh token." });
  }
});

module.exports = router;