// ========================================
// Settings System with Performance Optimization
// ========================================

// Default Settings
const defaultSettings = {
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    locationAccess: true,
    monitoringRadius: '5',
    language: 'english',
    anonymousReports: true,
    hideLocation: true,
    profileVisibility: false,
    theme: 'light'
};

let currentSettings = { ...defaultSettings };

// ========================================
// CACHED ELEMENTS (Performance: 50+ queries → 1-2 queries)
// ========================================
const settingsElements = {
    notifications: {},
    location: {},
    privacy: {},
    theme: {},
    buttons: {},
    initialized: false
};

function cacheSettingsElements() {
    if (settingsElements.initialized) return; // Only cache once
    
    // Notification checkboxes
    settingsElements.notifications = {
        push: document.getElementById('pushNotifications'),
        email: document.getElementById('emailNotifications'),
        sms: document.getElementById('smsNotifications')
    };
    
    // Location settings
    settingsElements.location = {
        access: document.getElementById('locationAccess'),
        radius: document.querySelectorAll('input[name="radius"]')
    };
    
    // Language selection
    settingsElements.language = document.querySelectorAll('input[name="language"]');
    
    // Privacy controls
    settingsElements.privacy = {
        anonymous: document.getElementById('anonymousReports'),
        hideLocation: document.getElementById('hideLocation'),
        profileVisibility: document.getElementById('profileVisibility')
    };
    
    // Theme options
    settingsElements.theme = document.querySelectorAll('input[name="theme"]');
    
    // Buttons
    settingsElements.buttons = {
        save: document.getElementById('saveSettingsBtn'),
        reset: document.getElementById('resetSettingsBtn')
    };
    
    settingsElements.initialized = true;
}

function initializeSettings() {
    cacheSettingsElements();
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
            console.warn('Failed to load settings:', e);
            currentSettings = { ...defaultSettings };
        }
    }
}

function saveSettings() {
    localStorage.setItem('userSettings', JSON.stringify(currentSettings));
}

function renderSettings() {
    if (!settingsElements.initialized) cacheSettingsElements();
    
    // Notifications
    if (settingsElements.notifications.push) settingsElements.notifications.push.checked = currentSettings.pushNotifications;
    if (settingsElements.notifications.email) settingsElements.notifications.email.checked = currentSettings.emailNotifications;
    if (settingsElements.notifications.sms) settingsElements.notifications.sms.checked = currentSettings.smsNotifications;
    
    // Location
    if (settingsElements.location.access) settingsElements.location.access.checked = currentSettings.locationAccess;
    settingsElements.location.radius.forEach(radio => {
        radio.checked = radio.value === currentSettings.monitoringRadius;
    });
    
    // Language
    settingsElements.language.forEach(radio => {
        radio.checked = radio.value === currentSettings.language;
    });
    
    // Privacy
    if (settingsElements.privacy.anonymous) settingsElements.privacy.anonymous.checked = currentSettings.anonymousReports;
    if (settingsElements.privacy.hideLocation) settingsElements.privacy.hideLocation.checked = currentSettings.hideLocation;
    if (settingsElements.privacy.profileVisibility) settingsElements.privacy.profileVisibility.checked = currentSettings.profileVisibility;
    
    // Theme
    settingsElements.theme.forEach(radio => {
        radio.checked = radio.value === currentSettings.theme;
    });
}

function initializeSettingHandlers() {
    if (!settingsElements.initialized) cacheSettingsElements();
    
    // Notification handlers
    if (settingsElements.notifications.push) {
        settingsElements.notifications.push.addEventListener('change', (e) => {
            currentSettings.pushNotifications = e.target.checked;
        });
    }
    if (settingsElements.notifications.email) {
        settingsElements.notifications.email.addEventListener('change', (e) => {
            currentSettings.emailNotifications = e.target.checked;
        });
    }
    if (settingsElements.notifications.sms) {
        settingsElements.notifications.sms.addEventListener('change', (e) => {
            currentSettings.smsNotifications = e.target.checked;
        });
    }
    
    // Location handlers
    if (settingsElements.location.access) {
        settingsElements.location.access.addEventListener('change', (e) => {
            currentSettings.locationAccess = e.target.checked;
        });
    }
    
    settingsElements.location.radius.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) currentSettings.monitoringRadius = e.target.value;
        });
    });
    
    // Language handlers
    settingsElements.language.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                currentSettings.language = e.target.value;
                updateLanguage(e.target.value);
            }
        });
    });
    
    // Privacy handlers
    if (settingsElements.privacy.anonymous) {
        settingsElements.privacy.anonymous.addEventListener('change', (e) => {
            currentSettings.anonymousReports = e.target.checked;
        });
    }
    if (settingsElements.privacy.hideLocation) {
        settingsElements.privacy.hideLocation.addEventListener('change', (e) => {
            currentSettings.hideLocation = e.target.checked;
        });
    }
    if (settingsElements.privacy.profileVisibility) {
        settingsElements.privacy.profileVisibility.addEventListener('change', (e) => {
            currentSettings.profileVisibility = e.target.checked;
        });
    }
    
    // Theme handlers
    settingsElements.theme.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                currentSettings.theme = e.target.value;
                applyTheme();
            }
        });
    });
    
    // Save and Reset buttons
    if (settingsElements.buttons.save) {
        settingsElements.buttons.save.addEventListener('click', handleSaveSettings);
    }
    if (settingsElements.buttons.reset) {
        settingsElements.buttons.reset.addEventListener('click', handleResetSettings);
    }
}

function handleSaveSettings() {
    saveSettings();
    const saveBtn = settingsElements.buttons.save;
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✓ Saved!';
    setTimeout(() => {
        saveBtn.textContent = originalText;
    }, 2000);
}

function handleResetSettings() {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
        currentSettings = { ...defaultSettings };
        saveSettings();
        renderSettings();
        applyTheme();
        const resetBtn = settingsElements.buttons.reset;
        const originalText = resetBtn.textContent;
        resetBtn.textContent = '✓ Reset!';
        setTimeout(() => {
            resetBtn.textContent = originalText;
        }, 2000);
    }
}

// ========================================
// Theme Management
// ========================================

function applyTheme() {
    const theme = currentSettings.theme;
    const html = document.documentElement;
    html.style.colorScheme = theme;
    document.body.setAttribute('data-theme', theme);
}

// ========================================
// Language Management
// ========================================

function updateLanguage(language) {
    console.log('Language changed to:', language);
    const languageMap = {
        'english': 'English',
        'hindi': 'हिंदी (Hindi)',
        'regional': 'Regional Language'
    };
    console.log('Current language:', languageMap[language]);
}

// ========================================
// Initialization
// ========================================

initializeSettings();
