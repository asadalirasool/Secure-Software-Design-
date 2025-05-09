// Add at the top of the file, after the existing code
let credentialsCache = null;
let lastCredentialsFetch = 0;
const CREDENTIALS_CACHE_DURATION = 30000; // 30 seconds
let isExtensionValid = true;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// Create and inject the popup HTML
function createPopup() {
    const popup = document.createElement('div');
    popup.id = 'password-manager-popup';
    popup.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10000;
        display: none;
        font-family: Arial, sans-serif;
        min-width: 300px;
    `;
    popup.innerHTML = `
        <h3 style="margin: 0 0 10px 0; color: #333;">Save Password?</h3>
        <p style="margin: 0 0 10px 0; color: #666;">Do you want to save these credentials in Password Manager?</p>
        <div style="display: flex; gap: 10px;">
            <button id="save-password-yes" style="padding: 8px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; flex: 1;">Yes</button>
            <button id="save-password-no" style="padding: 8px 20px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; flex: 1;">No</button>
        </div>
    `;
    document.body.appendChild(popup);
    return popup;
}

// Show the popup
function showSavePasswordPopup(username, password, websiteUrl) {
    let popup = document.getElementById('password-manager-popup');
    if (!popup) {
        popup = createPopup();
    }
    
    popup.style.display = 'block';
    
    // Handle Yes button click
    document.getElementById('save-password-yes').onclick = async () => {
        try {
            await saveCredentials(username, password, websiteUrl);
            popup.style.display = 'none';
        } catch (error) {
            console.error('Failed to save credentials:', error);
            alert('Failed to save credentials. Please make sure you are logged in to the Password Manager.');
        }
    };
    
    // Handle No button click
    document.getElementById('save-password-no').onclick = () => {
        popup.style.display = 'none';
    };
}

// Add debounce function at the top
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Function to check if user is logged in
async function checkLoginStatus() {
    try {
        if (!isExtensionValid) {
            console.log('Extension context invalid, attempting to reconnect...');
            return false;
        }

        console.log('Checking login status...');
        return new Promise((resolve, reject) => {
            try {
                chrome.runtime.sendMessage({ action: 'checkLoginStatus' }, response => {
                    if (chrome.runtime.lastError) {
                        console.error('Runtime error:', chrome.runtime.lastError);
                        isExtensionValid = false;
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    
                    if (response.error) {
                        console.error('Error from background script:', response.error);
                        reject(new Error(response.error));
                        return;
                    }
                    
                    console.log('Login status response:', response);
                    resolve(response.logged_in);
                });
            } catch (error) {
                console.error('Error in message sending:', error);
                isExtensionValid = false;
                reject(error);
            }
        });
    } catch (error) {
        console.error('Error checking login status:', error);
        if (error.message === 'Failed to fetch') {
            console.log('Server is not available. Make sure the Flask server is running on http://localhost:5000');
        }
        return false;
    }
}

// Function to save credentials
async function saveCredentials(username, password, websiteUrl) {
    try {
        console.log('Attempting to save credentials for:', websiteUrl);
        const response = await fetch('http://localhost:5000/save_credentials', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                websiteUrl: websiteUrl,
                username: username,
                password: password
            })
        });
        
        console.log('Save credentials response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            throw new Error(`Failed to save credentials: ${errorData.message || response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Credentials saved successfully:', result);
        return result;
    } catch (error) {
        console.error('Error saving credentials:', error);
        throw error;
    }
}

// Function to detect login forms
function detectLoginForms() {
    // Look for common login form patterns
    const loginFormSelectors = [
        'form[action*="login"]',
        'form[action*="signin"]',
        'form[action*="auth"]',
        'form[action*="account"]',
        'form[action*="user"]',
        'form[action*="session"]',
        'form[action*="password"]'
    ];

    // Find all forms on the page
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        // Check if this form looks like a login form
        const isLoginForm = loginFormSelectors.some(selector => form.matches(selector)) ||
                          form.querySelector('input[type="password"]') !== null;

        if (isLoginForm) {
            console.log('Found login form:', form);
            // Add submit event listener
            form.addEventListener('submit', async function(e) {
                try {
                    const isLoggedIn = await checkLoginStatus();
                    console.log('Is user logged in:', isLoggedIn);
                    
                    if (!isLoggedIn) {
                        console.log('User not logged in, skipping credential save');
                        return;
                    }

                    const usernameInput = form.querySelector('input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="email"], input[type="text"][name*="login"], input[type="text"]');
                    const passwordInput = form.querySelector('input[type="password"]');

                    if (usernameInput && passwordInput && usernameInput.value && passwordInput.value) {
                        console.log('Found username and password inputs');
                        
                        const username = usernameInput.value;
                        const password = passwordInput.value;
                        const websiteUrl = window.location.hostname;
                        
                        console.log('Attempting to save credentials for:', websiteUrl);
                        
                        try {
                            // Try to save credentials
                            const response = await fetch('http://localhost:5000/save_credentials', {
                                method: 'POST',
                                credentials: 'include',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                },
                                body: JSON.stringify({
                                    websiteUrl: websiteUrl,
                                    username: username,
                                    password: password
                                })
                            });

                            if (!response.ok) {
                                throw new Error(`Failed to save credentials: ${response.statusText}`);
                            }

                            const result = await response.json();
                            console.log('Credentials saved successfully:', result);
                        } catch (error) {
                            console.error('Failed to save credentials:', error);
                            // Show popup if automatic save fails
                            showSavePasswordPopup(username, password, websiteUrl);
                        }
                    }
                } catch (error) {
                    console.error('Error in form submission handler:', error);
                }
            });
        }
    });
}

