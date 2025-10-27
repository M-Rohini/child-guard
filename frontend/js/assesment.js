let currentQuestion = 1;
const totalQuestions = 3;
let assessmentAnswers = {};


// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Assessment page loaded - SIMPLE VERSION');
    showQuestion(1);
});

function showQuestion(questionNum) {
    console.log('Showing question:', questionNum);
    
    // Hide all questions
    for (let i = 1; i <= totalQuestions; i++) {
        const question = document.getElementById('question' + i);
        if (question) {
            question.style.display = 'none';
        }
    }
    
    // Show the current question
    const currentQ = document.getElementById('question' + questionNum);
    if (currentQ) {
        currentQ.style.display = 'block';
    }
    
    currentQuestion = questionNum;
    updateNavigationButtons();
}

function nextQuestion() {
    console.log('➡️ NEXT button clicked - Current question:', currentQuestion);
    
    // Check if current question is answered
    if (!isCurrentQuestionAnswered()) {
        alert('Please answer all questions in this section before continuing.');
        return;
    }
    
    // Save answers
    saveCurrentAnswers();
    
    if (currentQuestion < totalQuestions) {
        showQuestion(currentQuestion + 1);
    }
}

function previousQuestion() {
    console.log('⬅️ PREVIOUS button clicked - Current question:', currentQuestion);
    
    // Save answers
    saveCurrentAnswers();
    
    if (currentQuestion > 1) {
        showQuestion(currentQuestion - 1);
    }
}

function isCurrentQuestionAnswered() {
    // Get all question names in current section
    let questionNames = [];
    
    if (currentQuestion === 1) {
        questionNames = ['q1', 'q2', 'q3'];
    } else if (currentQuestion === 2) {
        questionNames = ['q4', 'q5', 'q6'];
    } else if (currentQuestion === 3) {
        questionNames = ['q7', 'q8', 'q9'];
    }
    
    // Check if all are answered
    for (let name of questionNames) {
        const answered = document.querySelector(`input[name="${name}"]:checked`);
        if (!answered) {
            // Highlight the unanswered question
            const questionElement = document.querySelector(`input[name="${name}"]`).closest('.question');
            questionElement.style.background = '#fff3cd';
            questionElement.style.borderLeftColor = '#ffc107';
            
            setTimeout(() => {
                questionElement.style.background = '';
                questionElement.style.borderLeftColor = '';
            }, 2000);
            
            return false;
        }
    }
    
    return true;
}

function saveCurrentAnswers() {
    // Save all radio inputs that are checked
    const allChecked = document.querySelectorAll('input[type="radio"]:checked');
    allChecked.forEach(input => {
        assessmentAnswers[input.name] = input.value;
    });
    console.log('💾 Saved answers:', assessmentAnswers);
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    console.log('🔄 Updating buttons for question', currentQuestion);
    
    // Previous button - show if not on first question
    if (prevBtn) {
        prevBtn.style.display = currentQuestion > 1 ? 'inline-block' : 'none';
    }
    
    // Next/Submit buttons
    if (nextBtn && submitBtn) {
        if (currentQuestion === totalQuestions) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            submitBtn.style.display = 'none';
        }
    }
}

// SUBMIT ASSESSMENT - KEEP YOUR EXISTING FUNCTION
async function submitAssessment() {
    console.log('🚀 Submitting assessment...');
    
    // Save final answers
    saveCurrentAnswers();
    
    // Validate all questions
    const requiredQuestions = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'];
    const unanswered = requiredQuestions.filter(q => !assessmentAnswers[q]);
    
    if (unanswered.length > 0) {
        alert(`Please answer all questions. You missed: ${unanswered.join(', ')}`);
        return;
    }

    try {
        const token = localStorage.getItem('safeguard_token');
        const user = JSON.parse(localStorage.getItem('safeguard_user') || '{}');
        
        // Show loading
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.innerHTML = 'Submitting...';
        submitBtn.disabled = true;
        
        const response = await fetch('http://localhost:5000/api/assessment/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                answers: assessmentAnswers,
                userInfo: user,
                assessmentType: 'child_safety'
            })
        });

        const data = await response.json();
        console.log('📊 Assessment result:', data);

        if (response.ok) {
            showAssessmentResults(data);
        } else {
            alert('Error: ' + data.message);
            submitBtn.innerHTML = 'Submit Assessment';
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('💥 Error:', error);
        alert('Network error: ' + error.message);
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.innerHTML = 'Submit Assessment';
        submitBtn.disabled = false;
    }
}

function showAssessmentResults(data) {
    document.getElementById('assessmentForm').style.display = 'none';
    const resultsDiv = document.getElementById('assessmentResults');
    const resultContent = document.getElementById('resultContent');
    const resultAlert = document.getElementById('resultAlert');
    
    // Set alert color
    resultAlert.className = 'alert';
    switch(data.riskLevel) {
        case 'CRITICAL': resultAlert.classList.add('alert-danger'); break;
        case 'HIGH': resultAlert.classList.add('alert-warning'); break;
        case 'MEDIUM': resultAlert.classList.add('alert-info'); break;
        case 'LOW': resultAlert.classList.add('alert-success'); break;
    }
    
    let resultsHTML = `
        <div class="risk-score">
            <h4>Risk Level: <span class="risk-${data.riskLevel.toLowerCase()}">${data.riskLevel}</span></h4>
            <p>Assessment Score: <strong>${data.riskScore}/100</strong></p>
        </div>
    `;
    
    if (data.riskFactors && data.riskFactors.length > 0) {
        resultsHTML += `
            <div class="risk-factors">
                <h5>Identified Concerns:</h5>
                <ul>
                    ${data.riskFactors.map(factor => `<li>${factor}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    resultsHTML += `
        <div class="recommendations">
            <h5>Recommendations:</h5>
            <ul>
                ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        
        <div class="assessment-meta">
            <p><small>Assessment completed on ${new Date().toLocaleDateString()}</small></p>
            ${data.storedInDB ? '<p><small>✓ Your assessment has been securely recorded</small></p>' : ''}
        </div>
    `;
    
    resultContent.innerHTML = resultsHTML;
    resultsDiv.style.display = 'block';
}

function showEmergencyHelp() {
    alert('🚨 EMERGENCY CONTACTS:\n\n• Childline: 1098\n• Police: 100\n• Ambulance: 108\n\nPlease reach out immediately if you are in danger!');
}

function retakeAssessment() {
    // Reset everything
    currentQuestion = 1;
    assessmentAnswers = {};
    
    // Clear all radio buttons
    document.querySelectorAll('input[type="radio"]').forEach(input => {
        input.checked = false;
    });
    
    // Show first question, hide results
    document.getElementById('assessmentResults').style.display = 'none';
    document.getElementById('assessmentForm').style.display = 'block';
    showQuestion(1);
}