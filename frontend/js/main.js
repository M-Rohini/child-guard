// Global variables
let currentUser = null;

// Check authentication status
function checkAuthStatus() {
    try {
        const user = localStorage.getItem('safeguard_user') || localStorage.getItem('userData');
        const token = localStorage.getItem('safeguard_token') || localStorage.getItem('userToken');
        
        if (user && token) {
            currentUser = JSON.parse(user);
            return true;
        }
        return false;
    } catch (error) {
        console.log('Auth check error:', error);
        return false;
    }
}

// Update navigation based on auth
function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const welcomeText = document.getElementById('welcomeText');
    
    if (currentUser) {
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';
        if (userName) userName.textContent = currentUser.name;
        if (welcomeText) welcomeText.textContent = `Welcome, ${currentUser.name}!`;
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// SINGLE LOGOUT FUNCTION
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear ALL stored user data
        localStorage.removeItem('safeguard_user');
        localStorage.removeItem('safeguard_token');
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        currentUser = null;
        
        // Redirect to login page
        window.location.href = 'index.html';
    }
}

// Show emergency help
function showEmergencyHelp() {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:2000;display:flex;justify-content:center;align-items:center;">
            <div style="background:white;padding:2rem;border-radius:15px;max-width:500px;width:90%;text-align:center;">
                <h2 style="color:#e74c3c;">🚨 Emergency Help</h2>
                <div style="display:grid;gap:1rem;margin:2rem 0;">
                    <a href="tel:100" style="background:#e74c3c;color:white;padding:1rem;border-radius:8px;text-decoration:none;">📞 Police: 100</a>
                    <a href="tel:1098" style="background:#3498db;color:white;padding:1rem;border-radius:8px;text-decoration:none;">📞 Childline: 1098</a>
                    <a href="tel:181" style="background:#9b59b6;color:white;padding:1rem;border-radius:8px;text-decoration:none;">📞 Women Helpline: 181</a>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background:#667eea;color:white;border:none;padding:0.75rem 2rem;border-radius:8px;cursor:pointer;">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Contact form handling
function submitContactForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = {
        name: form.querySelector('input[type="text"]').value,
        email: form.querySelector('input[type="email"]').value,
        subject: form.querySelector('select').value,
        message: form.querySelector('textarea').value
    };
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        alert('Please fill in all fields');
        return;
    }
    
    // Simulate form submission
    console.log('Contact form submitted:', formData);
    
    // Show success message
    alert('Thank you for your message! We will get back to you soon.');
    
    // Reset form
    form.reset();
}

// Initialize app - FIXED VERSION
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏁 Page loaded:', window.location.pathname);
    
    // Check authentication status
    const isAuthenticated = checkAuthStatus();
    
    // Get current page name
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    console.log('📄 Current page:', currentPage);
    
    // Define PROTECTED pages (require login) - only core features
    const protectedPages = ['dashboard', 'journal', 'assessment', 'professionals', 'shelters'];
    
    // Define PUBLIC pages (accessible to everyone) - information pages
    const publicPages = ['index', 'login', 'signup', 'resources', 'contact', 'funding'];
    
    // If trying to access protected page without login → redirect to index
    if (protectedPages.includes(currentPage) && !isAuthenticated) {
        console.log('🔒 Redirecting to index - protected page without auth');
        window.location.href = 'index.html';
        return;
    }
    
    // If already logged in and trying to access login/signup → redirect to dashboard
    if (isAuthenticated && (currentPage === 'login' || currentPage === 'signup')) {
        console.log('🔑 Redirecting to dashboard - already logged in');
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Public pages (resources, contact, funding) → ALWAYS accessible to everyone
    // No redirect needed for public pages
    
    // Update UI
    updateAuthUI();
    console.log('✅ Page initialization complete - Access granted');
});