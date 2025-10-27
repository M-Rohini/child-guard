const express = require('express');
const { 
    createJournalEntry, 
    getJournalEntries, 
    getFlaggedEntries,
    markAsReviewed,
    getAllEntries,
    getEntryCount
} = require('../controllers/journalController');

const router = express.Router();

// Regular user routes
router.post('/entry', createJournalEntry);
router.get('/entries', getJournalEntries);

// Admin routes
router.get('/admin/flagged', getFlaggedEntries);
router.patch('/admin/review/:entryId', markAsReviewed);

// Debug routes
router.get('/debug-all', getAllEntries);
router.get('/count', getEntryCount);

module.exports = router;