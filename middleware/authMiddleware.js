const jwt = require("jsonwebtoken");
const { queryRecord } = require("../utils/sqlFunctions");

const requiresAuth = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  // Check for a valid Authorization header with Bearer token
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authorized, no token provided" });
  }

  try {
    const token = authorizationHeader.split(" ")[1]; // Extract token

    // Decode and verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Object for verification
    if (typeof decoded !== "object" || !decoded.userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Look up user in the database using the ID from the JWT
    const [user] = await queryRecord(
      "SELECT spotify_id FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach validated user info to the request object
    req.user = {
      userId: decoded.userId,
      spotify_id: user.spotify_id,
    };

    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    return res.status(401).json({ error: "Token verification failed" });
  }
};

module.exports = { requiresAuth };