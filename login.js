// ========================================
// Authentication Configuration
// Backend: MongoDB (via /api/login and /api/register)
// ========================================

console.log("✅ Authentication system initialized - using MongoDB backend APIs");

// ========================================
// Global Error Handlers
// ========================================
// Suppress unhandled promise rejections from AbortError
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (event.reason.name === 'AbortError' || event.reason.name === 'NotAllowedError')) {
        // Silently ignore media-related errors
        event.preventDefault();
    }
});

// ========================================
// ========================================
// Suppress Audio/Video Errors
// ========================================
// Catch and suppress AbortError from audio playback
window.addEventListener('play', (e) => {
    if (e.target && (e.target.tagName === 'AUDIO' || e.target.tagName === 'VIDEO')) {
        const playPromise = e.target.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Silently ignore AbortError and NotAllowedError from autoplay prevention
                if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
                    console.warn('⚠️  Media playback error:', error);
                }
            });
        }
        e.target.pause();
    }
}, true);

// ========================================
// ========================================
// Configuration & Admin Management (FALLBACK ONLY)
// ========================================

let adminConfiguration = {
    adminEmails: ['admin@oceanguard.gov.in']  // Default fallback
};

// Load admin configuration from config.json (FALLBACK ONLY)
async function loadAdminConfig() {
    console.log("📄 Loading fallback admin configuration from config.json...");
    try {
        const response = await fetch('config.json');
        const config = await response.json();
        adminConfiguration = config;
        console.log('✅ [FALLBACK] Admin configuration loaded from config.json:', config.adminEmails);
    } catch (error) {
        console.warn('⚠️  [FALLBACK] Could not load config.json');
    }
}

// Initialize: Load admin configuration
async function initializeAuth() {
    console.log("🔐 ============ AUTHENTICATION INIT START ============");
    console.log("📋 Using MongoDB backend for authentication");
    console.log("📋 VALID TEST CREDENTIALS (use these to login):");
    console.log("  ADMIN ACCOUNTS:");
    console.log("    - ompatil@hazardwatch.com / Om1@121204");
    console.log("    - admin@example.com / admin123");
    console.log("  REGULAR USER ACCOUNTS:");
    console.log("    - user@example.com / user123");
    console.log("    - john@example.com / john123");
    console.log("    - sarah@example.com / sarah123");
    
    console.log("1️⃣  Loading admin configuration...");
    await loadAdminConfig();
    
    console.log("✅ [AUTH SYSTEM READY] Using MongoDB backend with local fallback");
    console.log("🔐 ============ AUTHENTICATION INIT COMPLETE ============");
}

// Call on page load
initializeAuth().catch(err => console.error('Init error:', err));

// ========================================
// Login Page - Optimized
// ========================================

// Cache DOM elements
const loginCache = {
    form: null,
    inputs: [],
    socialBtns: [],
    initialized: false
};

function cacheLoginElements() {
    if (loginCache.initialized) return;
    
    loginCache.form = document.getElementById('loginForm');
    loginCache.inputs = document.querySelectorAll('input');
    loginCache.socialBtns = document.querySelectorAll('.btn-social');
    loginCache.initialized = true;
}

document.addEventListener('DOMContentLoaded', function () {
    cacheLoginElements();
    if (!loginCache.form) return;

    // Handle login form submission
    loginCache.form.addEventListener('submit', handleLoginSubmit);

    // Check if user is remembered
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        const usernameField = document.getElementById('username');
        const rememberCheckbox = document.querySelector('input[name="remember"]');
        if (usernameField) usernameField.value = rememberedUser;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    // Add input animations using event delegation
    loginCache.inputs.forEach(input => {
        input.addEventListener('focus', handleInputFocus);
        input.addEventListener('blur', handleInputBlur);
    });

    // Social login buttons
    loginCache.socialBtns.forEach(btn => {
        btn.addEventListener('click', handleSocialLogin);
    });

    // Signup Modal Handlers
    const signupLink = document.getElementById('signupLink');
    const signupModal = document.getElementById('signupModal');
    const closeSignupModal = document.getElementById('closeSignupModal');
    const backToLogin = document.getElementById('backToLogin');
    const signupForm = document.getElementById('signupForm');

    if (signupLink) {
        signupLink.addEventListener('click', (e) => {
            e.preventDefault();
            signupModal.style.display = 'flex';
            signupModal.classList.add('show');
        });
    }

    if (closeSignupModal) {
        closeSignupModal.addEventListener('click', () => {
            signupModal.style.display = 'none';
            signupModal.classList.remove('show');
            signupForm.reset();
        });
    }

    if (backToLogin) {
        backToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            signupModal.style.display = 'none';
            signupModal.classList.remove('show');
            signupForm.reset();
        });
    }

    // Close modal when clicking outside
    if (signupModal) {
        signupModal.addEventListener('click', (e) => {
            if (e.target === signupModal) {
                signupModal.style.display = 'none';
                signupModal.classList.remove('show');
                signupForm.reset();
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignupSubmit);
    }
});

