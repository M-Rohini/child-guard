require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - Allow all for development
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/childguard', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);
// User Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    age: {
        type: Number,
        required: true
    },
    role: {
        type: String,
        enum: ['child', 'parent', 'professional'],
        required: true
    },
    location: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// ===== PROFESSIONAL SCHEMA =====
const professionalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['doctor', 'counselor', 'lawyer', 'social_worker'], required: true },
    specialization: { type: String, required: true },
    location: { type: String, required: true },
    rating: { type: Number, default: 0 },
    experience: { type: String, required: true },
    cost: { type: String, required: true },
    available: { type: Boolean, default: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    qualifications: [String],
    languages: [String],
    description: String,
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Professional = mongoose.model('Professional', professionalSchema);


const shelterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['emergency', 'long_term', 'family'], required: true },
    location: { type: String, required: true },
    address: { type: String, required: true },
    contact: { type: String, required: true },
    capacity: { type: Number, required: true },
    currentOccupancy: { type: Number, required: true },
    description: String,
    services: [String],
    verified: { type: Boolean, default: false },
    available: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const Shelter = mongoose.model('Shelter', shelterSchema);


// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign({ 
        userId: user._id,
        email: user.email,
        role: user.role
    }, process.env.JWT_SECRET || 'childguard_secret_2024', { 
        expiresIn: '7d' 
    });
};

