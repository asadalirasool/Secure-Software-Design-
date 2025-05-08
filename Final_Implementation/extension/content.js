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
    `;
    popup.innerHTML = `
        <h3 style="margin: 0 0 10px 0;">Save Password?</h3>
        <p style="margin: 0 0 10px 0;">Do you want to save these credentials in Password Manager?</p>
        <div style="display: flex; gap: 10px;">
            <button id="save-password-yes" style="padding: 5px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Yes</button>
            <button id="save-password-no" style="padding: 5px 15px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">No</button>
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
    document.getElementById('save-password-yes').onclick = () => {
        chrome.runtime.sendMessage({
            type: 'SAVE_CREDENTIALS',
            data: {
                websiteUrl,
                username,
                password
            }
        });
        popup.style.display = 'none';
    };
    
    // Handle No button click
    document.getElementById('save-password-no').onclick = () => {
        popup.style.display = 'none';
    };
}

// Listen for form submissions
document.addEventListener('submit', async function(event) {
    const form = event.target;
    
    // Find username/email and password fields
    const usernameField = form.querySelector('input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="email"], input[type="text"][name*="login"]');
    const passwordField = form.querySelector('input[type="password"]');
    
    if (usernameField && passwordField) {
        const username = usernameField.value;
        const password = passwordField.value;
        const websiteUrl = window.location.hostname;
        
        // Show popup to ask user
        showSavePasswordPopup(username, password, websiteUrl);
    }
});

// Listen for password field changes
document.addEventListener('input', function(event) {
    if (event.target.type === 'password') {
        const form = event.target.closest('form');
        if (form) {
            const usernameField = form.querySelector('input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="email"], input[type="text"][name*="login"]');
            if (usernameField) {
                const websiteUrl = window.location.hostname;
                
                // Show popup to ask user
                showSavePasswordPopup(usernameField.value, event.target.value, websiteUrl);
            }
        }
    }
}); 