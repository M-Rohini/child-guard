const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const signup = async (req, res) => {
    try {
        console.log('🔐 SIGNUP attempt:', req.body.email);
        
        const { name, email, password, age, userType, location } = req.body;
        
        // Validate required fields
        if (!name || !email || !password || !age || !userType || !location) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            age: parseInt(age),
            role: userType,
            location,
            createdAt: new Date()
        });

        // Save user to database
        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: newUser._id,
                email: newUser.email,
                role: newUser.role
            },
            process.env.JWT_SECRET || 'childguard_secret_2024',
            { expiresIn: '24h' }
        );

        console.log('✅ User created successfully:', newUser.email);
        
        res.status(201).json({
            message: 'User created successfully',
            token: token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                age: newUser.age,
                location: newUser.location
            }
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error during signup' });
    }
};

const login = async (req, res) => {
    try {
        console.log('🔐 LOGIN attempt:', req.body.email);
        
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'childguard_secret_2024',
            { expiresIn: '24h' }
        );

        console.log('✅ Login successful:', user.email);
        
        res.json({
            message: 'Login successful',
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                age: user.age,
                location: user.location
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};


module.exports = { 
    signup, 
    login
};