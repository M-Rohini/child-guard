const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Chat routes working!' });
});

// Chat endpoint
router.post('/db-response', chatController.chatResponse);

module.exports = router;