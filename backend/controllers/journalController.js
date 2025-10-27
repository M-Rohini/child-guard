const mongoose = require('mongoose');
const Journal = require('../models/journal');

// Create journal entry - ONLY for high-risk entries
exports.createJournalEntry = async (req, res) => {
    try {
        console.log('🎯 Journal endpoint hit!');
        
        const { entry, mood, isPrivate } = req.body;
        console.log('📥 Entry received:', entry?.substring(0, 100) + '...');

        if (!entry) {
            return res.status(400).json({ message: 'Journal entry is required' });
        }

        // Risk calculation
        const lowerEntry = entry.toLowerCase();
        let riskScore = 0;
        let riskLevel = 'LOW';
        
        // High-risk keywords
        if (lowerEntry.includes('suicide') || lowerEntry.includes('kill') || lowerEntry.includes('end it all') || 
            lowerEntry.includes('want to die') || lowerEntry.includes('not want to live')) {
            riskScore = 80;
            riskLevel = 'CRITICAL';
        } else if (lowerEntry.includes('abuse') || lowerEntry.includes('molest') || lowerEntry.includes('rape') || 
                   lowerEntry.includes('beaten') || lowerEntry.includes('hit me') || lowerEntry.includes('punish me')) {
            riskScore = 70;
            riskLevel = 'HIGH';
        } else if (lowerEntry.includes('hurt') || lowerEntry.includes('scared') || lowerEntry.includes('afraid') || 
                   lowerEntry.includes('unsafe') || lowerEntry.includes('threat') || lowerEntry.includes('fear')) {
            riskScore = 40;
            riskLevel = 'MEDIUM';
        }

        console.log('⚠️ Risk assessment:', { riskScore, riskLevel });

        // ONLY STORE HIGH-RISK ENTRIES (MEDIUM, HIGH, CRITICAL)
        if (riskLevel === 'LOW') {
            console.log('📝 Low risk entry - not storing in database');
            return res.json({
                message: 'Journal entry processed successfully (low risk - not stored)',
                entry: {
                    riskLevel: 'LOW',
                    riskScore: riskScore,
                    message: 'This entry was low risk and not stored in database'
                }
            });
        }

        // Use the actual user ID from authentication
        const userId = req.user?.userId || 'unknown_user';
        const username = req.user?.username || 'unknown_user';

        console.log('👤 User info:', { userId, username });

        const journalEntry = new Journal({
            userId: userId,
            username: username,
            entry: entry,
            mood: mood || 'neutral',
            riskScore: riskScore,
            riskLevel: riskLevel,
            flagged: riskLevel === 'CRITICAL' || riskLevel === 'HIGH',
            isPrivate: isPrivate !== false
        });

        console.log('💾 Saving HIGH-RISK entry to database...');
        const savedEntry = await journalEntry.save();
        console.log('✅ High-risk entry saved successfully! ID:', savedEntry._id);

        res.json({
            message: 'High-risk journal entry saved successfully',
            entry: savedEntry
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ 
            message: 'Error saving journal entry',
            error: error.message
        });
    }
};

// Get journal entries for current user only
exports.getJournalEntries = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'User authentication required' });
        }

        const entries = await Journal.find({ userId: userId }).sort({ createdAt: -1 });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching journal entries' });
    }
};

// Get flagged entries (for admin)
exports.getFlaggedEntries = async (req, res) => {
    try {
        // Only get MEDIUM, HIGH, CRITICAL risk entries
        const flaggedEntries = await Journal.find({ 
            riskLevel: { $in: ['MEDIUM', 'HIGH', 'CRITICAL'] } 
        }).sort({ createdAt: -1 });
        
        res.json(flaggedEntries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching flagged entries' });
    }
};

// Mark as reviewed
exports.markAsReviewed = async (req, res) => {
    try {
        const { entryId } = req.params;
        await Journal.findByIdAndUpdate(entryId, { adminNotified: true });
        res.json({ message: 'Entry marked as reviewed' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating entry' });
    }
};

// Debug: Get all high-risk entries
exports.getAllEntries = async (req, res) => {
    try {
        const highRiskEntries = await Journal.find({ 
            riskLevel: { $in: ['MEDIUM', 'HIGH', 'CRITICAL'] } 
        }).sort({ createdAt: -1 });
        
        console.log('📊 High-risk entries count:', highRiskEntries.length);
        res.json({
            total: highRiskEntries.length,
            entries: highRiskEntries
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching entries' });
    }
};

// Debug: Get entry count
exports.getEntryCount = async (req, res) => {
    try {
        const highRiskCount = await Journal.countDocuments({ 
            riskLevel: { $in: ['MEDIUM', 'HIGH', 'CRITICAL'] } 
        });
        const totalCount = await Journal.countDocuments();
        
        res.json({ 
            highRiskCount: highRiskCount,
            totalCount: totalCount,
            lowRiskCount: totalCount - highRiskCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Error counting entries' });
    }
};