async function handleLoginSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('username')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const remember = document.querySelector('input[name="remember"]')?.checked;

    // Validation
    if (!email || !password) {
        showLoginError('Email and password are required');
        return;
    }

    const submitBtn = loginCache.form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.innerHTML = '⏳ Signing in...';
        submitBtn.disabled = true;

        console.log("🔐 LOGIN ATTEMPT START");
        console.log("1️⃣  Authenticating via MongoDB backend...");

        // Get backend API URL from location
        const baseUrl = window.location.protocol + '//' + window.location.host;
        const apiEndpoint = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') 
            ? 'http://localhost:5000/api/auth/login'
            : '/api/auth/login';

        // Call backend API for authentication
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            console.log(`❌ [AUTH FAILED] ${data.message || 'Invalid credentials'}`);
            showLoginError(data.message || 'Invalid email or password. Please check and try again.');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        // Authentication successful
        const user = data.data.user;
        console.log(`✅ [AUTH SUCCESS] User authenticated: ${email} | Role: ${user.role}`);

        // Store user session from backend response
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('username', user.email);
        sessionStorage.setItem('userId', user.id);
        sessionStorage.setItem('userRole', user.role);
        sessionStorage.setItem('isAdmin', user.role === 'admin' ? 'true' : 'false');
        sessionStorage.setItem('fullName', user.fullName);

        if (remember) {
            localStorage.setItem('rememberedUser', user.email);
        }

        console.log(`✅ [LOGIN COMPLETE] User: ${email} | Role: ${user.role}`);

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error("❌ [LOGIN FAILED]", error);
        showLoginError('Failed to connect to server. Please try again.');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

/**
 * FALLBACK: Check if user exists in local config.json
 * Only used if Firebase API fails
 */
function checkLocalConfig(email, password) {
    try {
        // First check localStorage for newly signed up users
        const localUsers = getLocalUsers();
        const localUser = localUsers.find(u => u.email === email && u.password === password);
        if (localUser) {
            console.log(`✓ Found user in localStorage: ${email}`);
            return true;
        }

        // Then check config.json test users
        if (!adminConfiguration.testUsers) {
            console.warn("⚠️  No testUsers in config.json");
            return false;
        }

        const allUsers = [
            ...adminConfiguration.testUsers.admins,
            ...adminConfiguration.testUsers.regularUsers
        ];

        const user = allUsers.find(u => u.email === email && u.password === password);
        
        if (user) {
            console.log(`✓ Found user in config.json: ${email}`);
            return true;
        } else {
            console.log(`✗ User not found in config.json: ${email}`);
            return false;
        }
    } catch (error) {
        console.error("⚠️  Error checking local config:", error);
        return false;
    }
}

function getErrorMessage(code) {
    const errors = {
        'auth/user-not-found': 'Email not found. Check spelling or use one from the test accounts.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-email': 'Invalid email address format.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/too-many-requests': 'Too many failed attempts. Try again in a few minutes.',
        'auth/invalid-credential': 'Invalid email or password. Check both fields and try again.',
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/weak-password': 'Password too weak. Use at least 6 characters.',
        'auth/operation-not-allowed': 'Email/password login is not enabled.',
        'auth/network-request-failed': 'Network error. Check your internet connection.'
    };
    return errors[code] || `Login failed: ${code}. Check browser console for details.`;
}

function handleInputFocus(e) {
    e.target.parentElement.style.transform = 'translateY(-2px)';
}

function handleInputBlur(e) {
    e.target.parentElement.style.transform = 'translateY(0)';
}

function handleSocialLogin(e) {
    alert('🔐 Social login will be implemented with OAuth providers');
}

function showLoginError(message) {
    alert(`❌ ${message}`);
}