// ===== AUTH ENDPOINTS =====
// SIGNUP ENDPOINT
app.post('/api/auth/signup', async (req, res) => {
    try {
        console.log('📝 Signup attempt:', req.body);
        
        const { name, email, password, age, userType, location } = req.body;

        // Validate required fields
        if (!name || !email || !password || !age || !userType || !location) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate age based on user type
        if (userType === 'child' && (age < 5 || age > 17)) {
            return res.status(400).json({ message: 'Children must be between 5-17 years old' });
        }

        if ((userType === 'parent' || userType === 'professional') && age < 18) {
            return res.status(400).json({ message: 'Parents and professionals must be 18 years or older' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password,
            age: parseInt(age),
            role: userType,
            location
        });

        await user.save();

        // Generate token
        const token = generateToken(user);

        console.log('✅ User registered:', user.name);

        res.json({
            message: 'Account created successfully!',
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
        console.error('❌ Signup error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }
        res.status(500).json({ message: 'Error creating account' });
    }
});

// LOGIN ENDPOINT
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('🔐 Login attempt:', req.body.email);
        
        const { email, password, userType } = req.body;

        if (!email || !password || !userType) {
            return res.status(400).json({ message: 'Email, password and role are required' });
        }

        // Find user in database
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check role
        if (user.role !== userType) {
            return res.status(400).json({ message: `Account is registered as ${user.role}, not ${userType}` });
        }

        // Generate token
        const token = generateToken(user);

        console.log('✅ User logged in:', user.name);

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
        console.error('❌ Login error:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// ===== JOURNAL ENDPOINTS =====
app.post('/api/journal/entry', async (req, res) => {
    try {
        console.log('📝 Journal entry attempt');
        
        const { entry, mood, isPrivate } = req.body;

        if (!entry) {
            return res.status(400).json({ message: 'Journal entry is required' });
        }

        // Enhanced risk calculation with better matching
        const lowerEntry = entry.toLowerCase().trim();
        let riskScore = 0;
        let riskLevel = 'LOW';
        let triggers = [];
        
        // CRITICAL risk triggers - more comprehensive list
        const criticalTriggers = [
            'suicide', 'kill myself', 'end my life', 'want to die', 
            'end it all', 'no reason to live', 'better off dead', 'end myself',
            'take my life', 'kill myself', 'don\'t want to live', 'hate my life',
            'life is not worth', 'can\'t go on', 'give up on life'
        ];
        
        // HIGH risk triggers - expanded list
        const highTriggers = [
            'abuse', 'molest', 'rape', 'sexual abuse', 'beating me',
            'hurting me', 'hit me', 'beat me', 'physical abuse', 'touching me',
            'harassment', 'molested', 'raped', 'abused', 'violence',
            'hurt me', 'assault', 'forced me', 'threaten me'
        ];
        
        // MEDIUM risk triggers
        const mediumTriggers = [
            'scared', 'afraid', 'frightened', 'terrified', 'unsafe',
            'parents fight', 'fighting', 'yelling', 'screaming', 'bully',
            'bullied', 'threat', 'worried', 'anxious', 'nervous',
            'depressed', 'sad all the time', 'can\'t sleep', 'bad dreams'
        ];

        // Check for critical triggers (loose matching)
        for (const trigger of criticalTriggers) {
            if (lowerEntry.includes(trigger)) {
                riskScore = 80;
                riskLevel = 'CRITICAL';
                triggers.push(trigger);
                console.log(`🔴 CRITICAL trigger found: "${trigger}" in entry: "${entry}"`);
                break;
            }
        }

        // Check for high triggers (only if not already critical)
        if (riskLevel === 'LOW') {
            for (const trigger of highTriggers) {
                if (lowerEntry.includes(trigger)) {
                    riskScore = 70;
                    riskLevel = 'HIGH';
                    triggers.push(trigger);
                    console.log(`🟠 HIGH trigger found: "${trigger}" in entry: "${entry}"`);
                    break;
                }
            }
        }

        // Check for medium triggers (only if not already critical or high)
        if (riskLevel === 'LOW') {
            for (const trigger of mediumTriggers) {
                if (lowerEntry.includes(trigger)) {
                    riskScore = 40;
                    riskLevel = 'MEDIUM';
                    triggers.push(trigger);
                    console.log(`🟡 MEDIUM trigger found: "${trigger}" in entry: "${entry}"`);
                    break;
                }
            }
        }

        console.log('⚠️ Risk assessment:', { riskScore, riskLevel, triggers });

        // Get user info from token
        let userInfo = null;
        try {
            const authHeader = req.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'childguard_secret_2024');
                
                // Find user in database
                const user = await User.findById(decoded.userId);
                if (user) {
                    userInfo = {
                        userId: user._id,
                        name: user.name,
                        email: user.email,
                        age: user.age,
                        location: user.location,
                        role: user.role
                    };
                    console.log('👤 User identified:', userInfo.name);
                }
            }
        } catch (authError) {
            console.log('🔐 Auth error or no token:', authError.message);
        }

        // Store medium, high and critical risk entries in database
        if ((riskLevel === 'MEDIUM' || riskLevel === 'HIGH' || riskLevel === 'CRITICAL') && userInfo) {
            try {
                // Define journal schema
                const journalEntrySchema = new mongoose.Schema({
                    userId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User',
                        required: true
                    },
                    userName: {
                        type: String,
                        required: true
                    },
                    userEmail: {
                        type: String,
                        required: true
                    },
                    userAge: {
                        type: Number,
                        required: true
                    },
                    userLocation: {
                        type: String,
                        required: true
                    },
                    userRole: {
                        type: String,
                        required: true
                    },
                    entry: {
                        type: String,
                        required: true
                    },
                    mood: {
                        type: String,
                        default: 'neutral'
                    },
                    riskLevel: {
                        type: String,
                        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                        required: true
                    },
                    riskScore: {
                        type: Number,
                        required: true
                    },
                    triggers: [String],
                    isPrivate: {
                        type: Boolean,
                        default: true
                    },
                    createdAt: {
                        type: Date,
                        default: Date.now
                    }
                });

                const JournalEntry = mongoose.models.JournalEntry || mongoose.model('JournalEntry', journalEntrySchema);

                const journalEntry = new JournalEntry({
                    userId: userInfo.userId,
                    userName: userInfo.name,
                    userEmail: userInfo.email,
                    userAge: userInfo.age,
                    userLocation: userInfo.location,
                    userRole: userInfo.role,
                    entry: entry,
                    mood: mood || 'neutral',
                    riskLevel: riskLevel,
                    riskScore: riskScore,
                    triggers: triggers,
                    isPrivate: isPrivate !== false
                });

                await journalEntry.save();
                console.log('💾 Journal entry saved to database:', {
                    user: userInfo.name,
                    riskLevel: riskLevel,
                    triggers: triggers,
                    entryId: journalEntry._id
                });

            } catch (dbError) {
                console.error('❌ Error saving journal entry to database:', dbError);
            }
        } else if (riskLevel !== 'LOW' && !userInfo) {
            console.log('⚠️ Risk detected but no user info - entry not saved');
        }

        res.json({
            message: 'Assessment completed',
            riskLevel: riskLevel,
            riskScore: riskScore,
            triggers: triggers,
            analysis: getRiskAnalysisMessage(riskLevel, triggers),
            storedInDB: (riskLevel !== 'LOW') && userInfo !== null,
            userIdentified: userInfo !== null
        });

    } catch (error) {
        console.error('❌ Journal error:', error);
        res.status(500).json({ message: 'Error processing journal entry' });
    }
});

// Helper function for risk analysis messages
function getRiskAnalysisMessage(riskLevel, triggers) {
    switch(riskLevel) {
        case 'LOW':
            return 'Your entry appears to be normal. Thank you for sharing your thoughts.';
        case 'MEDIUM':
            return `We noticed some concerning content. Remember, help is available if you need it.`;
        case 'HIGH':
            return `🚨 We detected serious concerns. Our team will review this entry and reach out if needed.`;
        case 'CRITICAL':
            return `🚨 IMMEDIATE ATTENTION NEEDED! Emergency contacts: Childline 1098, Police 100. Our team has been alerted.`;
        default:
            return 'Your entry has been analyzed for potential risk factors.';
    }
}

// ===== PROFESSIONAL ENDPOINTS =====

// Get all professionals with filtering
app.get('/api/professionals', async (req, res) => {
    try {
        const { type, location, specialization, search } = req.query;
        
        let filter = { verified: true }; // Only show verified professionals
        
        if (type) filter.type = type;
        if (location) filter.location = { $regex: location, $options: 'i' };
        if (specialization) filter.specialization = { $regex: specialization, $options: 'i' };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { specialization: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        const professionals = await Professional.find(filter).sort({ rating: -1 });
        
        res.json({
            success: true,
            data: professionals,
            count: professionals.length
        });
        
    } catch (error) {
        console.error('❌ Professionals fetch error:', error);
        res.status(500).json({ success: false, message: 'Error fetching professionals' });
    }
});

// Book appointment
app.post('/api/appointments', async (req, res) => {
    try {
        const { professionalId, userId, date, time, notes } = req.body;
        
        // Validate required fields
        if (!professionalId || !userId || !date || !time) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        // Check if professional exists
        const professional = await Professional.findById(professionalId);
        if (!professional) {
            return res.status(404).json({ success: false, message: 'Professional not found' });
        }
        
        // Check if professional is available
        if (!professional.available) {
            return res.status(400).json({ success: false, message: 'Professional is currently unavailable' });
        }
        
        // Appointment Schema
        const appointmentSchema = new mongoose.Schema({
            professionalId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Professional',
                required: true
            },
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            date: {
                type: Date,
                required: true
            },
            time: {
                type: String,
                required: true
            },
            notes: String,
            status: {
                type: String,
                enum: ['pending', 'confirmed', 'cancelled', 'completed'],
                default: 'pending'
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        });
        
        const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
        
        const appointment = new Appointment({
            professionalId,
            userId,
            date: new Date(date),
            time,
            notes: notes || ''
        });
        
        await appointment.save();
        
        res.json({
            success: true,
            message: 'Appointment booked successfully! You will be contacted soon for confirmation.',
            data: {
                id: appointment._id,
                professionalName: professional.name,
                date: appointment.date,
                time: appointment.time,
                status: appointment.status
            }
        });
        
    } catch (error) {
        console.error('❌ Appointment booking error:', error);
        res.status(500).json({ success: false, message: 'Error booking appointment' });
    }
});

// Get professional by ID
app.get('/api/professionals/:id', async (req, res) => {
    try {
        const professional = await Professional.findById(req.params.id);
        
        if (!professional) {
            return res.status(404).json({ success: false, message: 'Professional not found' });
        }
        
        res.json({
            success: true,
            data: professional
        });
        
    } catch (error) {
        console.error('❌ Professional fetch error:', error);
        res.status(500).json({ success: false, message: 'Error fetching professional' });
    }
});
// ===== ASSESSMENT ENDPOINTS =====
app.post('/api/assessment/submit', async (req, res) => {
    try {
        console.log('📊 Assessment submission received');
        
        const { answers, userInfo, assessmentType } = req.body;

        if (!answers || !userInfo) {
            return res.status(400).json({ message: 'Assessment data is required' });
        }

        // Calculate risk score
        const riskResult = calculateAssessmentRisk(answers, assessmentType);
        
        console.log('📈 Assessment risk calculated:', riskResult);

        // Get authenticated user info
        let authenticatedUser = null;
        try {
            const authHeader = req.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'childguard_secret_2024');
                const user = await User.findById(decoded.userId);
                if (user) {
                    authenticatedUser = {
                        userId: user._id,
                        name: user.name,
                        email: user.email,
                        age: user.age,
                        location: user.location,
                        role: user.role
                    };
                }
            }
        } catch (authError) {
            console.log('🔐 No user authentication for assessment');
        }

        // Store assessment in database (for medium/high/critical risk)
        if ((riskResult.riskLevel === 'MEDIUM' || riskResult.riskLevel === 'HIGH' || riskResult.riskLevel === 'CRITICAL') && authenticatedUser) {
            try {
                // Define assessment schema
                const assessmentSchema = new mongoose.Schema({
                    userId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User',
                        required: true
                    },
                    userName: {
                        type: String,
                        required: true
                    },
                    userEmail: {
                        type: String,
                        required: true
                    },
                    userAge: {
                        type: Number,
                        required: true
                    },
                    userLocation: {
                        type: String,
                        required: true
                    },
                    userRole: {
                        type: String,
                        required: true
                    },
                    assessmentType: {
                        type: String,
                        required: true
                    },
                    answers: {
                        type: Object,
                        required: true
                    },
                    riskScore: {
                        type: Number,
                        required: true
                    },
                    riskLevel: {
                        type: String,
                        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                        required: true
                    },
                    riskFactors: [String],
                    createdAt: {
                        type: Date,
                        default: Date.now
                    }
                });

                const Assessment = mongoose.models.Assessment || mongoose.model('Assessment', assessmentSchema);

                const assessmentEntry = new Assessment({
                    userId: authenticatedUser.userId,
                    userName: authenticatedUser.name,
                    userEmail: authenticatedUser.email,
                    userAge: authenticatedUser.age,
                    userLocation: authenticatedUser.location,
                    userRole: authenticatedUser.role,
                    assessmentType: assessmentType || 'child_safety',
                    answers: answers,
                    riskScore: riskResult.riskScore,
                    riskLevel: riskResult.riskLevel,
                    riskFactors: riskResult.riskFactors
                });

                await assessmentEntry.save();
                console.log('💾 Assessment saved to database:', {
                    user: authenticatedUser.name,
                    riskLevel: riskResult.riskLevel,
                    score: riskResult.riskScore
                });

            } catch (dbError) {
                console.error('❌ Error saving assessment to database:', dbError);
            }
        }

        res.json({
            message: 'Assessment completed successfully',
            riskScore: riskResult.riskScore,
            riskLevel: riskResult.riskLevel,
            riskFactors: riskResult.riskFactors,
            recommendations: getAssessmentRecommendations(riskResult.riskLevel),
            storedInDB: (riskResult.riskLevel !== 'LOW') && authenticatedUser !== null
        });

    } catch (error) {
        console.error('❌ Assessment error:', error);
        res.status(500).json({ message: 'Error processing assessment' });
    }
});

