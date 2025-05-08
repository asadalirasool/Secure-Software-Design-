// Constants
const API_BASE_URL = 'http://localhost:5000';
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const CLIPBOARD_TIMEOUT = 10 * 1000; // 10 seconds

// DOM Elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const credentialsList = document.getElementById('credentials-list');

// State
let inactivityTimer;
let clipboardTimer;

// Utility Functions
function showError(message) {
    alert(message);
}

function startInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(logout, INACTIVITY_TIMEOUT);
}

function resetInactivityTimer() {
    startInactivityTimer();
}

function clearClipboard() {
    navigator.clipboard.writeText('');
}

function startClipboardTimer() {
    clearTimeout(clipboardTimer);
    clipboardTimer = setTimeout(clearClipboard, CLIPBOARD_TIMEOUT);
}

// API Functions
async function register(username, password, name, age, phone) {
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password,
                name,
                age,
                phone
            }),
        });

        if (!response.ok) {
            throw new Error('Registration failed');
        }

        const data = await response.json();
        showSuccess('Registration successful! Please login.');
        showLoginForm();
    } catch (error) {
        showError(error.message);
    }
}

async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data = await response.json();
        localStorage.setItem('jwt', data.token);
        return data;
    } catch (error) {
        showError(error.message);
        throw error;
    }
}

async function saveCredentials(websiteUrl, username, password) {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_BASE_URL}/save_credentials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ websiteUrl, username, password }),
        });

        if (!response.ok) {
            throw new Error('Failed to save credentials');
        }

        return await response.json();
    } catch (error) {
        showError(error.message);
        throw error;
    }
}

async function getCredentials() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_BASE_URL}/get_credentials`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch credentials');
        }

        return await response.json();
    } catch (error) {
        showError(error.message);
        throw error;
    }
}

// UI Functions
function showApp() {
    authSection.style.display = 'none';
    appSection.style.display = 'block';
    loadCredentials();
    startInactivityTimer();
}

function showAuth() {
    authSection.style.display = 'block';
    appSection.style.display = 'none';
    clearTimeout(inactivityTimer);
}

function logout() {
    localStorage.removeItem('jwt');
    showAuth();
}

function createCredentialElement(credential) {
    const div = document.createElement('div');
    div.className = 'credential-item';
    
    const info = document.createElement('div');
    info.className = 'credential-info';
    info.innerHTML = `
        <strong>${credential.websiteUrl}</strong><br>
        Username: ${credential.username}
    `;

    const actions = document.createElement('div');
    actions.className = 'credential-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy Password';
    copyBtn.onclick = async () => {
        await navigator.clipboard.writeText(credential.password);
        startClipboardTimer();
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => deleteCredential(credential.id);

    actions.appendChild(copyBtn);
    actions.appendChild(deleteBtn);
    div.appendChild(info);
    div.appendChild(actions);

    return div;
}

async function loadCredentials() {
    try {
        const credentials = await getCredentials();
        credentialsList.innerHTML = '';
        credentials.forEach(credential => {
            credentialsList.appendChild(createCredentialElement(credential));
        });
    } catch (error) {
        showError('Failed to load credentials');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('jwt');
    if (token) {
        showApp();
    }

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.form-container').forEach(form => form.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`${button.dataset.tab}-form`).classList.add('active');
        });
    });

    // Register form submission
    document.getElementById('register-btn').addEventListener('click', async () => {
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const name = document.getElementById('reg-name').value;
        const age = parseInt(document.getElementById('reg-age').value);
        const phone = document.getElementById('reg-phone').value;

        if (!username || !password || !name || !age || !phone) {
            showError('All fields are required');
            return;
        }

        await register(username, password, name, age, phone);
    });

    // Login form submission
    document.getElementById('login-btn').addEventListener('click', async () => {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            await login(username, password);
            showApp();
        } catch (error) {
            showError('Login failed');
        }
    });

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Save credentials form
    document.getElementById('save-btn').addEventListener('click', async () => {
        const websiteUrl = document.getElementById('website-url').value;
        const username = document.getElementById('website-username').value;
        const password = document.getElementById('website-password').value;

        try {
            await saveCredentials(websiteUrl, username, password);
            loadCredentials();
            document.getElementById('website-url').value = '';
            document.getElementById('website-username').value = '';
            document.getElementById('website-password').value = '';
        } catch (error) {
            showError('Failed to save credentials');
        }
    });

    // Reset inactivity timer on user interaction
    document.addEventListener('mousemove', resetInactivityTimer);
    document.addEventListener('keypress', resetInactivityTimer);
}); 