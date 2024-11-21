const express = require('express');
const router = express.Router();
const { insertRecord, queryRecord } = require('../utils/sqlFunctions');

// Add a favorite item
router.post('/favorites', async (req, res) => {
    const { itemType, itemId, itemName, itemArtist } = req.body;
    
    // Log the parameters to check for undefined values
    console.log("Favorite parameters:", { itemType, itemId, itemName, itemArtist });

    if (!itemType || !itemId) {
        return res.status(400).json({ message: 'Item type and item ID are required.' });
    }

    try {
        await insertRecord(
            'favorites',
            ['item_type', 'item_id', 'item_name', 'item_artist'],
            [itemType, itemId, itemName, itemArtist]
        );
        res.status(201).json({ message: 'Favorite added successfully' });
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({ message: 'Error adding favorite' });
    }
});

// Get favorite items by type
router.get('/favorites/:itemType', async (req, res) => {
    const { itemType } = req.params;
    try {
        const favorites = await queryRecord(
            'SELECT * FROM favorites WHERE item_type = ?',
            [itemType]
        );
        res.json(favorites);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ message: 'Error fetching favorites' });
    }
});

// Check if a track is a favorite
router.get('/favorites/track/:trackId', async (req, res) => {
    const { trackId } = req.params;
    try {
        const [favorite] = await queryRecord(
            'SELECT * FROM favorites WHERE item_id = ?',
            [trackId]
        );
        res.json({ isFavorite: !!favorite }); // Return true if the track is a favorite
    } catch (error) {
        console.error('Error checking favorite status:', error);
        res.status(500).json({ message: 'Error checking favorite status' });
    }
});

module.exports = router;