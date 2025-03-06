const express = require("express");
const querystring = require("querystring");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { insertRecord, queryRecord } = require("../utils/sqlFunctions");
const { requiresAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// Redirect URI for Spotify OAuth (must match the one set in Spotify Developer Dashboard)
const redirectUri = "https://playrofficial.netlify.app/callback";

/**
 * /login Redirects user to Spotify's authorization page for login
 * This initiates the OAuth flow by sending the user to Spotify's login page.
 */
router.get("/login", (req, res) => {
  // Define the permissions (scopes) our app needs from the user
  const scope =
    "user-read-private user-read-email playlist-read-private playlist-read-collaborative user-top-read user-read-recently-played";

  // Construct query parameters for the authorization URL
  const params = querystring.stringify({
    client_id: process.env.SPOTIFY_CLIENT_ID, // Our app's client ID
    response_type: "code", // Request an authorization code
    redirect_uri: redirectUri, // Where Spotify will redirect after login
    scope: scope, // The permissions our app is requesting
  });

  // Redirect the user to Spotify's authorization page
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

/**
 * /callback Handles Spotify's callback after login
 * Exchanges the authorization code for access and refresh tokens.
 */
router.get("/callback", async (req, res) => {
  const code = req.query.code || null; // Get the authorization code from the URL

  // If no code is provided, redirect the user back to login with an error
  if (!code) {
    console.error("Missing authorization code");
    return res.redirect("https://playrofficial.netlify.app/#/login?error=missing_code");
  }

  try {
    /**
     * Request access and refresh tokens from Spotify
     * - grant_type: "authorization_code" tells Spotify we are exchanging a code for tokens
     * - Authorization header contains our client credentials encoded in Base64
     */
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

    // Extract access and refresh tokens from response
    const { access_token, refresh_token } = tokenResponse.data;

    // If no access token is received, throw an error
    if (!access_token) {
      throw new Error("No access token received from Spotify.");
    }

    /**
     * Fetch user's Spotify profile data using the access token
     * - The "me" endpoint returns the current logged-in user's profile
     */
    const userProfileResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    // Extract relevant user information
    const { id: spotify_id, display_name, email = null, images } = userProfileResponse.data;

    console.log("Spotify User Profile Data:", { spotify_id, display_name, email });

    /**
     * Check if the user already exists in our database
     * - We query the `users` table by matching the `spotify_id`
     */
    const [existingUser] = await queryRecord(
      "SELECT * FROM users WHERE spotify_id = ?",
      [spotify_id]
    );

    let userId;

    // If user exists, use their existing ID
    if (existingUser) {
      userId = existingUser.id;
    } else {
      /**
       * If user does not exist, insert them into the database
       * - Store their Spotify ID, display name, email, and profile image
       */
      const result = await insertRecord(
        "users",
        ["spotify_id", "display_name", "email", "profile_image"],
        [spotify_id, display_name, email || null, images[0]?.url || null]
      );

      // Retrieve the newly created user's ID
      userId = result.insertId;
      console.log(`New user created with ID: ${userId}`);
    }

    /**
     * Generate a JWT token for user authentication
     * - Contains user ID, Spotify ID, and email (if available)
     * - Signed with our secret key and expires in 1 hour
     */
    const jwtPayload = { userId, spotify_id, email };
    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    /**
     * Redirect user to frontend with access_token, refresh_token, and JWT in the URL hash
     * - The frontend will extract these values and store them in localStorage
     */
    res.redirect(
      `https://playrofficial.netlify.app/#access_token=${access_token}&refresh_token=${refresh_token}&jwt=${jwtToken}`
    );
  } catch (error) {
    console.error("Error during authentication:", error.response?.data || error.message);
    res.redirect("https://playrofficial.netlify.app/#/login?error=authentication_error");
  }
});

/**
 * /refresh Refreshes the access token when it expires
 * The frontend calls this endpoint when an access token needs to be renewed.
 */
router.post("/refresh", requiresAuth, async (req, res) => {
  const refreshToken = req.body.refresh_token;

  // If no refresh token is provided, return an error
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required." });
  }

  try {
    /**
     * Send a request to Spotify to get a new access token
     * - grant_type: "refresh_token" tells Spotify we are using the refresh token
     */
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

    // Extract the new access token and its expiration time
    const { access_token, expires_in } = refreshResponse.data;

    // Send the new access token back to the frontend
    res.json({ access_token, expires_in });
  } catch (error) {
    console.error("Error refreshing token:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to refresh token." });
  }
});

module.exports = router;