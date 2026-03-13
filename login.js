import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCFYKtb_fNUtLA3Yz0Ssx4PoBoKQIQxOM0",
    authDomain: "disaster-ai-240b7.firebaseapp.com",
    projectId: "disaster-ai-240b7",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

console.log("Firebase initialized successfully");

// ========================================
// Login Page JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');

    // Handle login form submission
    loginForm.addEventListener('submit', async fzsunction (e) {
        e.preventDefault();

        const email = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const remember = document.querySelector('input[name="remember"]').checked;

        // Simple validation
        if (email && password) {
            // Add loading state to button
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span>Signing in...</span>';
            submitBtn.disabled = true;

            try {
                // Firebase authentication
                const userCredential = await signInWithEmailAndPassword(auth, email, password);

                // Store user session (kept for compatibility with other pages if they rely on it)
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('username', email);

                if (remember) {
                    localStorage.setItem('rememberedUser', email);
                }

                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error("Authentication error:", error);
                alert("Login failed: " + error.message);

                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    });

    // Check if user is remembered
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        document.getElementById('username').value = rememberedUser;
        document.querySelector('input[name="remember"]').checked = true;
    }

    // Add input animations
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function () {
            this.parentElement.style.transform = 'translateY(-2px)';
        });

        input.addEventListener('blur', function () {
            this.parentElement.style.transform = 'translateY(0)';
        });
    });

    // Social login buttons
    const socialBtns = document.querySelectorAll('.btn-social');
    socialBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            alert('Social login will be implemented with OAuth providers');
        });
    });
});