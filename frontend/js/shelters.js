// shelters.js - Updated to fetch from database
async function searchShelters() {
    try {
        const location = document.getElementById('shelterFilterLocation').value;
        const shelterType = document.getElementById('shelterType').value;
        
        console.log('🔍 Shelter search filters:', { location, shelterType });
        
        // Build query parameters
        const params = new URLSearchParams();
        if (location) params.append('location', location);
        if (shelterType) params.append('type', shelterType);
        
        showLoading(true);
        
        // Use absolute URL like other working pages
        const apiUrl = `http://localhost:5000/api/shelters?${params}`;
        console.log('🌐 API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📊 API response:', result);
        
        if (result.success) {
            displayShelters(result.data);
        } else {
            throw new Error(result.message || 'Unknown API error');
        }
        
    } catch (error) {
        console.error('❌ Error fetching shelters:', error);
        showError('Failed to load shelters: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function displayShelters(shelters) {
    const container = document.getElementById('sheltersResults');
    
    if (!shelters || shelters.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; grid-column: 1/-1; padding: 3rem;">
                <h3>No shelters found</h3>
                <p>Try adjusting your search filters or check back later.</p>
                <button class="btn btn-primary" onclick="searchShelters()">Try Again</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = shelters.map(shelter => `
        <div class="resource-card">
            <div class="shelter-header">
                <h4>${shelter.name}</h4>
                <span class="verification-badge">✓ Verified</span>
            </div>
            
            <div class="resource-details">
                <p><strong>Type:</strong> ${formatShelterType(shelter.type)}</p>
                <p><strong>Location:</strong> ${shelter.location}</p>
                <p><strong>Address:</strong> ${shelter.address}</p>
                <p><strong>Contact:</strong> ${shelter.contact}</p>
                <p><strong>Capacity:</strong> ${shelter.currentOccupancy}/${shelter.capacity}</p>
                
                ${shelter.description ? `<p class="shelter-description">${shelter.description}</p>` : ''}
                
                ${shelter.services && shelter.services.length > 0 ? `
                    <p><strong>Services:</strong> ${shelter.services.join(', ')}</p>
                ` : ''}
                
                <div class="availability-indicator">
                    <strong>Availability:</strong> 
                    <span class="availability ${shelter.currentOccupancy < shelter.capacity ? 'available' : 'full'}">
                        ${shelter.currentOccupancy < shelter.capacity ? 'Spaces Available' : 'Currently Full'}
                    </span>
                </div>
            </div>
            
            <div class="shelter-actions">
                <button class="btn btn-primary" onclick="contactShelter('${shelter.contact}')">
                    📞 Contact Now
                </button>
                <button class="btn btn-outline" onclick="viewShelterDetails('${shelter._id}')">
                    View Details
                </button>
            </div>
        </div>
    `).join('');
}

function contactShelter(phone) {
    if (confirm(`Call ${phone}?`)) {
        window.open(`tel:${phone}`);
    }
}

function viewShelterDetails(shelterId) {
    alert('Shelter details feature coming soon! Shelter ID: ' + shelterId);
}

function formatShelterType(type) {
    const typeMap = {
        'emergency': 'Emergency Shelter',
        'long_term': 'Long-term Care',
        'family': 'Family Services'
    };
    return typeMap[type] || type;
}

function showLoading(show) {
    const resultsContainer = document.getElementById('sheltersResults');
    if (show) {
        resultsContainer.innerHTML = `
            <div style="text-align: center; grid-column: 1/-1; padding: 2rem;">
                <div class="loading-spinner"></div>
                <p>Loading shelters...</p>
            </div>
        `;
    }
}

function showError(message) {
    const resultsContainer = document.getElementById('sheltersResults');
    resultsContainer.innerHTML = `
        <div style="text-align: center; grid-column: 1/-1; padding: 2rem; color: #e74c3c;">
            <h3>Error</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="searchShelters()">Try Again</button>
        </div>
    `;
}

// Load shelters when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 Shelters page loaded');
    searchShelters();
});