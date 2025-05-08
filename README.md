# Secure Password Manager Chrome Extension

A secure password manager Chrome extension with JWT authentication and encrypted storage.

## Features

- 🔐 Secure user authentication with JWT
- 🔒 Encrypted password storage
- 🌐 Automatic form filling
- 📋 Secure clipboard management
- ⏱️ Auto-logout after inactivity
- 🛡️ Master password protection

## Setup

### Backend Setup

1. Install Python dependencies:
```bash
pip install flask flask-cors pyjwt bcrypt python-dotenv cryptography
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the secret keys in `.env` with secure values

3. Run the Flask backend:
```bash
python app.py
```

### Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the extension directory
4. The extension icon should appear in your Chrome toolbar

## Security Features

- Passwords are hashed using bcrypt
- Credentials are encrypted using Fernet (symmetric encryption)
- JWT tokens for secure authentication
- Auto-clearing clipboard after 10 seconds
- 5-minute inactivity timeout
- Master password required for first use

## API Endpoints

- `POST /register` - Register a new user
- `POST /login` - Login and get JWT token
- `POST /save_credentials` - Save new credentials (requires JWT)
- `GET /get_credentials` - Get all saved credentials (requires JWT)
- `DELETE /delete_credentials/<id>` - Delete specific credentials (requires JWT)

## Development

### Project Structure

```
password_manager_extension/
├── manifest.json
├── popup.html
├── popup.js
├── background.js
├── styles.css
└── icons/
    └── icon128.png

backend/
├── app.py
├── auth.py
├── vault.py
└── .env
```

### Security Considerations

1. Never commit the `.env` file
2. Use strong, unique keys for JWT and master encryption
3. Keep the extension and backend up to date
4. Regularly audit the code for security vulnerabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details 