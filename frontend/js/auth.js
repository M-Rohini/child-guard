const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        console.log('🔐 Auth middleware - Token exists:', !!token);

        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'childguard_secret_2024');
        
        // Get user from database
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Attach user to request
        req.user = {
            userId: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role
        };

        console.log('✅ User authenticated:', req.user.name);
        next();
    } catch (error) {
        console.error('❌ Auth error:', error.message);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

module.exports = { authenticateToken, requireAdmin };

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const userType = document.getElementById('userType').value;

    if (!email || !password || !userType) {
        showError('loginError', 'Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('safeguard_user', JSON.stringify(data.user));
            localStorage.setItem('safeguard_token', data.token);
            window.location.href = 'dashboard.html';
        } else {
            showError('loginError', data.message || 'Login failed');
        }
    } catch (error) {
        showError('loginError', 'Server not responding');
    }
}

// TEMPORARY FIX - Use login endpoint for signup
/*
async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const age = document.getElementById('signupAge').value;
    const userType = document.getElementById('signupUserType').value;
    const location = document.getElementById('signupLocation').value;
    
    const errorDiv = document.getElementById('signupError');
    const successDiv = document.getElementById('signupSuccess');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    // Basic validation
    if (!name || !email || !password || !age || !userType || !location) {
        showSignupError('Please fill in all fields');
        return;
    }

    try {
        // Use login endpoint temporarily (since it accepts any credentials)
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password,
                userType: userType
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Enhance user data with signup information
            const enhancedUser = {
                ...data.user,
                name: name,
                age: parseInt(age),
                location: location
            };
            
            localStorage.setItem('safeguard_token', data.token);
            localStorage.setItem('safeguard_user', JSON.stringify(enhancedUser));
            
            successDiv.textContent = 'Account created successfully! Redirecting...';
            successDiv.style.display = 'block';
            
            setTimeout(() => {
                if (enhancedUser.role === 'child') {
                    window.location.href = 'journal.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 2000);
            
        } else {
            showSignupError(data.message || 'Signup failed');
        }
    } catch (error) {
        showSignupError('Network error: ' + error.message);
    }
}
*/
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}