// Risk calculation function
function calculateAssessmentRisk(answers, assessmentType) {
    let totalScore = 0;
    let riskFactors = [];
    
    // Physical safety questions (q1, q2, q3)
    const physicalScores = {
        'never': 0, 'no': 0, 'rarely': 20, 'sometimes': 40, 'often': 60, 'yes': 80
    };
    
    // Emotional safety questions (q4, q5, q6)
    const emotionalScores = {
        'never': 0, 'rarely': 15, 'sometimes': 30, 'often': 50
    };
    
    // Critical safety questions (q7, q8, q9)
    const criticalScores = {
        'no': 0, 'never': 0, 'yes': 80, 'unsure': 40, 'maybe': 30, 'one': 10
    };

    // Calculate scores for each question
    if (answers.q1 && answers.q1 !== 'never') {
        totalScore += physicalScores[answers.q1] || 0;
        if (answers.q1 === 'often') riskFactors.push('Frequent physical harm');
    }
    
    if (answers.q2 && answers.q2 !== 'no') {
        totalScore += physicalScores[answers.q2] || 0;
        if (answers.q2 === 'yes') riskFactors.push('Unexplained injuries');
    }
    
    if (answers.q3 && answers.q3 !== 'never') {
        totalScore += physicalScores[answers.q3] || 0;
        if (answers.q3 === 'often') riskFactors.push('Fear of adults/environment');
    }
    
    if (answers.q4 && answers.q4 !== 'never') {
        totalScore += emotionalScores[answers.q4] || 0;
        if (answers.q4 === 'often') riskFactors.push('Emotional abuse indicators');
    }
    
    if (answers.q5 && answers.q5 !== 'never') {
        totalScore += emotionalScores[answers.q5] || 0;
        if (answers.q5 === 'often') riskFactors.push('Sleep/eating disturbances');
    }
    
    if (answers.q6 && answers.q6 !== 'never') {
        totalScore += emotionalScores[answers.q6] || 0;
        if (answers.q6 === 'often') riskFactors.push('Persistent sadness/anxiety');
    }
    
    if (answers.q7 && answers.q7 !== 'no') {
        totalScore += criticalScores[answers.q7] || 0;
        if (answers.q7 === 'yes') riskFactors.push('Potential sexual abuse');
        if (answers.q7 === 'unsure') riskFactors.push('Uncertain about boundaries');
    }
    
    if (answers.q8 && (answers.q8 === 'maybe' || answers.q8 === 'no')) {
        totalScore += criticalScores[answers.q8] || 0;
        if (answers.q8 === 'no') riskFactors.push('No trusted adult support');
    }
    
    if (answers.q9 && answers.q9 !== 'never') {
        totalScore += physicalScores[answers.q9] || 0;
        if (answers.q9 === 'often') riskFactors.push('Restricted access to care');
    }

    // Determine risk level
    let riskLevel = 'LOW';
    if (totalScore >= 70) riskLevel = 'CRITICAL';
    else if (totalScore >= 50) riskLevel = 'HIGH';
    else if (totalScore >= 25) riskLevel = 'MEDIUM';

    return {
        riskScore: totalScore,
        riskLevel: riskLevel,
        riskFactors: riskFactors
    };
}

