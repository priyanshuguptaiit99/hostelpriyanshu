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
        if (error.requiresVerification || (error.message && error.message.includes('verify your email'))) {
            const emailToVerify = error.email || email;
            alert('📧 Please verify your email before logging in. We will send you an OTP now.');
            window.showAlert('Email verification required', 'warning');
            
            // Automatically send OTP
            try {
                const otpResult = await window.apiCall('/auth/send-verification-otp', 'POST', { email: emailToVerify });
                
                setTimeout(() => {
                    showEmailVerification(emailToVerify);
                    
                    // Show OTP in development mode
                    if (otpResult.otp) {
                        setTimeout(() => {
                            const otpDisplay = document.getElementById('otp-display');
                            const devOtp = document.getElementById('dev-otp');
                            if (otpDisplay && devOtp) {
                                devOtp.textContent = otpResult.otp;
                                otpDisplay.style.display = 'block';
                            }
                        }, 200);
                        console.log('=================================');
                        console.log('DEVELOPMENT MODE - OTP:', otpResult.otp);
                        console.log('=================================');
                    }
                    
                    isLoggingIn = false;
                }, 500);
            } catch (otpError) {
                console.error('OTP send error:', otpError);
                setTimeout(() => {
                    showEmailVerification(emailToVerify);
                    isLoggingIn = false;
                }, 500);
            }
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
                
                // Show OTP in development mode
                if (result.otp) {
                    setTimeout(() => {
                        const otpDisplay = document.getElementById('otp-display');
                        const devOtp = document.getElementById('dev-otp');
                        if (otpDisplay && devOtp) {
                            devOtp.textContent = result.otp;
                            otpDisplay.style.display = 'block';
                        }
                    }, 200);
                    console.log('=================================');
                    console.log('DEVELOPMENT MODE - OTP:', result.otp);
                    console.log('=================================');
                }
                
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
                
                let authResult;
                try {
                    // Send code to backend
                    authResult = await window.apiCall('/auth/google/callback', 'POST', {
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
                            
                            // Show OTP in development mode
                            if (authResult.otp) {
                                setTimeout(() => {
                                    const otpDisplay = document.getElementById('otp-display');
                                    const devOtp = document.getElementById('dev-otp');
                                    if (otpDisplay && devOtp) {
                                        devOtp.textContent = authResult.otp;
                                        otpDisplay.style.display = 'block';
                                    }
                                }, 200);
                                console.log('=================================');
                                console.log('DEVELOPMENT MODE - OTP:', authResult.otp);
                                console.log('=================================');
                            }
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
                    
                    // Check if it's a college email error
                    if (error.message && error.message.includes('@nitj.ac.in')) {
                        alert('❌ Only NITJ College Email Allowed!\n\nPlease sign in with your college email address ending with @nitj.ac.in');
                        window.showAlert('Only NITJ college email addresses are allowed', 'error');
                    } else if (error.requiresVerification || (error.message && error.message.includes('verify your email'))) {
                        // Email verification required - send OTP automatically
                        const userEmail = error.email || authResult?.user?.email;
                        
                        if (userEmail) {
                            alert('📧 Please verify your email. We will send you an OTP now.');
                            window.showAlert('Email verification required', 'warning');
                            
                            try {
                                const otpResult = await window.apiCall('/auth/send-verification-otp', 'POST', { email: userEmail });
                                
                                setTimeout(() => {
                                    showEmailVerification(userEmail);
                                    
                                    // Show OTP in development mode
                                    if (otpResult.otp) {
                                        setTimeout(() => {
                                            const otpDisplay = document.getElementById('otp-display');
                                            const devOtp = document.getElementById('dev-otp');
                                            if (otpDisplay && devOtp) {
                                                devOtp.textContent = otpResult.otp;
                                                otpDisplay.style.display = 'block';
                                            }
                                        }, 200);
                                        console.log('=================================');
                                        console.log('DEVELOPMENT MODE - OTP:', otpResult.otp);
                                        console.log('=================================');
                                    }
                                }, 500);
                            } catch (otpError) {
                                console.error('OTP send error:', otpError);
                                setTimeout(() => {
                                    showEmailVerification(userEmail);
                                }, 500);
                            }
                        } else {
                            window.showAlert('Please login with email/password to verify', 'info');
                        }
                    } else {
                        alert('❌ Google authentication failed: ' + error.message);
                        window.showAlert(error.message || 'Google authentication failed', 'error');
                    }
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
        <div class="auth-container" style="max-width: 500px;">
            <h1>📧 Verify Your Email</h1>
            <p class="auth-subtitle">We've sent a 6-digit OTP to</p>
            <p style="text-align: center; color: var(--primary); font-weight: 700; font-size: 16px; margin-bottom: 24px;">${email}</p>
            
            <form id="verify-email-form" onsubmit="return handleEmailVerification(event)">
                <input type="hidden" id="verify-email" value="${email}">
                
                <div class="form-group" style="margin-bottom: 24px;">
                    <label for="verify-otp" style="display: block; text-align: center; margin-bottom: 12px; font-size: 14px; color: var(--text-secondary);">
                        Enter OTP
                    </label>
                    <input 
                        type="text" 
                        id="verify-otp" 
                        placeholder="000000" 
                        maxlength="6" 
                        pattern="[0-9]{6}"
                        style="width: 100%; padding: 18px; font-size: 32px; text-align: center; letter-spacing: 12px; font-weight: 700; border: 2px solid var(--border); border-radius: var(--radius);"
                        required
                        autocomplete="off"
                    >
                    <small style="display: block; text-align: center; margin-top: 8px; color: var(--text-secondary);">
                        ⏱️ OTP is valid for 10 minutes
                    </small>
                </div>
                
                <button type="submit" class="btn btn-primary" style="width: 100%; padding: 16px; font-size: 16px; margin-bottom: 16px;">
                    ✅ Verify Email
                </button>
                
                <div style="text-align: center; padding: 16px; background: var(--light-gray); border-radius: var(--radius); margin-bottom: 16px;">
                    <p style="margin: 0 0 12px 0; color: var(--text-secondary); font-size: 14px;">
                        Didn't receive the OTP?
                    </p>
                    <button type="button" onclick="resendOTP('${email}'); return false;" class="btn btn-secondary" style="padding: 10px 24px; font-size: 14px;">
                        📨 Resend OTP
                    </button>
                </div>
                
                <p style="text-align: center; margin-top: 16px;">
                    <a href="#" onclick="window.showLogin(); return false;" style="color: var(--primary); text-decoration: none; font-weight: 600;">
                        ← Back to Login
                    </a>
                </p>
            </form>
            
            <div id="otp-display" style="display: none; margin-top: 20px; padding: 16px; background: #fff3cd; border: 2px solid #ffc107; border-radius: var(--radius); text-align: center;">
                <p style="margin: 0 0 8px 0; color: #856404; font-weight: 600;">🔧 Development Mode</p>
                <p style="margin: 0; color: #856404; font-size: 14px;">Your OTP: <strong id="dev-otp" style="font-size: 24px; letter-spacing: 4px;"></strong></p>
            </div>
        </div>
    `;
    
    // Auto-focus on OTP input
    setTimeout(() => {
        const otpInput = document.getElementById('verify-otp');
        if (otpInput) {
            otpInput.focus();
            
            // Format OTP input
            otpInput.addEventListener('input', function(e) {
                this.value = this.value.replace(/[^0-9]/g, '');
            });
        }
    }, 100);
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
        
        // Show OTP in development mode
        if (result.otp) {
            const otpDisplay = document.getElementById('otp-display');
            const devOtp = document.getElementById('dev-otp');
            if (otpDisplay && devOtp) {
                devOtp.textContent = result.otp;
                otpDisplay.style.display = 'block';
            }
            console.log('=================================');
            console.log('DEVELOPMENT MODE - OTP:', result.otp);
            console.log('=================================');
        }
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
