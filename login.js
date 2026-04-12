import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCiOVDsusUhUSRW-xwMocoG5li39PsfM1Q",
    authDomain: "ocean-hazard-a459e.firebaseapp.com",
    projectId: "ocean-hazard-a459e",
    storageBucket: "ocean-hazard-a459e.firebasestorage.app",
    messagingSenderId: "555157224442",
    appId: "1:555157224442:web:c1a5ab694d0c9331fc0243"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("✅ Firebase initialized successfully with Firestore enabled");

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
// Firestore User Management
// ========================================

// Create user in Firestore
async function createUserInFirestore(uid, email, password, fullName = '') {
    try {
        const userRef = doc(db, 'users', uid);
        const userData = {
            uid: uid,
            email: email,
            fullName: fullName,
            role: email.includes('admin') || email.includes('ompatil') ? 'admin' : 'user',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            active: true
        };
        
        await setDoc(userRef, userData);
        console.log(`✅ [Firestore] User created: ${email}`);
        return userData;
    } catch (error) {
        console.error('❌ [Firestore] Error creating user:', error.message);
        throw error;
    }
}

// Register new user (Firestore + Firebase Auth)
async function registerUserWithFirestore(email, password, fullName) {
    try {
        console.log(`🔄 Registering user: ${email}`);
        
        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        
        // Store user data in Firestore
        await createUserInFirestore(uid, email, password, fullName);
        
        console.log(`✅ User registered successfully: ${email}`);
        return { success: true, uid, email };
    } catch (error) {
        console.error('❌ Registration error:', error.message);
        throw error;
    }
}

// Get user from Firestore by email
async function getUserFromFirestore(email) {
    try {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data();
        }
        return null;
    } catch (error) {
        console.warn('⚠️ [Firestore] Error fetching user:', error.message);
        return null;
    }
}

// Update last login in Firestore
async function updateLastLoginInFirestore(uid) {
    try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
    } catch (error) {
        console.warn('⚠️ [Firestore] Could not update last login:', error.message);
    }
}

// Create test users in Firestore (optional)
async function createTestUsersInFirestore() {
    const testUsers = [
        { email: 'ompatil@hazardwatch.com', password: 'Om1@121204', fullName: 'Om Patil', role: 'admin' },
        { email: 'admin@example.com', password: 'admin123', fullName: 'Admin User', role: 'admin' },
        { email: 'user@example.com', password: 'user123', fullName: 'Test User', role: 'user' },
        { email: 'john@example.com', password: 'john123', fullName: 'John Doe', role: 'user' },
        { email: 'sarah@example.com', password: 'sarah123', fullName: 'Sarah Smith', role: 'user' }
    ];

    console.log('🔄 Syncing test users to Firestore...');
    
    for (const testUser of testUsers) {
        try {
            const existingUser = await getUserFromFirestore(testUser.email);
            
            if (!existingUser) {
                // Try to create via Firebase Auth
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, testUser.email, testUser.password);
                    await createUserInFirestore(userCredential.user.uid, testUser.email, testUser.password, testUser.fullName);
                    console.log(`✅ Test user created: ${testUser.email}`);
                } catch (authError) {
                    // User might already exist in Firebase Auth, just add to Firestore
                    if (authError.code === 'auth/email-already-in-use') {
                        console.log(`ℹ️  Test user already exists in Firebase Auth: ${testUser.email}`);
                    } else {
                        console.warn(`⚠️ Could not create auth user: ${testUser.email} - ${authError.message}`);
                    }
                }
            } else {
                console.log(`ℹ️  Test user already in Firestore: ${testUser.email}`);
            }
        } catch (error) {
            console.warn(`⚠️ Error processing test user ${testUser.email}:`, error.message);
        }
    }
    
    console.log('✅ Test users sync complete');
}

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

