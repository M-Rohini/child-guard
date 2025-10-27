// Chatbot functionality
let chatbotOpen = false;
let unreadMessages = 0;

function toggleChatbot() {
    const minimized = document.getElementById('chatbotMinimized');
    const expanded = document.getElementById('chatbotExpanded');
    const notification = document.getElementById('chatbotNotification');
    
    chatbotOpen = !chatbotOpen;
    
    if (chatbotOpen) {
        if (minimized) minimized.style.display = 'none';
        if (expanded) expanded.style.display = 'flex';
        unreadMessages = 0;
        if (notification) notification.style.display = 'none';
        const input = document.getElementById('chatbotInput');
        if (input) input.focus();
    } else {
        if (minimized) minimized.style.display = 'flex';
        if (expanded) expanded.style.display = 'none';
    }
}

function handleChatbotKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatbotMessage();
    }
}

async function sendChatbotMessage() {
    const input = document.getElementById('chatbotInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatbotMessage(message, 'user');
    input.value = '';
    
    showChatbotTyping();
    
    try {
        console.log('📤 Sending message to server:', message);
        
        const response = await fetch('http://localhost:5000/api/chat/db-response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📥 Received response from server:', data);
        
        hideChatbotTyping();
        
        if (data.error) {
            addChatbotMessage("Sorry, I encountered an error. Please try again.", 'bot');
        } else {
            addChatbotMessage(data.response, 'bot');
        }
        
    } catch (error) {
        console.error('❌ Chatbot error:', error);
        hideChatbotTyping();
        addChatbotMessage("I'm having trouble connecting to the server. Please check if the backend is running on port 5000.", 'bot');
    }
}

function addChatbotMessage(message, sender) {
    const messagesContainer = document.getElementById('chatbotMessages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    // Convert line breaks to HTML
    const formattedMessage = message.replace(/\n/g, '<br>');
    
    messageDiv.innerHTML = `
        <div class="message-content">${formattedMessage}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    if (!chatbotOpen && sender === 'bot') {
        unreadMessages++;
        const notification = document.getElementById('chatbotNotification');
        if (notification) {
            notification.textContent = unreadMessages;
            notification.style.display = 'flex';
        }
    }
}

function showChatbotTyping() {
    const messagesContainer = document.getElementById('chatbotMessages');
    if (!messagesContainer) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.id = 'chatbotTyping';
    typingDiv.className = 'message bot-message';
    typingDiv.innerHTML = `
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideChatbotTyping() {
    const typingDiv = document.getElementById('chatbotTyping');
    if (typingDiv) {
        typingDiv.remove();
    }
}

// Quick response buttons - Updated to match your FAQ
function setupQuickResponses() {
    const quickResponses = [
        "What is POCSO?",
        "How to report abuse?",
        "Child safety tips",
        "Emergency contacts",
        "Good touch and bad touch",
        "Legal rights of children",
        "Child protection laws"
    ];
    
    const quickResponsesContainer = document.getElementById('quickResponses');
    if (quickResponsesContainer) {
        quickResponsesContainer.innerHTML = ''; // Clear existing
        quickResponses.forEach(response => {
            const button = document.createElement('button');
            button.className = 'quick-response-btn';
            button.textContent = response;
            button.onclick = () => {
                const input = document.getElementById('chatbotInput');
                if (input) {
                    input.value = response;
                    sendChatbotMessage();
                }
            };
            quickResponsesContainer.appendChild(button);
        });
    }
}

// Close chatbot when clicking outside
function setupClickOutsideListener() {
    document.addEventListener('click', function(event) {
        const chatbotContainer = document.getElementById('chatbotContainer');
        
        if (chatbotOpen && chatbotContainer && !chatbotContainer.contains(event.target)) {
            toggleChatbot();
        }
    });
}

// Initialize chatbot when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🤖 Chatbot initialized');
    setupQuickResponses();
    setupClickOutsideListener();
});