import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCFYKtb_fNUtLA3Yz0Ssx4PoBoKQIQxOM0",
    authDomain: "disaster-ai-240b7.firebaseapp.com",
    projectId: "disaster-ai-240b7",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("✓ Firebase initialized for fallback support");

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
// Authentication Provider Setup
// ========================================
function initializeAuthProvider() {
    console.log("📱 Using secure backend authentication (/api/login)");
}

// ========================================
// Configuration & Admin Management (FALLBACK ONLY)
// ========================================

let adminConfiguration = {
    adminEmails: ['admin@oceanguard.gov.in']  // Default fallback
};

// Load admin configuration from config.json (FALLBACK ONLY)
async function loadAdminConfig() {
    console.log("📄 Loading admin email configuration...");
    try {
        const response = await fetch('config.json');
        const config = await response.json();
        adminConfiguration = {
            adminEmails: Array.isArray(config.adminEmails) ? config.adminEmails : adminConfiguration.adminEmails
        };
        console.log(`✅ Admin configuration loaded (${adminConfiguration.adminEmails.length} admin email(s))`);
    } catch (error) {
        console.warn('⚠️  Could not load admin config, using default admin list');
    }
}

// Initialize authentication system
async function initializeAuth() {
    console.log("🔐 ============ AUTHENTICATION INIT START ============");
    console.log("1️⃣  PRIMARY: Initializing auth provider...");
    initializeAuthProvider();
    
    console.log("2️⃣  Loading admin email config...");
    await loadAdminConfig();
    
    console.log("✅ [AUTH SYSTEM READY] Using secure backend login");
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
    loginError: null,
    authStatusBanner: null,
    emergencyGuestBtn: null,
    signupForm: null,
    signupMessage: null,
    initialized: false
};

let authServiceDegraded = false;

function cacheLoginElements() {
    if (loginCache.initialized) return;
    
    loginCache.form = document.getElementById('loginForm');
    loginCache.inputs = document.querySelectorAll('input');
    loginCache.socialBtns = document.querySelectorAll('.btn-social');
    loginCache.loginError = document.getElementById('loginError');
    loginCache.authStatusBanner = document.getElementById('authStatusBanner');
    loginCache.emergencyGuestBtn = document.getElementById('emergencyGuestBtn');
    loginCache.signupForm = document.getElementById('signupForm');
    loginCache.initialized = true;
}

