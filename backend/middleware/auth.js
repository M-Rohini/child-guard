const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Make sure you have User model

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('🔐 Auth middleware - Token exists:', !!token);

    if (!token) {
        console.log('❌ No token provided');
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret');
        
        // Get user from database to ensure they exist
        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log('❌ User not found in database');
            return res.status(401).json({ message: 'User not found' });
        }

        // Attach user info to request
        req.user = {
            userId: user._id.toString(),
            username: user.username || user.email,
            role: user.role || 'user'
        };

        console.log('✅ User authenticated:', req.user.username);
        next();
    } catch (error) {
        console.log('❌ Token verification failed:', error.message);
        return res.status(403).json({ message: 'Invalid token' });
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

module.exports = { authenticateToken, requireAdmin };