// Recommendations based on risk level
function getAssessmentRecommendations(riskLevel) {
    const recommendations = {
        LOW: [
            "Continue maintaining open communication with trusted adults",
            "Practice regular self-care and emotional awareness",
            "Keep using ChildGuard for daily check-ins"
        ],
        MEDIUM: [
            "Consider speaking with a school counselor or trusted adult",
            "Use ChildGuard's journal feature to express feelings",
            "Practice stress-management techniques regularly"
        ],
        HIGH: [
            "Immediately reach out to a trusted adult or professional",
            "Contact Childline (1098) for confidential support",
            "Use emergency resources available in the Professionals section"
        ],
        CRITICAL: [
            "🚨 IMMEDIATE ACTION REQUIRED - Contact emergency services",
            "Call Childline 1098 or Police 100 immediately",
            "Reach out to a trusted adult or teacher right away",
            "Our team has been alerted to provide support"
        ]
    };
    
    return recommendations[riskLevel] || recommendations.LOW;
}

/*// Chatbot route - add this to your server.js
app.post('/api/chat/db-response', async (req, res) => {
    try {
        console.log('🤖 Chatbot request:', req.body.message);
        
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Simple responses for testing
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('pocso')) {
            return res.json({
                response: `📚 POCSO ACT INFORMATION 📚

The Protection of Children from Sexual Offences (POCSO) Act, 2012 is a comprehensive law in India that protects children below 18 years from sexual abuse.

Key Features:
• Special courts for speedy trials
• Child-friendly legal procedures
• Confidentiality of child's identity
• Mandatory reporting requirements
• Strict punishments for offenders

The Act covers various forms of sexual abuse including penetrative and non-penetrative assault.`
            });
        }
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return res.json({
                response: "Hello! I'm your Child Safety assistant. How can I help you today?"
            });
        }

        // Default response
        res.json({
            response: "I understand you're asking about: '" + message + "'. I specialize in child protection topics. You can ask me about POCSO, child safety, or emergency contacts."
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


*/

