// ========================================
// Settings System
// ========================================

// Default Settings
const defaultSettings = {
    // Notification Preferences
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,

    // Location Settings
    locationAccess: true,
    monitoringRadius: '5',

    // Language Preference
    language: 'english',

    // Privacy Controls
    anonymousReports: true,
    hideLocation: true,
    profileVisibility: false,

    // Theme Mode
    theme: 'light'
};

let currentSettings = { ...defaultSettings };

function initializeSettings() {
    loadSettings();
    renderSettings();
    initializeSettingHandlers();
    applyTheme();
}

// ========================================
// Load and Save Settings
// ========================================

function loadSettings() {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
        try {
            currentSettings = {
                ...defaultSettings,
                ...JSON.parse(saved)
            };
        } catch (e) {
            currentSettings = { ...defaultSettings };
        }
    }
}

function saveSettings() {
    localStorage.setItem('userSettings', JSON.stringify(currentSettings));
}

function renderSettings() {
    // A) Notification Preferences
    const pushNotifications = document.getElementById('pushNotifications');
    const emailNotifications = document.getElementById('emailNotifications');
    const smsNotifications = document.getElementById('smsNotifications');

    if (pushNotifications) pushNotifications.checked = currentSettings.pushNotifications;
    if (emailNotifications) emailNotifications.checked = currentSettings.emailNotifications;
    if (smsNotifications) smsNotifications.checked = currentSettings.smsNotifications;

    // B) Location Settings
    const locationAccess = document.getElementById('locationAccess');
    if (locationAccess) locationAccess.checked = currentSettings.locationAccess;

    const radiusOptions = document.querySelectorAll('input[name="radius"]');
    radiusOptions.forEach(radio => {
        radio.checked = radio.value === currentSettings.monitoringRadius;
    });

    // C) Language Selection
    const languageOptions = document.querySelectorAll('input[name="language"]');
    languageOptions.forEach(radio => {
        radio.checked = radio.value === currentSettings.language;
    });

    // D) Privacy Controls
    const anonymousReports = document.getElementById('anonymousReports');
    const hideLocation = document.getElementById('hideLocation');
    const profileVisibility = document.getElementById('profileVisibility');

    if (anonymousReports) anonymousReports.checked = currentSettings.anonymousReports;
    if (hideLocation) hideLocation.checked = currentSettings.hideLocation;
    if (profileVisibility) profileVisibility.checked = currentSettings.profileVisibility;

    // E) Theme Mode
    const themeOptions = document.querySelectorAll('input[name="theme"]');
    themeOptions.forEach(radio => {
        radio.checked = radio.value === currentSettings.theme;
    });
}

function initializeSettingHandlers() {
    // A) Notification Preferences
    const pushNotifications = document.getElementById('pushNotifications');
    const emailNotifications = document.getElementById('emailNotifications');
    const smsNotifications = document.getElementById('smsNotifications');

    if (pushNotifications) {
        pushNotifications.addEventListener('change', function() {
            currentSettings.pushNotifications = this.checked;
        });
    }

    if (emailNotifications) {
        emailNotifications.addEventListener('change', function() {
            currentSettings.emailNotifications = this.checked;
        });
    }

    if (smsNotifications) {
        smsNotifications.addEventListener('change', function() {
            currentSettings.smsNotifications = this.checked;
        });
    }

    // B) Location Settings
    const locationAccess = document.getElementById('locationAccess');
    if (locationAccess) {
        locationAccess.addEventListener('change', function() {
            currentSettings.locationAccess = this.checked;
        });
    }

    const radiusOptions = document.querySelectorAll('input[name="radius"]');
    radiusOptions.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                currentSettings.monitoringRadius = this.value;
            }
        });
    });

    // C) Language Selection
    const languageOptions = document.querySelectorAll('input[name="language"]');
    languageOptions.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                currentSettings.language = this.value;
                updateLanguage(this.value);
            }
        });
    });

    // D) Privacy Controls
    const anonymousReports = document.getElementById('anonymousReports');
    const hideLocation = document.getElementById('hideLocation');
    const profileVisibility = document.getElementById('profileVisibility');

    if (anonymousReports) {
        anonymousReports.addEventListener('change', function() {
            currentSettings.anonymousReports = this.checked;
        });
    }

    if (hideLocation) {
        hideLocation.addEventListener('change', function() {
            currentSettings.hideLocation = this.checked;
        });
    }

    if (profileVisibility) {
        profileVisibility.addEventListener('change', function() {
            currentSettings.profileVisibility = this.checked;
        });
    }

    // E) Theme Mode
    const themeOptions = document.querySelectorAll('input[name="theme"]');
    themeOptions.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                currentSettings.theme = this.value;
                applyTheme();
            }
        });
    });

    // Save and Reset buttons
    const saveBtn = document.getElementById('saveSettingsBtn');
    const resetBtn = document.getElementById('resetSettingsBtn');

    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveSettings);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', handleResetSettings);
    }
}

function handleSaveSettings() {
    saveSettings();
    alert('Settings saved successfully! ✓');
}

function handleResetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
        currentSettings = { ...defaultSettings };
        saveSettings();
        renderSettings();
        applyTheme();
        alert('Settings have been reset to defaults.');
    }
}

// ========================================
// Theme Management
// ========================================

function applyTheme() {
    const theme = currentSettings.theme;
    const html = document.documentElement;

    if (theme === 'dark') {
        html.style.colorScheme = 'dark';
        // Add dark mode CSS variables override here if needed
    } else {
        html.style.colorScheme = 'light';
    }

    // Save theme preference to DOM for CSS to access
    document.body.setAttribute('data-theme', theme);
}

// ========================================
// Language Management (Placeholder)
// ========================================

function updateLanguage(language) {
    // This is a placeholder for language switching
    // In a real app, this would load translated strings
    console.log('Language changed to:', language);

    const languageMap = {
        'english': 'English',
        'hindi': 'हिंदी (Hindi)',
        'regional': 'Regional Language'
    };

    // You could emit an event or call an API to change the UI language
    // For now, we'll just log it
    console.log('Current language:', languageMap[language]);
}

// ========================================
// Initialization
// ========================================

initializeSettings();
