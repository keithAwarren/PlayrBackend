const jwt = require("jsonwebtoken");
const { queryRecord } = require("../utils/sqlFunctions");

const requiresAuth = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authorized, no token provided" });
  }

  try {
    const token = authorizationHeader.split(" ")[1]; // Extract token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Fetch user's Spotify access token from the database
    const [user] = await queryRecord(
      "SELECT spotify_id, spotify_access_token FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = {
      userId: decoded.userId,
      spotify_id: user.spotify_id,
      spotify_access_token: user.spotify_access_token, // Attach Spotify token
    };

    next(); // Pass control to the next middleware
  } catch (error) {
    console.error("JWT verification error:", error);
    return res.status(401).json({ error: "Token verification failed" });
  }
};

module.exports = { requiresAuth };