// Store the JWT token
let authToken = null;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SAVE_CREDENTIALS') {
        saveCredentials(message.data);
    }
});

// Function to save credentials
async function saveCredentials(credentials) {
    try {
        const response = await fetch('http://localhost:5000/save_credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        if (response.ok) {
            console.log('Credentials saved successfully');
        } else {
            console.error('Failed to save credentials');
        }
    } catch (error) {
        console.error('Error saving credentials:', error);
    }
}

// Listen for storage changes to update auth token
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.authToken) {
        authToken = changes.authToken.newValue;
    }
});

// Initialize auth token from storage
chrome.storage.local.get(['authToken'], (result) => {
    if (result.authToken) {
        authToken = result.authToken;
    }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'autofill') {
        autofillCredentials(request.credentials);
    }
});

// Function to autofill credentials on the current page
async function autofillCredentials(credentials) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Execute content script to fill the form
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: fillForm,
            args: [credentials]
        });
    } catch (error) {
        console.error('Autofill failed:', error);
    }
}

// Content script function to fill the form
function fillForm(credentials) {
    // Find username and password fields
    const usernameField = document.querySelector('input[type="text"], input[type="email"], input[name="username"], input[name="email"]');
    const passwordField = document.querySelector('input[type="password"]');

    if (usernameField && passwordField) {
        // Fill the fields
        usernameField.value = credentials.username;
        passwordField.value = credentials.password;

        // Trigger input events to ensure the form recognizes the changes
        usernameField.dispatchEvent(new Event('input', { bubbles: true }));
        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

// Listen for tab updates to check if we should autofill
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        try {
            // Get the stored JWT token
            const { jwt } = await chrome.storage.local.get('jwt');
            if (!jwt) return;

            // Get credentials for the current domain
            const response = await fetch('http://localhost:5000/get_credentials', {
                headers: {
                    'Authorization': `Bearer ${jwt}`
                }
            });

            if (!response.ok) return;

            const credentials = await response.json();
            const currentDomain = new URL(tab.url).hostname;

            // Find matching credentials
            const matchingCredential = credentials.find(cred => {
                try {
                    const credDomain = new URL(cred.websiteUrl).hostname;
                    return credDomain === currentDomain;
                } catch {
                    return false;
                }
            });

            if (matchingCredential) {
                // Send message to content script to autofill
                chrome.tabs.sendMessage(tabId, {
                    action: 'autofill',
                    credentials: matchingCredential
                });
            }
        } catch (error) {
            console.error('Error checking for autofill:', error);
        }
    }
}); 