// Initialize when the page is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectLoginForms);
} else {
    detectLoginForms();
}

// Also check for dynamically added forms
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            detectLoginForms();
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Function to create and show the credentials dropdown
function createCredentialsDropdown(credentials, passwordInput) {
    console.log('Creating credentials dropdown with credentials:', credentials);
    // Remove any existing dropdown
    const existingDropdown = document.getElementById('password-manager-dropdown');
    if (existingDropdown) {
        console.log('Removing existing dropdown');
        existingDropdown.remove();
    }

    const dropdown = document.createElement('div');
    dropdown.id = 'password-manager-dropdown';
    dropdown.style.cssText = `
        position: absolute;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10000;
        min-width: 200px;
        max-width: 300px;
        font-family: Arial, sans-serif;
    `;

    // Position the dropdown below the password input
    const inputRect = passwordInput.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    dropdown.style.top = `${inputRect.bottom + scrollTop}px`;
    dropdown.style.left = `${inputRect.left + scrollLeft}px`;

    console.log('Dropdown positioned at:', {
        top: dropdown.style.top,
        left: dropdown.style.left
    });

    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 8px 12px;
        border-bottom: 1px solid #eee;
        font-weight: bold;
        color: #333;
        background: #f8f9fa;
    `;
    header.textContent = 'Saved Credentials';
    dropdown.appendChild(header);

    // Add each credential
    credentials.forEach((cred, index) => {
        console.log(`Adding credential ${index + 1} to dropdown:`, cred);
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 1px solid #f5f5f5;
            transition: background-color 0.2s;
        `;
        
        // Use email as the display value
        const displayEmail = cred.email || cred.username;
        item.innerHTML = `
            <div style="flex: 1;">
                <div style="font-weight: 500; color: #333;">${displayEmail}</div>
                <div style="font-size: 12px; color: #666;">${window.location.hostname}</div>
            </div>
        `;

        item.addEventListener('click', (e) => {
            console.log('Credential selected:', cred);
            e.preventDefault();
            e.stopPropagation();
            
            // Find the username input in the same form
            const form = passwordInput.form;
            const usernameInput = form.querySelector('input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="email"], input[type="text"][name*="login"], input[type="text"]');
            
            // Fill both fields
            if (usernameInput) {
                usernameInput.value = displayEmail;
                usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            passwordInput.value = cred.password;
            passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            dropdown.remove();
        });

        item.addEventListener('mouseover', () => {
            item.style.backgroundColor = '#f5f5f5';
        });

        item.addEventListener('mouseout', () => {
            item.style.backgroundColor = 'white';
        });

        dropdown.appendChild(item);
    });

    // Add click outside listener to close dropdown
    const closeDropdown = (e) => {
        if (!dropdown.contains(e.target) && e.target !== passwordInput) {
            console.log('Clicking outside dropdown, closing');
            dropdown.remove();
            document.removeEventListener('click', closeDropdown);
        }
    };

    // Delay adding the click listener to prevent immediate closure
    setTimeout(() => {
        document.addEventListener('click', closeDropdown);
    }, 100);

    document.body.appendChild(dropdown);
    console.log('Dropdown created and added to document');
}

// Function to get credentials for a website
async function getCredentials(websiteUrl) {
    try {
        const now = Date.now();
        // Use cached credentials if available and not expired
        if (credentialsCache && (now - lastCredentialsFetch) < CREDENTIALS_CACHE_DURATION) {
            console.log('Using cached credentials');
            return credentialsCache;
        }

        console.log('Fetching fresh credentials for:', websiteUrl);
        const response = await fetch('http://localhost:5000/get_credentials', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                websiteUrl: websiteUrl
            })
        });
        
        if (!response.ok) {
            console.log('No credentials found for this website');
            return null;
        }
        
        const data = await response.json();
        if (!data || !data.credentials) {
            console.log('No credentials in response');
            return null;
        }
        
        // Update cache
        credentialsCache = data.credentials;
        lastCredentialsFetch = now;
        
        console.log('Retrieved credentials:', data);
        return data.credentials;
    } catch (error) {
        console.error('Error getting credentials:', error);
        return null;
    }
}