function showSignupSuccess(message) {
    alert(`✅ ${message}`);
}

function showSignupError(message) {
    alert(`❌ ${message}`);
}

// ========================================
// SIGNUP FUNCTION
// ========================================

async function handleSignupSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('signupName')?.value?.trim();
    const email = document.getElementById('signupEmail')?.value?.trim();
    const password = document.getElementById('signupPassword')?.value;
    const confirmPassword = document.getElementById('signupConfirmPassword')?.value;
    const agreeTerms = document.getElementById('agreeTerms')?.checked;

    // Validation
    console.log("🔐 SIGNUP ATTEMPT START");
    
    if (!name || !email || !password || !confirmPassword) {
        showSignupError('Please fill in all required fields');
        return;
    }

    if (!agreeTerms) {
        showSignupError('You must agree to the Terms of Service');
        return;
    }

    if (password !== confirmPassword) {
        showSignupError('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        showSignupError('Password must be at least 6 characters');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showSignupError('Please enter a valid email address');
        return;
    }

    const submitBtn = document.querySelector('.signup-submit-btn');
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.innerHTML = '⏳ Creating account...';
        submitBtn.disabled = true;

        console.log("1️⃣  Registering via MongoDB backend...");

        // Get backend API URL
        const baseUrl = window.location.protocol + '//' + window.location.host;
        const apiEndpoint = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') 
            ? 'http://localhost:5000/api/auth/register'
            : '/api/auth/register';

        // Split name into first and last name
        const nameParts = name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        // Register via backend API
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                firstName,
                lastName,
                fullName: name
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.log(`❌ [SIGNUP FAILED] ${data.message || 'Registration failed'}`);
            showSignupError(data.message || 'Registration failed. Please try again.');
            return;
        }

        console.log(`✅ [SIGNUP SUCCESS] User registered: ${email}`);
        
        // Show success message
        showSignupSuccess(`Account created successfully! You can now login.`);

        // Clear form
        document.getElementById('signupForm')?.reset?.();

        // Switch back to login tab after 2 seconds
        setTimeout(() => {
            document.querySelector('input[value="login"]')?.click?.();
        }, 2000);

    } catch (error) {
        console.error("❌ [SIGNUP FAILED]", error);
        showSignupError('Failed to connect to server. Please try again.');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

/**
 * Check if user already exists in Firestore or localStorage
 */
async function checkIfUserExists(email) {
    try {
        // Check Firestore
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            console.log('User exists in Firestore');
            return true;
        }
    } catch (error) {
        console.warn('Could not query Firestore:', error.message);
    }

    // Check localStorage
    const localUsers = getLocalUsers();
    if (localUsers.find(u => u.email === email)) {
        console.log('User exists in localStorage');
        return true;
    }

    // Check config.json
    if (adminConfiguration.testUsers) {
        const allConfigUsers = [
            ...adminConfiguration.testUsers.admins,
            ...adminConfiguration.testUsers.regularUsers
        ];
        if (allConfigUsers.find(u => u.email === email)) {
            console.log('User exists in config.json');
            return true;
        }
    }

    return false;
}

/**
 * Save user to Firestore
 */
async function saveUserToFirestore(email, name, role) {
    try {
        const usersRef = collection(db, 'users');
        await addDoc(usersRef, {
            email: email,
            name: name,
            role: role || 'user',
            createdAt: new Date(),
            status: 'active'
        });
        console.log('✅ User saved to Firestore');
    } catch (error) {
        console.warn('Could not save to Firestore:', error.message);
    }
}

/**
 * Save user to localStorage (fallback)
 */
function saveUserLocal(email, password, name) {
    try {
        const localUsers = getLocalUsers();
        
        // Check if user already exists
        if (localUsers.find(u => u.email === email)) {
            console.warn('User already exists in localStorage');
            return false;
        }

        const newUser = {
            email: email,
            password: password,
            name: name,
            role: 'user',
            createdAt: new Date().toISOString()
        };

        localUsers.push(newUser);
        localStorage.setItem('oceanGuard_users', JSON.stringify(localUsers));
        console.log('✅ User saved to localStorage');
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

/**
 * Get all users from localStorage
 */
function getLocalUsers() {
    try {
        const usersJSON = localStorage.getItem('oceanGuard_users');
        return usersJSON ? JSON.parse(usersJSON) : [];
    } catch (error) {
        console.warn('Error reading localStorage users:', error);
        return [];
    }
}