const express = require('express');
const router = express.Router();
const { insertRecord, queryRecord } = require('../utils/sqlFunctions');

// Add a favorite item
router.post('/favorites', async (req, res) => {
    const { userId, itemType, itemId, itemName, itemArtist } = req.body;
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

module.exports = router;