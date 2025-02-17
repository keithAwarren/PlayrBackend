const express = require("express");
const querystring = require("querystring");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { insertRecord, queryRecord } = require("../utils/sqlFunctions");
const { requiresAuth } = require("../middleware/authMiddleware")

const router = express.Router();

// URL to redirect back to your frontend after Spotify login
const redirectUri = "https://keithawarren.github.io/MusicPlayr/callback";

// Redirects the user to Spotify's authorization page for login.
router.get("/login", (req, res) => {
  // Scopes define what kind of access your app requests from the user
  const scope = 
    "user-read-private user-read-email playlist-read-private playlist-read-collaborative user-top-read user-read-recently-played";
  
  // Construct the Spotify authorization URL with necessary query parameters
  const params = querystring.stringify({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: scope,
  });

  // Redirect the user to Spotify's authorization page
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

/**
 * Handles the callback from Spotify after login. Exchanges the authorization code for tokens,
 * retrieves user profile data, stores or updates the user in the database, generates a JWT, 
 * and redirects to the frontend with all tokens.
 */
router.get("/callback", async (req, res) => {
  const code = req.query.code || null; // Authorization code from Spotify

  try {
    // Exchange the authorization code for access and refresh tokens
    const data = querystring.stringify({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET,
    });

    // POST request to Spotify's token API
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      data
    );

    // Destructure tokens from Spotify's response
    const { access_token, refresh_token } = response.data;

    // Fetch user's profile information using the access token
    const userProfileResponse = await axios.get(
      "https://api.spotify.com/v1/me",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    // Extract necessary user data
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

    // Check if the user already exists in the database
    const [existingUser] = await queryRecord(
      "SELECT * FROM users WHERE spotify_id = ?",
      [spotify_id]
    );

    let userId;
    if (existingUser) {
      // If user exists, retrieve their ID
      userId = existingUser.id;
    } else {
      // If new user, insert them into the database
      const result = await insertRecord(
        "users",
        ["spotify_id", "display_name", "email", "profile_image"],
        [spotify_id, display_name, email, images[0]?.url]
      );
      userId = result.insertId;
      console.log(`New user created with ID: ${userId}`);
    }

    // Generate a JWT for additional session security
    const jwtPayload = { userId: userId, spotify_id, email };
    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: "1h", // Token expires in 1 hour
    });

    // Redirect the user back to the frontend with access token, refresh token, and JWT
    res.redirect(
      `https://keithawarren.github.io/MusicPlayr/dashboard#access_token=${access_token}&refresh_token=${refresh_token}&jwt=${jwtToken}`
    );
  } catch (error) {
    console.error("Error during authentication:", error);

    // If there's an error, redirect back to the login page with an error query parameter
    res.redirect(
      `https://keithawarren.github.io/MusicPlayr/login?error=authentication_error`
    );
  }
});

// Refreshes the Spotify access token using the refresh token.
router.post("/refresh", requiresAuth, async (req, res) => {
  const refreshToken = req.body.refresh_token;

  // Validate if refresh token is provided
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required." });
  }

  try {
    // Prepare data for refreshing the access token
    const data = querystring.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET,
    });

    // POST request to Spotify to refresh the token
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      data
    );

    // Extract new access token and its expiration time
    const { access_token, expires_in } = response.data;

    // Send the new access token back to the frontend
    res.json({ access_token, expires_in });
  } catch (error) {
    console.error("Error refreshing token:", error);

    // Handle invalid refresh token error
    if (error.response && error.response.status === 400) {
      return res.status(400).json({ message: "Invalid refresh token." });
    }

    // Handle other possible errors
    res.status(500).json({ message: "Failed to refresh token." });
  }
});

module.exports = router;