// ===== SHELTER ENDPOINTS =====

// Get all shelters with filtering
app.get('/api/shelters', async (req, res) => {
    try {
        const { type, location, search } = req.query;
        
        let filter = { verified: true }; // Only show verified shelters
        
        if (type) filter.type = type;
        if (location) filter.location = { $regex: location, $options: 'i' };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        const shelters = await Shelter.find(filter).sort({ currentOccupancy: 1 }); // Sort by availability
        
        res.json({
            success: true,
            data: shelters,
            count: shelters.length
        });
        
    } catch (error) {
        console.error('❌ Shelters fetch error:', error);
        res.status(500).json({ success: false, message: 'Error fetching shelters' });
    }
});

// Get shelter by ID
app.get('/api/shelters/:id', async (req, res) => {
    try {
        const shelter = await Shelter.findById(req.params.id);
        
        if (!shelter) {
            return res.status(404).json({ success: false, message: 'Shelter not found' });
        }
        
        res.json({
            success: true,
            data: shelter
        });
        
    } catch (error) {
        console.error('❌ Shelter fetch error:', error);
        res.status(500).json({ success: false, message: 'Error fetching shelter' });
    }
});
// ===== TEMPORARY DEBUG ROUTES =====
app.get('/api/debug-test', (req, res) => {
    res.json({ 
        message: 'Debug test route is working!',
        timestamp: new Date(),
        professionalModel: typeof Professional
    });
});