// Initialize: Load from Firestore and backup with config.json
async function initializeAuth() {
    console.log("🔐 ============ AUTHENTICATION INIT START ============");
    console.log("📋 VALID TEST CREDENTIALS (use these to login):");
    console.log("  ADMIN ACCOUNTS:");
    console.log("    - ompatil@hazardwatch.com / Om1@121204");
    console.log("    - admin@example.com / admin123");
    console.log("  REGULAR USER ACCOUNTS:");
    console.log("    - user@example.com / user123");
    console.log("    - john@example.com / john123");
    console.log("    - sarah@example.com / sarah123");
    
    console.log("1️⃣  PRIMARY: Initializing Firestore...");
    await createTestUsersInFirestore();
    
    console.log("2️⃣  FALLBACK: Loading local config.json as backup...");
    await loadAdminConfig();
    
    console.log("✅ [AUTH SYSTEM READY] Using Firestore with config.json fallback");
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
        console.log("1️⃣  PRIMARY: Trying Firebase Firestore authentication...");

        let authSuccess = false;
        let userRole = 'user';
        let userData = null;

        // PRIMARY: Try Firebase Authentication
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;
            
            console.log(`✅ [FIREBASE AUTH SUCCESS] UID: ${uid}`);
            
            // Get user data from Firestore
            userData = await getUserFromFirestore(email);
            
            if (userData) {
                userRole = userData.role || 'user';
                console.log(`✅ [FIRESTORE] User found: ${email} | Role: ${userRole}`);
                
                // Update last login
                await updateLastLoginInFirestore(uid);
                authSuccess = true;
            } else {
                console.warn(`⚠️  [FIRESTORE] User not found in database, creating entry...`);
                await createUserInFirestore(uid, email, password);
                userRole = email.includes('admin') ? 'admin' : 'user';
                authSuccess = true;
            }
        } catch (firebaseError) {
            console.warn(`⚠️  [FIREBASE AUTH] Failed: ${firebaseError.message}`);
            console.log("2️⃣  FALLBACK: Using local config.json authentication...");
            
            // FALLBACK: Check local config
            authSuccess = checkLocalConfig(email, password);
            
            if (authSuccess) {
                // Determine role from local config
                const isAdmin = adminConfiguration.adminEmails.includes(email);
                userRole = isAdmin ? 'admin' : 'user';
                console.log(`✅ [LOCAL AUTH] Using config.json: ${email} | Role: ${userRole}`);
            }
        }
        
        if (!authSuccess) {
            console.log(`❌ [AUTH FAILED] Invalid credentials for: ${email}`);
            showLoginError('Invalid email or password. Please check and try again.');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        // Store user session
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('username', email);
        sessionStorage.setItem('userRole', userRole);
        sessionStorage.setItem('isAdmin', userRole === 'admin' ? 'true' : 'false');

        if (remember) {
            localStorage.setItem('rememberedUser', email);
        }

        console.log(`✅ [LOGIN COMPLETE] User: ${email} | Role: ${userRole}`);

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error("❌ [LOGIN FAILED]", error);
        showLoginError('An unexpected error occurred. Please try again.');
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

        console.log("1️⃣  PRIMARY: Trying Firebase Registration with Firestore...");

        // Check if user already exists (Firebase or local)
        const userExists = await checkIfUserExists(email);
        if (userExists) {
            showSignupError('This email is already registered. Please login instead.');
            return;
        }

        // Try to create user in Firebase + Firestore using unified function
        let signupSuccess = false;
        try {
            const result = await registerUserWithFirestore(email, password, name);
            if (result.success) {
                console.log("✅ [FIREBASE + FIRESTORE] User created and saved successfully");
                signupSuccess = true;
            }
        } catch (error) {
            console.warn("⚠️  [FIREBASE] Registration failed:", error.code);
            console.log("2️⃣  FALLBACK: Saving to local storage...");
            
            // Fallback: Save to localStorage
            signupSuccess = saveUserLocal(email, password, name);
        }

        if (signupSuccess) {
            console.log(`✅ [SIGNUP SUCCESS] User: ${email}`);
            showSignupSuccess(`Welcome! Account created for ${name}. You can now login.`);
            
            // Clear form and close modal
            document.getElementById('signupForm').reset();
            document.getElementById('signupModal').style.display = 'none';
            
            // Clear input fields
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