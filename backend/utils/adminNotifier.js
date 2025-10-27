const WebSocket = require('ws');
const Journal = require('../models/journal');

// Store connected admin clients
let adminClients = new Set();

function initializeAdminWebSocket(wss) {
    wss.on('connection', (ws, req) => {
        // Check if it's an admin connection (you can add proper auth)
        const isAdmin = req.url.includes('/admin');
        
        if (isAdmin) {
            adminClients.add(ws);
            console.log('✅ Admin client connected');
            
            ws.on('close', () => {
                adminClients.delete(ws);
                console.log('❌ Admin client disconnected');
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                adminClients.delete(ws);
            });
        }
    });
}

async function notifyAdmin(journalEntry) {
    const notification = {
        type: 'HIGH_RISK_ENTRY',
        entryId: journalEntry._id,
        username: journalEntry.username,
        entryPreview: journalEntry.entry.substring(0, 150) + '...',
        riskLevel: journalEntry.riskLevel,
        riskScore: journalEntry.riskScore,
        mood: journalEntry.mood,
        timestamp: new Date(),
        message: `🚨 ${journalEntry.riskLevel} RISK ALERT: ${journalEntry.username} submitted a concerning journal entry.`
    };
    
    // Send to all connected admin clients
    adminClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(notification));
        }
    });
    
    // Mark as notified in database
    await Journal.findByIdAndUpdate(journalEntry._id, { adminNotified: true });
    
    console.log(`🚨 Admin notified about high-risk entry from ${journalEntry.username}`);
}

module.exports = {
    initializeAdminWebSocket,
    notifyAdmin,
    adminClients
};