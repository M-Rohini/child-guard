const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
    userId: { 
        type: String,  // Use String instead of ObjectId
        required: true 
    },
    username: { 
        type: String, 
        required: true 
    },
    entry: { 
        type: String, 
        required: true 
    },
    mood: { 
        type: String, 
        enum: ['happy', 'sad', 'angry', 'scared', 'confused', 'neutral'] 
    },
    riskScore: { 
        type: Number, 
        default: 0 
    },
    riskLevel: { 
        type: String, 
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 
        default: 'LOW' 
    },
    flagged: { 
        type: Boolean, 
        default: false 
    },
    isPrivate: { 
        type: Boolean, 
        default: true 
    },
    adminNotified: { 
        type: Boolean, 
        default: false 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Journal', journalSchema);