const express = require('express');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Auth routes are working!' });
});

// Health check for auth
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'Authentication service is running',
        timestamp: new Date()
    });
});

module.exports = router;