const express = require("express");
const router = express.Router();
const { queryRecord } = require("../utils/sqlFunctions");
const { requiresAuth } = require("../middleware/authMiddleware");

// Get all users
router.get("/users", requiresAuth, async (req, res) => {
  try {
    const users = await queryRecord("SELECT * FROM users");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Get a single user by Spotify ID
router.get("/users/:spotify_id", requiresAuth, async (req, res) => {
  const { spotify_id } = req.params;

  try {
    const user = await queryRecord("SELECT * FROM users WHERE spotify_id = ?", [
      spotify_id,
    ]);

    if (user.length > 0) {
      res.json(user[0]);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
});

module.exports = router;