// Function to handle autofill
async function handleAutofill() {
    try {
        if (!isExtensionValid) {
            console.log('Extension context invalid, skipping autofill');
            return;
        }

        console.log('Starting autofill process...');
        const forms = document.querySelectorAll('form');
        console.log('Found forms:', forms.length);
        
        if (!forms || forms.length === 0) {
            console.log('No forms found on page');
            return;
        }

        // Check login status only once
        const isLoggedIn = await checkLoginStatus();
        console.log('Login status:', isLoggedIn);
        
        if (!isLoggedIn) {
            console.log('User not logged in, skipping autofill');
            return;
        }

        const websiteUrl = window.location.hostname;
        console.log('Checking credentials for website:', websiteUrl);
        
        // Add retry logic for getting credentials
        let credentials = null;
        retryCount = 0;
        
        while (retryCount < MAX_RETRIES) {
            try {
                credentials = await getCredentials(websiteUrl);
                break;
            } catch (error) {
                retryCount++;
                console.log(`Retry ${retryCount} of ${MAX_RETRIES} for getting credentials`);
                if (retryCount === MAX_RETRIES) {
                    console.error('Max retries reached for getting credentials');
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
        }
        
        if (credentials && credentials.length > 0) {
            console.log('Found credentials for autofill:', credentials.length);
            
            forms.forEach((form, index) => {
                if (!form) {
                    console.log('Form is null, skipping');
                    return;
                }
                
                const passwordInput = form.querySelector('input[type="password"]');
                if (!passwordInput) {
                    console.log('No password input found in form');
                    return;
                }
                
                console.log('Found password input, setting up event listeners');
                try {
                    // Remove existing listeners to prevent duplicates
                    const newPasswordInput = passwordInput.cloneNode(true);
                    if (passwordInput.parentNode) {
                        passwordInput.parentNode.replaceChild(newPasswordInput, passwordInput);
                    }
                    
                    // Add click event listener to password field to show dropdown
                    newPasswordInput.addEventListener('click', async (e) => {
                        if (!isExtensionValid) {
                            console.log('Extension context invalid, skipping dropdown creation');
                            return;
                        }
                        console.log('Password field clicked');
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                            await createCredentialsDropdown(credentials, newPasswordInput);
                        } catch (error) {
                            console.error('Error creating credentials dropdown:', error);
                        }
                    });

                    // Add focus event listener to password field to show dropdown
                    newPasswordInput.addEventListener('focus', async (e) => {
                        if (!isExtensionValid) {
                            console.log('Extension context invalid, skipping dropdown creation');
                            return;
                        }
                        console.log('Password field focused');
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                            await createCredentialsDropdown(credentials, newPasswordInput);
                        } catch (error) {
                            console.error('Error creating credentials dropdown:', error);
                        }
                    });
                    
                    console.log('Event listeners added successfully');
                } catch (error) {
                    console.error('Error setting up password input:', error);
                }
            });
        } else {
            console.log('No credentials found for this website');
        }
    } catch (error) {
        console.error('Error in autofill handler:', error);
        if (error.message.includes('Extension context invalidated')) {
            isExtensionValid = false;
            console.log('Extension context invalidated, will retry on next interaction');
        }
    }
}

// Initialize autofill when the page is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM Content Loaded, initializing autofill');
        // Wait for the page to fully load
        setTimeout(() => {
            handleAutofill();
        }, 1000);
    });
} else {
    console.log('Document already loaded, initializing autofill');
    // Wait for the page to fully load
    setTimeout(() => {
        handleAutofill();
    }, 1000);
}

// Also check for dynamically added forms with debouncing
const autofillObserver = new MutationObserver(debounce((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            console.log('New nodes added, checking for forms');
            // Wait for the new elements to be fully loaded
            setTimeout(() => {
                handleAutofill();
            }, 1000);
        }
    });
}, 2000)); // Increased to 2 seconds

autofillObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// Add a function to check extension validity
function checkExtensionValidity() {
    try {
        chrome.runtime.sendMessage({ action: 'ping' }, response => {
            isExtensionValid = true;
        });
    } catch (error) {
        isExtensionValid = false;
    }
}

// Add periodic extension validity check
setInterval(checkExtensionValidity, 5000); 