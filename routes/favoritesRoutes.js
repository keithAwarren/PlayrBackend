const express = require('express');
const router = express.Router();
const { insertRecord, queryRecord } = require('../utils/sqlFunctions');

// Add a favorite item
router.post('/favorites', async (req, res) => {
    const { userId, itemType, itemId, itemName, itemArtist } = req.body;
    
    // Log the parameters to check for undefined values
    console.log("Favorite parameters:", { userId, itemType, itemId, itemName, itemArtist });

    try {
        await insertRecord(
            'favorites',
            ['user_id', 'item_type', 'item_id', 'item_name', 'item_artist'],
            [userId, itemType, itemId, itemName, itemArtist]
        );
        res.status(201).json({ message: 'Favorite added successfully' });
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({ message: 'Error adding favorite' });
    }
});

// Get favorite items by type
router.get('/favorites/:userId/:itemType', async (req, res) => {
    const { userId, itemType } = req.params;
    try {
        const favorites = await queryRecord(
            'SELECT * FROM favorites WHERE user_id = ? AND item_type = ?',
            [userId, itemType]
        );
        res.json(favorites);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ message: 'Error fetching favorites' });
    }
});

// Check if a track is a favorite
router.get('/favorites/:userId/track/:trackId', async (req, res) => {
    const { userId, trackId } = req.params;
    try {
        const [favorite] = await queryRecord(
            'SELECT * FROM favorites WHERE user_id = ? AND item_id = ?',
            [userId, trackId]
        );
        res.json({ isFavorite: !!favorite }); // Return true if the track is a favorite
    } catch (error) {
        console.error('Error checking favorite status:', error);
        res.status(500).json({ message: 'Error checking favorite status' });
    }
});

module.exports = router;