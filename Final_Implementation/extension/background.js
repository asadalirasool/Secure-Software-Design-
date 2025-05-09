// Initialize variables
let authToken = null;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request);
    
    if (request.action === 'checkLoginStatus') {
        checkLoginStatus()
            .then(response => {
                console.log('Login status response:', response);
                sendResponse(response);
            })
            .catch(error => {
                console.error('Error checking login status:', error);
                sendResponse({ logged_in: false, error: error.message });
            });
        return true; // Keep the message channel open for async response
    }

    if (request.action === 'ping') {
        sendResponse({ status: 'ok' });
        return true;
    }
});

// Function to check login status
async function checkLoginStatus() {
    try {
        const response = await fetch('http://localhost:5000/get_current_user', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Login status data:', data);
        return {
            logged_in: data.logged_in,
            email: data.email
        };
    } catch (error) {
        console.error('Error in checkLoginStatus:', error);
        return {
            logged_in: false,
            error: error.message
        };
    }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SAVE_CREDENTIALS') {
        saveCredentials(message.data)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

// Function to save credentials
async function saveCredentials(credentials) {
    try {
        const response = await fetch('http://localhost:5000/save_credentials', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        if (!response.ok) {
            throw new Error(`Failed to save credentials: ${response.statusText}`);
        }

        console.log('Credentials saved successfully');
        return await response.json();
    } catch (error) {
        console.error('Error saving credentials:', error);
        throw error;
    }
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.authToken) {
        authToken = changes.authToken.newValue;
    }
});

// Initialize authToken from storage
chrome.storage.local.get(['authToken'], (result) => {
    authToken = result.authToken;
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'autofill') {
        autofillCredentials(request.credentials)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

// Function to autofill credentials on the current page
async function autofillCredentials(credentials) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            throw new Error('No active tab found');
        }

        // Execute content script to fill the form
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: fillForm,
            args: [credentials]
        });
    } catch (error) {
        console.error('Autofill failed:', error);
        throw error;
    }
}

// Content script function to fill the form
function fillForm(credentials) {
    try {
        // Find username and password fields
        const usernameField = document.querySelector('input[type="text"], input[type="email"], input[name="username"], input[name="email"]');
        const passwordField = document.querySelector('input[type="password"]');

        if (!usernameField || !passwordField) {
            throw new Error('Required form fields not found');
        }

        // Fill the fields
        usernameField.value = credentials.username;
        passwordField.value = credentials.password;

        // Trigger input events to ensure the form recognizes the changes
        usernameField.dispatchEvent(new Event('input', { bubbles: true }));
        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (error) {
        console.error('Error filling form:', error);
        throw error;
    }
}

// Listen for tab updates to check if we should autofill
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        try {
            const response = await fetch('http://localhost:5000/get_credentials', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ websiteUrl: new URL(tab.url).hostname })
            });

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            if (data.credentials && data.credentials.length > 0) {
                // Send message to content script to autofill
                chrome.tabs.sendMessage(tabId, {
                    action: 'autofill',
                    credentials: data.credentials[0]
                });
            }
        } catch (error) {
            console.error('Error checking for autofill:', error);
        }
    }
});

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
}); 