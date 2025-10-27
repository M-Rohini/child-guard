let currentMood = 'neutral';

// Temporary authentication setup for testing
function ensureAuthToken() {
    if (!localStorage.getItem('safeguard_token')) {
        const mockToken = 'test_token_123';
        localStorage.setItem('safeguard_token', mockToken);
        console.log('🔑 Temporary auth token created');
    }
}

function initJournal() {
    // Setup mood buttons
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentMood = e.target.dataset.mood;
            console.log('😊 Mood set to:', currentMood);
        });
    });

    // Setup save button
    document.getElementById('saveJournal').addEventListener('click', saveJournalEntry);
    
    // Ensure auth token
    ensureAuthToken();
}

async function saveJournalEntry() {
    console.log('🎯 Save button clicked!');
    
    const entryText = document.getElementById('journalEntry').value.trim();
    const isPrivate = document.getElementById('journalPrivate').checked;

    if (!entryText) {
        alert('Please write something in your journal entry');
        return;
    }

    try {
        const token = localStorage.getItem('safeguard_token');
        if (!token) {
            alert('❌ Please login first');
            return;
        }
        
        console.log('📤 Sending journal entry to backend...');
        const response = await fetch('http://localhost:5000/api/journal/entry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                entry: entryText,
                mood: currentMood,
                isPrivate: isPrivate
            })
        });

        const data = await response.json();
        console.log('📦 Server response:', data);

        if (response.ok) {
            // Show appropriate message based on risk level
            if (data.riskLevel === 'LOW' || data.riskLevel === 'MEDIUM') {
                alert('✅ ' + data.analysis);
            } else {
                alert('🚨 ' + data.analysis);
                
                // Additional alert for critical entries
                if (data.riskLevel === 'CRITICAL') {
                    setTimeout(() => {
                        alert('💝 Remember: You are not alone. Help is available 24/7. Childline: 1098');
                    }, 1000);
                }
            }
            
            // Clear the textarea
            document.getElementById('journalEntry').value = '';
            
            // Show risk analysis on the page
            showRiskAnalysis(data);
            
        } else {
            alert('❌ Error: ' + data.message);
        }
    } catch (error) {
        console.error('💥 Error:', error);
        alert('❌ Network error: ' + error.message);
    }
}

function showRiskAnalysis(data) {
    const riskLevelDiv = document.getElementById('riskLevel');
    const feedbackDiv = document.getElementById('riskFeedback');
    const resultsDiv = document.getElementById('journalResults');
    
    if (riskLevelDiv && feedbackDiv && resultsDiv) {
        riskLevelDiv.textContent = data.riskLevel + ' Risk';
        riskLevelDiv.className = 'risk-' + data.riskLevel.toLowerCase();
        
        // Use the analysis from backend
        feedbackDiv.textContent = data.analysis;
        
        // Show the results section
        resultsDiv.style.display = 'block';
        
        console.log('📊 Risk analysis displayed:', data.riskLevel);
    }
}

function getRiskFeedback(riskLevel) {
    switch(riskLevel) {
        case 'LOW':
            return 'Your entry appears to be normal. Keep expressing your thoughts!';
        case 'MEDIUM':
            return 'We noticed some concerning content. Remember, help is available if you need it.';
        case 'HIGH':
            return 'We detected concerning content. Please consider reaching out to a trusted adult.';
        case 'CRITICAL':
            return '🚨 Please reach out for help immediately. Emergency contacts: Childline 1098, Police 100';
        default:
            return 'Your entry has been analyzed for potential risk factors.';
    }
}

// Initialize when journal page loads
if (window.location.pathname.includes('journal.html')) {
    document.addEventListener('DOMContentLoaded', initJournal);
}