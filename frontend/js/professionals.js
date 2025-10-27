async function searchProfessionals() {
    try {
        const professionType = document.getElementById('professionType').value;
        const location = document.getElementById('professionalsLocation').value;
        const specialization = document.getElementById('specialization').value;
        
        console.log('🔍 Search filters:', { professionType, location, specialization });
        
        // Build query parameters
        const params = new URLSearchParams();
        if (professionType) params.append('type', professionType);
        if (location) params.append('location', location);
        if (specialization) params.append('specialization', specialization);
        
        showLoading(true);
        
        // ✅ FIX: Use absolute URL like journal.js does
        const apiUrl = `http://localhost:5000/api/professionals?${params}`;
        console.log('🌐 API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📊 API response:', result);
        
        if (result.success) {
            displayProfessionals(result.data);
        } else {
            throw new Error(result.message || 'Unknown API error');
        }
        
    } catch (error) {
        console.error('❌ Error fetching professionals:', error);
        showError('Failed to load professionals: ' + error.message);
    } finally {
        showLoading(false);
    }
}
function displayProfessionals(professionals) {
    const resultsContainer = document.getElementById('professionalsResults');
    
    if (!professionals || professionals.length === 0) {
        resultsContainer.innerHTML = `
            <div style="text-align: center; grid-column: 1/-1; padding: 3rem;">
                <h3>No professionals found</h3>
                <p>Try adjusting your search filters or check back later.</p>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = professionals.map(prof => `
        <div class="resource-card">
            <div class="professional-header">
                <h4>${prof.name}</h4>
                <span class="verification-badge">✓ Verified</span>
            </div>
            
            <div class="resource-details">
                <p><strong>Type:</strong> ${capitalizeFirst(prof.type.replace('_', ' '))}</p>
                <p><strong>Specialization:</strong> ${prof.specialization}</p>
                <p><strong>Location:</strong> ${prof.location}</p>
                <p><strong>Experience:</strong> ${prof.experience}</p>
                <p><strong>Consultation Fee:</strong> ${prof.cost}</p>
                
                <div class="rating">
                    ${generateStars(prof.rating)} 
                    <span class="rating-text">(${prof.rating})</span>
                </div>
                
                ${prof.description ? `<p class="professional-description">${prof.description}</p>` : ''}
                
                ${prof.qualifications && prof.qualifications.length > 0 ? `
                    <p><strong>Qualifications:</strong> ${prof.qualifications.join(', ')}</p>
                ` : ''}
                
                ${prof.languages && prof.languages.length > 0 ? `
                    <p><strong>Languages:</strong> ${prof.languages.join(', ')}</p>
                ` : ''}
                
                <p><strong>Status:</strong> 
                    <span class="availability ${prof.available ? 'available' : 'unavailable'}">
                        ${prof.available ? 'Available' : 'Currently Unavailable'}
                    </span>
                </p>
            </div>
            
            <div class="professional-actions">
                <button class="btn ${prof.available ? 'btn-primary' : 'btn-secondary'}" 
                        onclick="bookAppointment('${prof._id}')" 
                        ${!prof.available ? 'disabled' : ''}>
                    ${prof.available ? 'Book Appointment' : 'Currently Unavailable'}
                </button>
                
                ${prof.available ? `
                    <button class="btn btn-outline" onclick="viewProfessionalDetails('${prof._id}')">
                        View Details
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

async function bookAppointment(professionalId) {
    try {
        // Check if user is logged in
        const token = localStorage.getItem('userToken') || localStorage.getItem('safeguard_token');
        if (!token) {
            alert('Please login to book appointments');
            window.location.href = 'index.html';
            return;
        }
        
        // Get user data
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData) {
            alert('Please login again');
            window.location.href = 'index.html';
            return;
        }
        
        // For now, show a simple booking form
        const date = prompt('Enter preferred date (YYYY-MM-DD):');
        const time = prompt('Enter preferred time (HH:MM):');
        const notes = prompt('Any additional notes:');
        
        if (!date || !time) {
            alert('Date and time are required');
            return;
        }
        
        const appointmentData = {
            professionalId: professionalId,
            userId: userData.id,
            date: date,
            time: time,
            notes: notes || ''
        };
        
        // ✅ FIX: Use absolute URL like journal.js
        const response = await fetch('http://localhost:5000/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(appointmentData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Appointment booked successfully! You will be contacted soon for confirmation.');
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Booking error:', error);
        alert('Failed to book appointment: ' + error.message);
    }
}

function viewProfessionalDetails(professionalId) {
    // For now, show a simple details view
    alert('Professional details feature coming soon!');
}

function showLoading(show) {
    const resultsContainer = document.getElementById('professionalsResults');
    if (show) {
        resultsContainer.innerHTML = `
            <div style="text-align: center; grid-column: 1/-1; padding: 2rem;">
                <div class="loading-spinner"></div>
                <p>Loading professionals...</p>
            </div>
        `;
    }
}

function showError(message) {
    const resultsContainer = document.getElementById('professionalsResults');
    resultsContainer.innerHTML = `
        <div style="text-align: center; grid-column: 1/-1; padding: 2rem; color: #e74c3c;">
            <h3>Error</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="searchProfessionals()">Try Again</button>
        </div>
    `;
}

// Utility functions
function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return '⭐'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
}

// Load professionals when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load all professionals initially
    searchProfessionals();
});