/**
 * Hostel Management System - Authentication Module
 * 
 * @author Priyanshu
 * @copyright 2026 Priyanshu. All Rights Reserved.
 */

// Auth functions - Make sure they're globally accessible
console.log('Auth.js loading...'); // Debug log

let isLoggingIn = false; // Prevent multiple submissions
let isRegistering = false; // Prevent multiple submissions

async function handleLogin(event) {
    event.preventDefault();
    
    // Prevent multiple submissions
    if (isLoggingIn) {
        console.log('Login already in progress...'); // Debug log
        return false;
    }
    
    isLoggingIn = true;
    console.log('handleLogin called'); // Debug log
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Validate email domain
    if (email && !email.toLowerCase().endsWith('@nitj.ac.in')) {
        alert('❌ Only NITJ college email addresses (@nitj.ac.in) are allowed');
        window.showAlert('Only NITJ college email addresses (@nitj.ac.in) are allowed', 'error');
        isLoggingIn = false;
        return false;
    }

    console.log('Login attempt:', email); // Debug log
    console.log('apiCall available?', typeof window.apiCall); // Debug log

    try {
        const result = await window.apiCall('/auth/login', 'POST', { email, password });
        
        console.log('Login result:', result); // Debug log
        
        // Store in localStorage
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Update global variables in app.js
        if (typeof window.authToken !== 'undefined') {
            window.authToken = result.token;
        }
        if (typeof window.currentUser !== 'undefined') {
            window.currentUser = result.user;
        }
        
        // Also update local variables in app.js scope
        if (window.updateAuthState) {
            window.updateAuthState(result.token, result.user);
        }
        
        console.log('Token and user stored, checking approval status...'); // Debug log
        
        // Check approval status
        if (result.user.approvalStatus === 'pending') {
            // Show waiting for approval portal
            alert('⏳ Your account is pending approval. Please wait for admin/warden to approve your request.');
            window.showAlert('Account pending approval', 'warning');
            setTimeout(() => {
                window.showApprovalPortal(result.user);
                isLoggingIn = false;
            }, 500);
        } else if (result.user.approvalStatus === 'rejected') {
            // Show rejection message
            alert('❌ Your account has been rejected. Please contact admin for more information.');
            window.showAlert('Account rejected', 'error');
            setTimeout(() => {
                window.showApprovalPortal(result.user);
                isLoggingIn = false;
            }, 500);
        } else if (result.user.approvalStatus === 'approved') {
            // Show success and load dashboard
            alert('✅ Login successful! Loading dashboard...');
            window.showAlert('Login successful!', 'success');
            setTimeout(() => {
                console.log('Calling showDashboard...'); // Debug log
                window.showDashboard();
                isLoggingIn = false;
            }, 500);
        } else {
            // Default: show dashboard
            alert('✅ Login successful! Loading dashboard...');
            window.showAlert('Login successful!', 'success');
            setTimeout(() => {
                window.showDashboard();
                isLoggingIn = false;
            }, 500);
        }
    } catch (error) {
        console.error('Login error:', error); // Debug log
        
        // Check if email verification is required
        if (error.requiresVerification) {
            alert('📧 Please verify your email before logging in. Check your college email for the OTP.');
            window.showAlert('Email verification required', 'warning');
            setTimeout(() => {
                showEmailVerification(error.email || email);
                isLoggingIn = false;
            }, 500);
        } else {
            alert('❌ Login failed: ' + error.message);
            window.showAlert(error.message || 'Login failed', 'error');
            isLoggingIn = false;
        }
    }
    
    return false; // Prevent form submission
}

