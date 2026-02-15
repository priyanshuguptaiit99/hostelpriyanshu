// Automatically detect API URL based on environment
// For local development, use the port from window.location or default to 3000
const getApiUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Local development - use same port as frontend
        const port = window.location.port || '3000';
        return `http://${window.location.hostname}:${port}/api`;
    } else {
        // Production (Render) - use same origin
        return `${window.location.origin}/api`;
    }
};

const API_URL = getApiUrl();

let currentUser = null;
let authToken = null;

// Expose to window for cross-file access
window.currentUser = currentUser;
window.authToken = authToken;

console.log('App.js loading...'); // Debug log
console.log('API_URL:', API_URL); // Debug: Show which API URL is being used
console.log('Environment:', window.location.hostname === 'localhost' ? 'LOCAL' : 'PRODUCTION'); // Debug

// Check if user is logged in
function checkAuth() {
    authToken = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (authToken && user) {
        currentUser = JSON.parse(user);
        window.currentUser = currentUser;
        window.authToken = authToken;
        showDashboard();
    } else {
        showAuth();
    }
}

// Helper function to update auth state from other files
function updateAuthState(token, user) {
    authToken = token;
    currentUser = user;
    window.authToken = token;
    window.currentUser = user;
    console.log('Auth state updated:', { token: !!token, user: user?.name }); // Debug log
}

function showAuth() {
    console.log('showAuth called - showing login page'); // Debug log
    
    // Clear any existing user data
    authToken = null;
    currentUser = null;
    window.authToken = null;
    window.currentUser = null;
    
    // Show auth section, hide dashboard
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('dashboard-section').style.display = 'none';
    
    // Show login form by default
    if (window.showLogin) {
        window.showLogin();
    }
    
    console.log('Auth section displayed'); // Debug log
}

function showDashboard() {
    console.log('showDashboard called, currentUser:', currentUser); // Debug log
    
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    
    if (currentUser) {
        document.getElementById('user-name').textContent = currentUser.name;
        document.getElementById('user-role').textContent = currentUser.role.replace('_', ' ');
        
        // Check if loadDashboard exists before calling
        if (typeof window.loadDashboard === 'function') {
            console.log('Calling loadDashboard...'); // Debug log
            window.loadDashboard();
        } else {
            console.error('loadDashboard function not found!'); // Debug log
        }
    } else {
        console.error('currentUser is null!'); // Debug log
    }
}

function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('forgot-password-form').style.display = 'none';
}

function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('forgot-password-form').style.display = 'none';
}

function showForgotPassword() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('forgot-password-form').style.display = 'block';
}

// API Helper with better error handling
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            // Handle token expiration
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                showAuth();
                throw new Error('Session expired. Please login again.');
            }
            throw new Error(result.message || 'Something went wrong');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
        contentArea.insertBefore(alertDiv, contentArea.firstChild);
        setTimeout(() => alertDiv.remove(), 5000);
    } else {
        // Show in auth section if dashboard not loaded
        const authSection = document.getElementById('auth-section');
        if (authSection) {
            authSection.insertBefore(alertDiv, authSection.firstChild);
            setTimeout(() => alertDiv.remove(), 5000);
        }
    }
}

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Make functions globally accessible
window.showLogin = showLogin;
window.showRegister = showRegister;
window.showForgotPassword = showForgotPassword;
window.showAuth = showAuth;
window.showDashboard = showDashboard;
window.updateAuthState = updateAuthState;
window.apiCall = apiCall;
window.showAlert = showAlert;

console.log('App.js loaded - functions exposed to window'); // Debug log

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking auth...'); // Debug log
    checkAuth();
});
