// ========================================
// Firebase Setup
// ========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCFYKtb_fNUtLA3Yz0Ssx4PoBoKQIQxOM0",
    authDomain: "disaster-ai-240b7.firebaseapp.com",
    projectId: "disaster-ai-240b7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

console.log("Firebase initialized");

// ========================================
// API Configuration
// ========================================

const API_BASE =
    window.API_BASE ||
    (window.location.protocol === "file:"
        ? "http://localhost:5000"
        : window.location.origin);

// ========================================
// Mode Control (Signin / Signup)
// ========================================

let mode = "signin";

function setMode(newMode) {

    mode = newMode;

    const header = document.querySelector(".login-form-wrapper h2");
    const subtitle = document.querySelector(".subtitle");
    const submitBtn = document.querySelector("#loginForm button[type='submit']");
    const confirmGroup = document.getElementById("confirmPasswordGroup");
    const modePrompt = document.getElementById("modePrompt");
    const toggleLink = document.getElementById("toggleMode");

    if (mode === "signup") {

        header.textContent = "Create an account";
        subtitle.textContent = "Sign up to access the dashboard";
        submitBtn.textContent = "Sign Up";
        confirmGroup.style.display = "block";

        modePrompt.textContent = "Already have an account?";
        toggleLink.textContent = "Sign in";

    } else {

        header.textContent = "Welcome Back";
        subtitle.textContent = "Enter your credentials to access the dashboard";
        submitBtn.textContent = "Sign In";
        confirmGroup.style.display = "none";

        modePrompt.textContent = "Don't have an account?";
        toggleLink.textContent = "Sign up";
    }
}

// ========================================
// Utilities
// ========================================

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setSession(email, remember) {

    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("username", email);

    if (remember) {
        localStorage.setItem("rememberedUser", email);
    } else {
        localStorage.removeItem("rememberedUser");
    }
}

async function authRequest(endpoint, body) {

    const response = await fetch(`${API_BASE}/api/${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
    }

    return data;
}

// ========================================
// Login Page Logic
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const toggleModeLink = document.getElementById("toggleMode");

    setMode("signin");

    toggleModeLink.addEventListener("click", e => {
        e.preventDefault();
        setMode(mode === "signin" ? "signup" : "signin");
    });

    loginForm.addEventListener("submit", async e => {

        e.preventDefault();

        const email = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        const rememberInput = document.querySelector("input[name='remember']");
        const remember = rememberInput ? rememberInput.checked : false;

        if (!validateEmail(email)) {
            alert("Please enter a valid email.");
            return;
        }

        if (!password) {
            alert("Password is required.");
            return;
        }

        if (mode === "signup") {

            const confirmPassword = document.getElementById("confirmPassword").value;

            if (password !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }
        }

        const submitBtn = loginForm.querySelector("button[type='submit']");
        const originalText = submitBtn.innerHTML;

        submitBtn.innerHTML = `<span>${mode === "signin" ? "Signing in..." : "Signing up..."}</span>`;
        submitBtn.disabled = true;

        try {

            if (mode === "signin") {

                // Firebase login
                await signInWithEmailAndPassword(auth, email, password);

                // Backend verification
                await authRequest("login", { email, password });

                setSession(email, remember);

                window.location.href = "dashboard.html";

            } else {

                // Firebase signup
                await createUserWithEmailAndPassword(auth, email, password);

                // Backend register
                await authRequest("register", { email, password });

                alert("Registration successful! You can now sign in.");

                setMode("signin");

                document.getElementById("password").value = "";
                document.getElementById("confirmPassword").value = "";
            }

        } catch (error) {

            console.error("Auth error:", error);

            alert("Authentication failed: " + error.message);

        } finally {

            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

        }

    });

    // ========================================
    // Remember User
    // ========================================

    const rememberedUser = localStorage.getItem("rememberedUser");

    if (rememberedUser) {

        document.getElementById("username").value = rememberedUser;

        const rememberInput = document.querySelector("input[name='remember']");
        if (rememberInput) {
            rememberInput.checked = true;
        }
    }

    // ========================================
    // Input Animations
    // ========================================

    const inputs = document.querySelectorAll("input");

    inputs.forEach(input => {

        input.addEventListener("focus", function () {
            this.parentElement.style.transform = "translateY(-2px)";
        });

        input.addEventListener("blur", function () {
            this.parentElement.style.transform = "translateY(0)";
        });

    });

});