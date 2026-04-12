// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCiOVDsusUhUSRW-xwMocoG5li39PsfM1Q",
  authDomain: "ocean-hazard-a459e.firebaseapp.com",
  projectId: "ocean-hazard-a459e",
  storageBucket: "ocean-hazard-a459e.firebasestorage.app",
  messagingSenderId: "555157224442",
  appId: "1:555157224442:web:c1a5ab694d0c9331fc0243",
  measurementId: "G-2BKLNKL551"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("✓ Firebase initialized");
console.log("✓ Firestore initialized");

// ========================================
// Firestore User Role Fetching
// ========================================

/**
 * Fetch user role from Firestore
 * Falls back to local config.json if Firestore fails
 */
async function getUserRole(email) {
    try {
        // Try to fetch from Firestore first
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const role = userDoc.data().role || 'user';
            console.log(`✅ User role from Firestore: ${email} → ${role}`);
            return role;
        } else {
            console.log(`⚠️  User not found in Firestore: ${email}`);
            // Fall back to local config if user not in Firestore
            return await getRoleFromLocalConfig(email);
        }
    } catch (error) {
        console.error('⚠️  Error fetching from Firestore:', error);
        console.log('📄 Falling back to local config.json...');
        // Fall back to local config on error
        return await getRoleFromLocalConfig(email);
    }
}

/**
 * Fallback: Get user role from local config.json
 */
async function getRoleFromLocalConfig(email) {
    try {
        const response = await fetch('config.json');
        const config = await response.json();
        
        if (config.adminEmails && config.adminEmails.includes(email)) {
            console.log(`✅ User role from config.json: ${email} → admin`);
            return 'admin';
        } else {
            console.log(`✅ User role from config.json: ${email} → user`);
            return 'user';
        }
    } catch (error) {
        console.warn('⚠️  Could not load config.json, defaulting to user role');
        return 'user';
    }
}

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

        // Firebase authentication
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Store user session
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('username', email);

        // Determine user role from Firestore (with fallback to local config)
        const userRole = await getUserRole(email);
        const isAdmin = userRole === 'admin';
        
        sessionStorage.setItem('userRole', userRole);
        sessionStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');

        if (remember) {
            localStorage.setItem('rememberedUser', email);
        }

        console.log(`✅ User logged in: ${email} (Role: ${userRole})`);

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error("Auth error:", error.code);
        showLoginError(getErrorMessage(error.code));
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
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
    alert(`❌ Login failed: ${message}`);
}

function getErrorMessage(code) {
    const errors = {
        'auth/user-not-found': 'Email not found. Please check your email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/too-many-requests': 'Too many failed login attempts. Try again later.'
    };
    return errors[code] || 'Login failed. Please try again.';
}