async function handleRegister(event) {
    event.preventDefault();
    
    // Prevent multiple submissions
    if (isRegistering) {
        console.log('Registration already in progress...'); // Debug log
        return false;
    }
    
    isRegistering = true;
    console.log('handleRegister called'); // Debug log
    
    const roleElement = document.getElementById('reg-role');
    const email = document.getElementById('reg-email').value;
    
    // Validate email domain
    if (!email.toLowerCase().endsWith('@nitj.ac.in')) {
        alert('❌ Only NITJ college email addresses (@nitj.ac.in) are allowed');
        window.showAlert('Only NITJ college email addresses (@nitj.ac.in) are allowed', 'error');
        isRegistering = false;
        return false;
    }
    
    const data = {
        name: document.getElementById('reg-name').value,
        collegeId: document.getElementById('reg-college-id').value,
        email: email,
        password: document.getElementById('reg-password').value,
        role: roleElement ? roleElement.value : 'student',
        roomNumber: document.getElementById('reg-room').value,
        hostelBlock: document.getElementById('reg-hostel').value,
        department: document.getElementById('reg-department').value,
        year: document.getElementById('reg-year').value ? parseInt(document.getElementById('reg-year').value) : null,
        phoneNumber: document.getElementById('reg-phone').value
    };

    console.log('Register attempt:', data); // Debug log
    console.log('apiCall available?', typeof window.apiCall); // Debug log

    try {
        const result = await window.apiCall('/auth/register', 'POST', data);
        console.log('Register result:', result); // Debug log
        
        // Clear form
        document.getElementById('register-form-element').reset();
        
        // Check if email verification is required
        if (result.requiresVerification) {
            alert('✅ Registration successful! An OTP has been sent to ' + email + '. Please verify your email to login.');
            window.showAlert('Registration successful! Please check your email for OTP.', 'success');
            
            // Show email verification form
            setTimeout(() => {
                showEmailVerification(email);
                isRegistering = false;
            }, 1500);
        } else {
            alert('✅ Registration successful! You can now login.');
            window.showAlert(result.message || 'Registration successful!', 'success');
            
            setTimeout(() => {
                window.showLogin();
                isRegistering = false;
            }, 1500);
        }
    } catch (error) {
        console.error('Register error:', error); // Debug log
        
        // Show error alert - both browser alert and styled alert
        alert('❌ Registration failed: ' + error.message);
        window.showAlert(error.message || 'Registration failed', 'error');
        
        isRegistering = false;
    }
    
    return false; // Prevent form submission
}

async function handleForgotPassword(event) {
    event.preventDefault();
    console.log('handleForgotPassword called'); // Debug log
    
    const email = document.getElementById('forgot-email').value;

    try {
        window.showAlert('Please contact the system administrator at adminpriyanshu@hostel.com to reset your password.', 'info');
        setTimeout(() => window.showLogin(), 3000);
    } catch (error) {
        window.showAlert(error.message || 'Error occurred', 'error');
    }
    
    return false; // Prevent form submission
}

function handleLogout() {
    console.log('handleLogout called'); // Debug log
    if (confirm('Are you sure you want to logout?')) {
        console.log('User confirmed logout'); // Debug log
        
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Clear global variables
        window.authToken = null;
        window.currentUser = null;
        
        // Update app.js variables if updateAuthState exists
        if (window.updateAuthState) {
            window.updateAuthState(null, null);
        }
        
        console.log('Cleared auth data, showing auth section...'); // Debug log
        
        // Show alert
        alert('✅ Logged out successfully!');
        window.showAlert('Logged out successfully', 'success');
        
        // Show auth section
        setTimeout(() => {
            if (window.showAuth) {
                window.showAuth();
            } else {
                // Fallback: reload the page
                window.location.reload();
            }
        }, 500);
    } else {
        console.log('User cancelled logout'); // Debug log
    }
}

// Make functions globally accessible
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleForgotPassword = handleForgotPassword;
window.handleLogout = handleLogout;

console.log('Auth.js loaded - functions exposed to window'); // Debug log


