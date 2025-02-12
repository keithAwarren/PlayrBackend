const jwt = require("jsonwebtoken");
const { checkRecordExists } = require("../utils/sqlFunctions");

const requiresAuth = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authorized, no token provided" });
  }

  try {
    const token = authorizationHeader.split(" ")[1]; // Extract token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token with secret

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Check if user exists in the database
    const userExists = await checkRecordExists("users", "id", decoded.userId);

    if (!userExists) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = decoded; // Attach decoded user info to the request
    next(); // Pass control to the next middleware/route handler
  } catch (error) {
    console.error("JWT verification error:", error);
    return res.status(401).json({ error: "Token verification failed" });
  }
};

module.exports = { requiresAuth };