document.addEventListener('DOMContentLoaded', function () {
    cacheLoginElements();
    if (!loginCache.form) return;

    // Handle login form submission
    loginCache.form.addEventListener('submit', handleLoginSubmit);

    if (loginCache.emergencyGuestBtn) {
        loginCache.emergencyGuestBtn.addEventListener('click', handleEmergencyGuestAccess);
    }

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

    loginCache.signupMessage = ensureSignupMessageElement();

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
    clearLoginError();

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
        console.log("✅ Authenticating with backend API...");

        const authResult = await authenticateUser(email, password);
        const authSuccess = authResult.success;
        
        if (!authSuccess) {
            if (authResult.reason === 'invalid') {
                console.log(`❌ [AUTH FAILED] Invalid credentials for: ${email}`);
                showLoginError('Invalid email or password. Please check and try again.');
            } else {
                console.log(`⚠️ [AUTH DEGRADED] Backend unavailable for: ${email}`);
                showLoginError('Secure sign-in is temporarily unavailable. Use Emergency Access below for urgent help.');
            }
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        console.log("✅ [AUTH SUCCESS] Authenticated using backend API");
        setAuthServiceDegraded(false);

        // If authentication successful
        if (authSuccess) {
            // Store user session
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('username', email);

            // Determine user role based on admin configuration
            const isAdmin = adminConfiguration.adminEmails.includes(email);
            const userRole = isAdmin ? 'admin' : 'user';
            sessionStorage.setItem('userRole', userRole);
            sessionStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');

            if (remember) {
                localStorage.setItem('rememberedUser', email);
            }

            console.log(`✅ [LOGIN COMPLETE] User: ${email} | Role: ${userRole}`);

            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error("❌ [LOGIN FAILED]", error);
        showLoginError('An unexpected error occurred. Please try again.');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function authenticateUser(email, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
            return { success: true, reason: 'ok' };
        }

        if (response.status === 401) {
            return { success: false, reason: 'invalid' };
        }

        console.warn(`⚠️  Backend auth returned ${response.status}, entering limited mode`);
        setAuthServiceDegraded(true);
        return { success: false, reason: 'unavailable' };
    } catch (error) {
        console.warn('⚠️  Backend auth unavailable, entering limited mode:', error.message);
        setAuthServiceDegraded(true);
        return { success: false, reason: 'unavailable' };
    }
}

function setAuthServiceDegraded(isDegraded) {
    authServiceDegraded = isDegraded;

    if (!loginCache.authStatusBanner) {
        return;
    }

    if (!isDegraded) {
        loginCache.authStatusBanner.hidden = true;
        loginCache.authStatusBanner.textContent = '';
        return;
    }

    loginCache.authStatusBanner.hidden = false;
    loginCache.authStatusBanner.textContent = 'Secure staff sign-in is temporarily unavailable. Emergency guest access is active for urgent incidents.';
}

function handleEmergencyGuestAccess() {
    sessionStorage.setItem('isLoggedIn', 'false');
    sessionStorage.setItem('username', 'guest');
    sessionStorage.setItem('userRole', 'guest');
    sessionStorage.setItem('isGuest', 'true');
    window.location.href = 'emergency-resources.html';
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
    showLoginError('Social login is not enabled for emergency operations. Use staff credentials or emergency guest access.');
}

function showLoginError(message) {
    if (!loginCache.loginError) {
        return;
    }

    loginCache.loginError.textContent = message;
    loginCache.loginError.hidden = false;
}

function clearLoginError() {
    if (!loginCache.loginError) {
        return;
    }

    loginCache.loginError.hidden = true;
    loginCache.loginError.textContent = '';
}

function showSignupSuccess(message) {
    setSignupMessage(message, 'success');
}

function showSignupError(message) {
    setSignupMessage(message, 'error');
}

function ensureSignupMessageElement() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return null;

    let message = document.getElementById('signupMessage');
    if (!message) {
        message = document.createElement('div');
        message.id = 'signupMessage';
        message.className = 'form-message';
        message.hidden = true;
        signupForm.prepend(message);
    }

    return message;
}

function setSignupMessage(message, type) {
    if (!loginCache.signupMessage) {
        loginCache.signupMessage = ensureSignupMessageElement();
    }

    if (!loginCache.signupMessage) {
        return;
    }

    loginCache.signupMessage.className = `form-message ${type === 'success' ? 'form-message-success' : 'form-message-error'}`;
    loginCache.signupMessage.textContent = message;
    loginCache.signupMessage.hidden = false;
}

function clearSignupMessage() {
    if (!loginCache.signupMessage) {
        return;
    }

    loginCache.signupMessage.hidden = true;
    loginCache.signupMessage.textContent = '';
}

// ========================================
// SIGNUP FUNCTION
// ========================================

async function handleSignupSubmit(e) {
    e.preventDefault();
    clearSignupMessage();

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

        console.log("1️⃣  PRIMARY: Trying Firebase Registration...");

        // Try to create user in Firebase first.
        let signupSuccess = false;
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log("✅ [FIREBASE] User created successfully");
            signupSuccess = true;

            // Save to Firestore
            await saveUserToFirestore(email, name, 'user');
        } catch (error) {
            console.warn("⚠️  [FIREBASE] Registration failed:", error.code);
            console.log("2️⃣  FALLBACK: Trying backend registration...");

            signupSuccess = await registerWithBackend(email, password);
        }

        if (signupSuccess) {
            console.log(`✅ [SIGNUP SUCCESS] User: ${email}`);
            showSignupSuccess(`Welcome! Account created for ${name}. You can now login.`);
            
            // Clear form and close modal
            document.getElementById('signupForm').reset();
            document.getElementById('signupModal').style.display = 'none';
            
            // Pre-fill login fields for convenience.
            document.getElementById('username').value = email;
            document.getElementById('password').value = password;
        }
    } catch (error) {
        console.error("❌ [SIGNUP FAILED]", error);
        showSignupError('Signup failed. Please try again.');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function registerWithBackend(email, password) {
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            signal: AbortSignal.timeout(7000)
        });

        if (response.ok) {
            console.log('✅ [BACKEND] User created successfully');
            return true;
        }

        if (response.status === 409) {
            showSignupError('This email is already registered. Please login instead.');
            return false;
        }

        showSignupError('Account service is temporarily unavailable. Please try again shortly.');
        return false;
    } catch (error) {
        console.warn('⚠️  Backend signup unavailable:', error.message);
        showSignupError('Account service is temporarily unavailable. Please try again shortly.');
        return false;
    }
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