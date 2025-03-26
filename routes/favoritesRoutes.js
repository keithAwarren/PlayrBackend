const express = require("express");
const router = express.Router();
const { insertRecord, queryRecord } = require("../utils/sqlFunctions");
const { requiresAuth } = require("../middleware/authMiddleware");

// Add a favorite item
router.post("/favorites", requiresAuth, async (req, res) => {
  const { itemType, itemId, itemName, itemArtist } = req.body;

  console.log("Favorite parameters:", {
    itemType,
    itemId,
    itemName,
    itemArtist,
  });

  if (!itemType || !itemId) {
    return res
      .status(400)
      .json({ message: "Item type and item ID are required." });
  }

  try {
    await insertRecord(
      "favorites",
      ["user_id", "item_type", "item_id", "item_name", "item_artist"],
      [req.user.spotify_id, itemType, itemId, itemName, itemArtist]
    );
    res.status(201).json({ message: "Favorite added successfully" });
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ message: "Error adding favorite" });
  }
});

// Get favorite items by type for logged-in user
router.get("/favorites/:itemType", requiresAuth, async (req, res) => {
  const { itemType } = req.params;
  try {
    const favorites = await queryRecord(
      "SELECT * FROM favorites WHERE item_type = ? AND user_id = ?",
      [itemType, req.user.spotify_id]
    );
    res.json(favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ message: "Error fetching favorites" });
  }
});

// Check if a specific track is favorited by the current user
router.get("/favorites/track/:trackId", requiresAuth, async (req, res) => {
  const { trackId } = req.params;
  try {
    const [favorite] = await queryRecord(
      "SELECT * FROM favorites WHERE item_id = ? AND user_id = ?",
      [trackId, req.user.spotify_id]
    );
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    res.status(500).json({ message: "Error checking favorite status" });
  }
});

module.exports = router;