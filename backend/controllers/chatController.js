const FAQ = require('../models/FAQ');

exports.chatResponse = async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log('\n🔍 === NEW CHAT REQUEST ===');
        console.log('📝 User message:', message);

        const lowerMessage = message.toLowerCase().trim();

        // 1. Handle greetings - FIXED: Only match exact greetings
        if (isExactGreeting(lowerMessage)) {
            console.log('✅ Identified as greeting');
            return res.json({ 
                response: "Hello! I'm your Safe-Guard assistant. I can help you with:\n• Child safety information\n• POCSO laws\n• Emergency contacts\n• Professional resources\n• Abuse reporting\n\nHow can I assist you today?" 
            });
        }

        // 2. Handle emergency keywords
        if (isEmergency(lowerMessage)) {
            console.log('🚨 Identified as emergency');
            return res.json({
                response: "🚨 EMERGENCY HELP 🚨\n\nImmediate Assistance:\n• Police: 100\n• Childline: 1098\n• Women Helpline: 181\n• Emergency Services: 108\n\nIf you're in immediate danger:\n1. Call emergency services\n2. Go to a safe place\n3. Contact a trusted adult"
            });
        }

        // 3. DATABASE SEARCH - FIXED: This will now run for non-greeting messages
        console.log('📊 Searching database for:', message);
        
        let faqMatch = null;

        // Strategy 1: Exact or partial match in question
        faqMatch = await FAQ.findOne({
            $or: [
                { question: { $regex: `^${message}$`, $options: 'i' } },
                { question: { $regex: message, $options: 'i' } }
            ]
        });

        // Strategy 2: Keyword matching in question
        if (!faqMatch) {
            const keywords = extractImportantKeywords(lowerMessage);
            console.log('🔑 Important keywords:', keywords);
            
            if (keywords.length > 0) {
                for (const keyword of keywords) {
                    faqMatch = await FAQ.findOne({
                        question: { $regex: keyword, $options: 'i' }
                    });
                    if (faqMatch) break;
                }
            }
        }

        // Strategy 3: Search in tags
        if (!faqMatch) {
            const keywords = extractImportantKeywords(lowerMessage);
            if (keywords.length > 0) {
                for (const keyword of keywords) {
                    faqMatch = await FAQ.findOne({
                        tags: { $in: [new RegExp(keyword, 'i')] }
                    });
                    if (faqMatch) break;
                }
            }
        }

        // Strategy 4: Search in answer
        if (!faqMatch) {
            const keywords = extractImportantKeywords(lowerMessage);
            if (keywords.length > 0) {
                for (const keyword of keywords) {
                    faqMatch = await FAQ.findOne({
                        answer: { $regex: keyword, $options: 'i' }
                    });
                    if (faqMatch) break;
                }
            }
        }

        if (faqMatch) {
            console.log('✅ Database match found:', faqMatch.question);
            return res.json({ 
                response: faqMatch.answer
            });
        }

        console.log('❌ No database match found');

        // 4. Keyword-based responses for specific topics
        const keywordResponse = getTopicResponse(lowerMessage);
        if (keywordResponse) {
            console.log('✅ Using topic-based response');
            return res.json({ 
                response: keywordResponse
            });
        }

        // 5. Final fallback
        console.log('⚠️ Using general fallback');
        res.json({ 
            response: "I understand you're asking about: \"" + message + "\". I specialize in child protection topics. You can ask me about:\n\n• How to file complaints\n• Child abuse reporting\n• Emergency contacts\n• POCSO Act information\n• Child safety guidelines\n\nCould you try rephrasing your question?"
        });

    } catch (error) {
        console.error('❌ Chat error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ===== FIXED HELPER FUNCTIONS =====

// FIXED: Only match exact greetings, not partial matches
function isExactGreeting(message) {
    const exactGreetings = [
        'hi', 'hello', 'hey', 'greetings', 
        'good morning', 'good afternoon', 'good evening',
        'hi there', 'hello there'
    ];
    
    // Check if the entire message is a greeting (not just contains greeting words)
    return exactGreetings.includes(message);
}

function extractImportantKeywords(message) {
    const stopWords = ['what', 'is', 'the', 'a', 'an', 'how', 'to', 'do', 'does', 'can', 'could', 'would', 'should', 'when', 'where', 'why', 'who', 'which', 'about', 'procedure'];
    
    return message.split(/\s+/)
        .filter(word => word.length > 2) // Reduced to 2 characters to catch "abuse", "1098", etc.
        .filter(word => !stopWords.includes(word.toLowerCase()))
        .map(word => word.replace(/[^\w]/g, ''));
}

function getTopicResponse(message) {
    const topicMap = {
        'complain': `📝 HOW TO FILE A COMPLAINT 📝

To file a complaint about child-related issues:

Immediate Actions:
• Call Childline: 1098 (24/7 free service)
• Contact local police: 100
• Visit nearest child welfare committee

Required Information:
• Details of the incident
• Date and time
• Persons involved
• Any evidence available`,

        'violence': `🚫 REPORTING CHILD VIOLENCE 🚫

If you witness or suspect child violence:

Urgent Steps:
1. Ensure child's immediate safety
2. Call 1098 or 100 immediately
3. Do not confront the alleged perpetrator
4. Preserve any evidence

Legal Protection:
• POCSO Act provides strong legal framework
• Confidentiality maintained
• Special courts for speedy justice`,

        'abuse': `🛡️ REPORTING CHILD ABUSE 🛡️

Child abuse reporting channels:

Immediate Help:
• Childline: 1098
• Police: 100
• Women Helpline: 181

Additional Support:
• School authorities
• Child Welfare Committee
• NGOs specializing in child protection

Remember: Early reporting saves lives.`,

        '1098': `📞 CHILDLINE 1098 📞

Childline 1098 is a 24/7 emergency helpline for children in need of care and protection.

Services provided:
• Emergency intervention
• Counseling support
• Rehabilitation services
• Legal assistance
• Medical help

Call 1098 anytime - it's free and confidential!`,

        'pocso': `📚 POCSO ACT INFORMATION 📚

The Protection of Children from Sexual Offences (POCSO) Act, 2012:

Key Features:
• Protects children under 18 years
• Child-friendly legal procedures
• Special courts for speedy trials
• Confidentiality of child's identity
• Mandatory reporting requirements

The Act covers various forms of sexual abuse including penetrative, non-penetrative assault, and sexual harassment.`
    };

    // Check for exact keyword matches
    for (const [keyword, response] of Object.entries(topicMap)) {
        if (message.includes(keyword)) {
            return response;
        }
    }

    return null;
}

function isEmergency(message) {
    const emergencyKeywords = ['emergency', 'help', 'urgent', 'danger', 'save me', 'immediate', '911'];
    const emergencyContext = ['hurt', 'abuse', 'scared', 'afraid', 'unsafe', 'threat', 'suicide', 'kill'];
    
    const hasEmergencyWord = emergencyKeywords.some(keyword => message.includes(keyword));
    const hasEmergencyContext = emergencyContext.some(context => message.includes(context));
    
    return hasEmergencyWord || hasEmergencyContext;
}