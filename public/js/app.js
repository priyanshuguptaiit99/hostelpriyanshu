/**
 * Hostel Management System - Main Application
 * 
 * @author Priyanshu
 * @copyright 2026 Priyanshu. All Rights Reserved.
 */

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
        
        // Check approval status
        if (currentUser.approvalStatus === 'pending' || currentUser.approvalStatus === 'rejected') {
            showApprovalPortal(currentUser);
        } else {
            showDashboard();
        }
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

function showApprovalPortal(user) {
    console.log('showApprovalPortal called for user:', user); // Debug log
    
    // Hide auth and dashboard sections
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'none';
    
    // Create approval portal
    let portalHtml = '';
    
    if (user.approvalStatus === 'pending') {
        portalHtml = `
            <div id="approval-portal" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px;">
                <div style="max-width: 600px; width: 100%; background: white; border-radius: 24px; padding: 48px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: fadeIn 0.5s ease-out;">
                    <div style="font-size: 80px; margin-bottom: 24px; animation: bounce 2s infinite;">⏳</div>
                    <h1 style="font-size: 32px; font-weight: 800; color: #1e293b; margin-bottom: 16px;">Access Pending</h1>
                    <p style="font-size: 18px; color: #64748b; margin-bottom: 32px;">Your account is waiting for approval</p>
                    
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 12px; margin-bottom: 32px; text-align: left;">
                        <h3 style="font-size: 16px; font-weight: 700; color: #92400e; margin-bottom: 12px;">⚠️ Approval Required</h3>
                        <p style="font-size: 14px; color: #78350f; line-height: 1.6;">
                            ${user.role === 'warden' 
                                ? 'Your warden access request is pending admin approval. An administrator will review your request shortly.' 
                                : 'Your student account is pending warden approval. A warden will review your registration shortly.'}
                        </p>
                    </div>
                    
                    <div style="background: #f1f5f9; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: left;">
                            <div>
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Name</div>
                                <div style="font-size: 16px; font-weight: 700; color: #1e293b;">${user.name}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Role</div>
                                <div style="font-size: 16px; font-weight: 700; color: #1e293b; text-transform: capitalize;">${user.role}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Email</div>
                                <div style="font-size: 14px; font-weight: 600; color: #1e293b;">${user.email}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Status</div>
                                <div style="display: inline-block; padding: 4px 12px; background: #fef3c7; color: #92400e; border-radius: 20px; font-size: 12px; font-weight: 700;">PENDING</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 32px;">
                        <h4 style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">What happens next?</h4>
                        <div style="text-align: left; padding-left: 20px;">
                            <p style="font-size: 14px; color: #64748b; margin-bottom: 8px;">✓ ${user.role === 'warden' ? 'Admin' : 'Warden'} will review your request</p>
                            <p style="font-size: 14px; color: #64748b; margin-bottom: 8px;">✓ You'll receive approval notification</p>
                            <p style="font-size: 14px; color: #64748b; margin-bottom: 8px;">✓ Access will be granted automatically</p>
                            <p style="font-size: 14px; color: #64748b;">✓ You can then login and use the system</p>
                        </div>
                    </div>
                    
                    <button onclick="handleLogout()" style="width: 100%; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: transform 0.2s;">
                        Back to Login
                    </button>
                </div>
            </div>
        `;
    } else if (user.approvalStatus === 'rejected') {
        portalHtml = `
            <div id="approval-portal" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px;">
                <div style="max-width: 600px; width: 100%; background: white; border-radius: 24px; padding: 48px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: fadeIn 0.5s ease-out;">
                    <div style="font-size: 80px; margin-bottom: 24px;">❌</div>
                    <h1 style="font-size: 32px; font-weight: 800; color: #dc2626; margin-bottom: 16px;">Access Denied</h1>
                    <p style="font-size: 18px; color: #64748b; margin-bottom: 32px;">Your account request was not approved</p>
                    
                    <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 12px; margin-bottom: 32px; text-align: left;">
                        <h3 style="font-size: 16px; font-weight: 700; color: #991b1b; margin-bottom: 12px;">Rejection Reason</h3>
                        <p style="font-size: 14px; color: #7f1d1d; line-height: 1.6;">
                            ${user.rejectionReason || 'Your request was reviewed and not approved. Please contact the administrator for more information.'}
                        </p>
                    </div>
                    
                    <div style="background: #f1f5f9; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: left;">
                            <div>
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Name</div>
                                <div style="font-size: 16px; font-weight: 700; color: #1e293b;">${user.name}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Role</div>
                                <div style="font-size: 16px; font-weight: 700; color: #1e293b; text-transform: capitalize;">${user.role}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Email</div>
                                <div style="font-size: 14px; font-weight: 600; color: #1e293b;">${user.email}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Status</div>
                                <div style="display: inline-block; padding: 4px 12px; background: #fee2e2; color: #991b1b; border-radius: 20px; font-size: 12px; font-weight: 700;">REJECTED</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 32px; text-align: left;">
                        <h4 style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">What can you do?</h4>
                        <p style="font-size: 14px; color: #64748b; margin-bottom: 8px;">• Contact the administrator for clarification</p>
                        <p style="font-size: 14px; color: #64748b; margin-bottom: 8px;">• Provide additional information if requested</p>
                        <p style="font-size: 14px; color: #64748b;">• Reapply with correct information</p>
                    </div>
                    
                    <button onclick="handleLogout()" style="width: 100%; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: transform 0.2s;">
                        Back to Login
                    </button>
                </div>
            </div>
        `;
    }
    
    // Remove existing portal if any
    const existingPortal = document.getElementById('approval-portal');
    if (existingPortal) {
        existingPortal.remove();
    }
    
    // Add portal to body
    document.body.insertAdjacentHTML('beforeend', portalHtml);
}

function showDashboard() {
    console.log('showDashboard called, currentUser:', currentUser); // Debug log
    
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    
    if (currentUser) {
        document.getElementById('user-name').textContent = currentUser.name;
        document.getElementById('user-role').textContent = currentUser.role.replace('_', ' ');
        
        // Show welcome animation
        if (typeof window.showWelcomeAnimation === 'function') {
            window.showWelcomeAnimation(currentUser.name);
        }
        
        // Add scroll to top button
        if (typeof window.addScrollToTop === 'function') {
            setTimeout(() => window.addScrollToTop(), 2500);
        }
        
        // Load dashboard immediately
        if (typeof window.loadDashboard === 'function') {
            console.log('Calling loadDashboard...'); // Debug log
            window.loadDashboard();
        } else {
            console.error('loadDashboard function not found!'); // Debug log
            // Fallback: show error message
            document.getElementById('content-area').innerHTML = '<div class="alert alert-error">Dashboard failed to load. Please refresh the page.</div>';
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
window.showApprovalPortal = showApprovalPortal;
window.updateAuthState = updateAuthState;
window.apiCall = apiCall;
window.showAlert = showAlert;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;

console.log('App.js loaded - functions exposed to window'); // Debug log

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking auth...'); // Debug log
    checkAuth();
});
