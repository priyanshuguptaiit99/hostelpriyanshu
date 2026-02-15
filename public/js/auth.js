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
        
        console.log('Token and user stored, showing dashboard...'); // Debug log
        
        alert('✅ Login successful! Loading dashboard...');
        window.showAlert('Login successful!', 'success');
        
        setTimeout(() => {
            console.log('Calling showDashboard...'); // Debug log
            window.showDashboard();
            isLoggingIn = false;
        }, 500);
    } catch (error) {
        console.error('Login error:', error); // Debug log
        alert('❌ Login failed: ' + error.message);
        window.showAlert(error.message || 'Login failed', 'error');
        isLoggingIn = false;
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
    
    const data = {
        name: document.getElementById('reg-name').value,
        collegeId: document.getElementById('reg-college-id').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        role: document.getElementById('reg-role').value,
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
        
        // Show success alert
        alert('✅ Registration successful! You can now login.');
        window.showAlert(result.message || 'Registration successful!', 'success');
        
        // Clear form
        document.getElementById('register-form-element').reset();
        
        setTimeout(() => {
            window.showLogin();
            isRegistering = false;
        }, 1500);
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
        window.showAlert('Password reset feature coming soon!', 'info');
        setTimeout(() => window.showLogin(), 2000);
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
