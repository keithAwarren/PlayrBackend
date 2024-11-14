const express = require('express');
const router = express.Router();
const { queryRecord, insertRecord } = require('../utils/sqlFunctions');

// Create a new user
router.post('/users', async (req, res) => {
    const { spotify_id, display_name, email, profile_image } = req.body;
    
    try {
        const result = await insertRecord('users', ['spotify_id', 'display_name', 'email', 'profile_image'], [spotify_id, display_name, email, profile_image]);
        res.status(201).json({ message: 'User created successfully', userId: result.insertId });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Error creating user' });
    }
});

// Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await queryRecord('SELECT * FROM users');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Get a single user by Spotify ID
router.get('/users/:spotify_id', async (req, res) => {
    const { spotify_id } = req.params;
    try {
        const user = await queryRecord('SELECT * FROM users WHERE spotify_id = ?', [spotify_id]);
        if (user.length > 0) {
            res.json(user[0]);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user' });
    }
});

module.exports = router;