// ==================== GOOGLE OAUTH ====================
async function handleGoogleLogin() {
    try {
        showLoading();
        
        // Get Google Auth URL
        const result = await window.apiCall('/auth/google', 'GET');
        
        if (!result.url) {
            throw new Error('Failed to get Google auth URL');
        }
        
        // Open Google OAuth in popup
        const width = 500;
        const height = 600;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);
        
        const popup = window.open(
            result.url,
            'Google Sign In',
            `width=${width},height=${height},left=${left},top=${top}`
        );
        
        // Listen for OAuth callback
        window.addEventListener('message', async (event) => {
            if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
                popup.close();
                
                try {
                    // Send code to backend
                    const authResult = await window.apiCall('/auth/google/callback', 'POST', {
                        code: event.data.code
                    });
                    
                    // Store token and user
                    localStorage.setItem('token', authResult.token);
                    localStorage.setItem('user', JSON.stringify(authResult.user));
                    
                    // Update global variables
                    if (window.updateAuthState) {
                        window.updateAuthState(authResult.token, authResult.user);
                    }
                    
                    hideLoading();
                    
                    // Check if email verification is required
                    if (authResult.requiresVerification) {
                        window.showAlert('Please verify your email with the OTP sent to your college email', 'warning');
                        setTimeout(() => {
                            showEmailVerification(authResult.user.email);
                        }, 500);
                        return;
                    }
                    
                    // Check approval status
                    if (authResult.user.approvalStatus === 'pending') {
                        window.showAlert('Account pending approval', 'warning');
                        setTimeout(() => {
                            window.showApprovalPortal(authResult.user);
                        }, 500);
                    } else if (authResult.user.approvalStatus === 'rejected') {
                        window.showAlert('Account rejected', 'error');
                        setTimeout(() => {
                            window.showApprovalPortal(authResult.user);
                        }, 500);
                    } else {
                        window.showAlert('Google login successful!', 'success');
                        setTimeout(() => {
                            window.showDashboard();
                        }, 500);
                    }
                } catch (error) {
                    hideLoading();
                    console.error('Google auth error:', error);
                    window.showAlert(error.message || 'Google authentication failed', 'error');
                }
            } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
                popup.close();
                hideLoading();
                window.showAlert('Google authentication cancelled or failed', 'error');
            }
        });
        
        // Check if popup was blocked
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
            hideLoading();
            window.showAlert('Popup blocked! Please allow popups for this site.', 'error');
        }
        
    } catch (error) {
        hideLoading();
        console.error('Google login error:', error);
        window.showAlert(error.message || 'Failed to initiate Google login', 'error');
    }
}

// Make function globally accessible
window.handleGoogleLogin = handleGoogleLogin;


// ==================== EMAIL VERIFICATION ====================
function showEmailVerification(email) {
    const authSection = document.getElementById('auth-section');
    if (!authSection) return;

    authSection.innerHTML = `
        <div class="auth-container">
            <h1>Verify Email</h1>
            <p class="auth-subtitle">Enter the OTP sent to ${email}</p>
            
            <form id="verify-email-form" onsubmit="return handleEmailVerification(event)">
                <div class="form-input-wrapper" data-icon="📧">
                    <input type="email" id="verify-email" value="${email}" readonly required>
                </div>
                
                <div class="form-input-wrapper" data-icon="🔑">
                    <input type="text" id="verify-otp" placeholder="Enter 6-digit OTP" maxlength="6" pattern="[0-9]{6}" required>
                </div>
                
                <button type="submit" class="btn btn-primary">Verify Email</button>
                
                <p style="text-align: center; margin-top: 16px;">
                    Didn't receive OTP? <a href="#" onclick="resendOTP('${email}'); return false;">Resend OTP</a>
                </p>
                
                <p style="text-align: center; margin-top: 8px;">
                    <a href="#" onclick="window.showLogin(); return false;">Back to Login</a>
                </p>
            </form>
        </div>
    `;
}

async function handleEmailVerification(event) {
    event.preventDefault();
    
    const email = document.getElementById('verify-email').value;
    const otp = document.getElementById('verify-otp').value;
    
    if (!otp || otp.length !== 6) {
        alert('❌ Please enter a valid 6-digit OTP');
        window.showAlert('Please enter a valid 6-digit OTP', 'error');
        return false;
    }
    
    try {
        const result = await window.apiCall('/auth/verify-email-otp', 'POST', { email, otp });
        
        alert('✅ Email verified successfully! You can now login.');
        window.showAlert('Email verified successfully!', 'success');
        
        setTimeout(() => {
            window.showLogin();
        }, 1500);
    } catch (error) {
        console.error('Verification error:', error);
        alert('❌ Verification failed: ' + error.message);
        window.showAlert(error.message || 'Verification failed', 'error');
    }
    
    return false;
}

async function resendOTP(email) {
    try {
        const result = await window.apiCall('/auth/send-verification-otp', 'POST', { email });
        
        alert('✅ OTP resent! Please check your email.');
        window.showAlert('OTP resent to your email', 'success');
    } catch (error) {
        console.error('Resend OTP error:', error);
        alert('❌ Failed to resend OTP: ' + error.message);
        window.showAlert(error.message || 'Failed to resend OTP', 'error');
    }
}

// Make functions globally accessible
window.showEmailVerification = showEmailVerification;
window.handleEmailVerification = handleEmailVerification;
window.resendOTP = resendOTP;