app.get('/api/debug-professionals-count', async (req, res) => {
    try {
        const count = await Professional.countDocuments();
        res.json({
            success: true,
            professionalCount: count,
            hasData: count > 0
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});
// ===== TEST ENDPOINTS =====
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Backend is working!',
        timestamp: new Date()
    });
});

app.get('/api/auth/test', (req, res) => {
    res.json({ 
        message: 'Auth endpoint is working!',
        timestamp: new Date()
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        message: 'Endpoint not found',
        availableEndpoints: [
            'POST /api/auth/signup',
            'POST /api/auth/login', 
            'POST /api/journal/entry',
            'POST /api/assessment/submit',
            'POST /api/chat/db-response',
            'GET  /api/professionals',
            'GET  /api/professionals/:id',
            'POST /api/appointments',
            'GET  /api/test',
            'GET  /api/health'
        ]
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Available endpoints:`);
    console.log(`   POST http://localhost:${PORT}/api/auth/signup`);
    console.log(`   POST http://localhost:${PORT}/api/auth/login`);
    console.log(`   POST http://localhost:${PORT}/api/journal/entry`);
    console.log(`   POST http://localhost:${PORT}/api/assessment/submit`);
    console.log(`   POST http://localhost:${PORT}/api/chat/db-response`);
    console.log(`   GET  http://localhost:${PORT}/api/professionals`);
    console.log(`   POST http://localhost:${PORT}/api/appointments`);
    console.log(`   GET  http://localhost:${PORT}/api/professionals/:id`);
    console.log(`   GET  http://localhost:${PORT}/api/test`);
});