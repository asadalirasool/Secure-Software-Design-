from flask import Flask, request, jsonify, render_template, redirect, url_for, session
from flask_cors import CORS
from functools import wraps
import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import csv
from cryptography.fernet import Fernet
from pathlib import Path

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Update CORS configuration
CORS(app, 
     resources={r"/*": {
         "origins": ["http://localhost:5000", "chrome-extension://*", "http://*", "https://*"],
         "methods": ["GET", "POST", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "Accept"],
         "supports_credentials": True,
         "expose_headers": ["Content-Type", "Authorization"],
         "max_age": 3600
     }},
     supports_credentials=True)

# Configuration
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
app.config['JWT_EXPIRATION_DELTA'] = timedelta(hours=1)
app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Changed to None to allow cross-site cookies
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS

# Ensure required directories and files exist
Path("data").mkdir(exist_ok=True)
USER_DATA_FILE = "data/user_data.csv"
SESSION_FILE = "data/session.txt"

# Initialize encryption key
def get_or_create_key():
    key_file = "data/key.key"
    if os.path.exists(key_file):
        with open(key_file, "rb") as f:
            return f.read()
    else:
        key = Fernet.generate_key()
        with open(key_file, "wb") as f:
            f.write(key)
        return key

ENCRYPTION_KEY = get_or_create_key()
cipher_suite = Fernet(ENCRYPTION_KEY)

def init_files():
    if not os.path.exists(USER_DATA_FILE):
        with open(USER_DATA_FILE, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['email', 'password'])

def get_current_user():
    try:
        if os.path.exists(SESSION_FILE):
            with open(SESSION_FILE, 'r') as f:
                email = f.read().strip()
                print(f"Current user from session: {email}")
                return email
        print("No session file found")
        return None
    except Exception as e:
        print(f"Error getting current user: {str(e)}")
        return None

def save_session(email):
    try:
        with open(SESSION_FILE, 'w') as f:
            f.write(email)
        print(f"Session saved for user: {email}")
    except Exception as e:
        print(f"Error saving session: {str(e)}")

def clear_session():
    if os.path.exists(SESSION_FILE):
        os.remove(SESSION_FILE)

def get_user_credentials_file(email):
    return f"data/credentials_{email}.csv"

def init_user_credentials(email):
    cred_file = get_user_credentials_file(email)
    if not os.path.exists(cred_file):
        with open(cred_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['website_url', 'username_or_email', 'encrypted_password'])

def check_user_exists(email):
    if not os.path.exists(USER_DATA_FILE):
        return False
    with open(USER_DATA_FILE, 'r', newline='') as f:
        reader = csv.DictReader(f)
        return any(row['email'] == email for row in reader)

def verify_credentials(email, password):
    if not os.path.exists(USER_DATA_FILE):
        return False
    with open(USER_DATA_FILE, 'r', newline='') as f:
        reader = csv.DictReader(f)
        return any(row['email'] == email and row['password'] == password for row in reader)

@app.route('/')
def index():
    current_user = get_current_user()
    if current_user:
        return render_template('dashboard.html', email=current_user)
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.form
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'message': 'Email and password are required'}), 400
        
        # Check if user already exists
        if check_user_exists(email):
            return jsonify({'message': 'User already exists'}), 400
        
        # Save new user
        with open(USER_DATA_FILE, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([email, password])
        
        # Initialize credentials file for new user
        init_user_credentials(email)
        
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.form
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'message': 'Email and password are required'}), 400
        
        # Verify credentials
        if verify_credentials(email, password):
            save_session(email)
            return redirect(url_for('index'))
        
        return jsonify({'message': 'Invalid credentials'}), 401
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    clear_session()
    return redirect(url_for('login'))

@app.route('/save_credentials', methods=['POST', 'OPTIONS'])
def save_credentials():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user = get_current_user()
        print(f"Attempting to save credentials. Current user: {current_user}")
        
        if not current_user:
            print("No user logged in")
            return jsonify({'message': 'Not logged in'}), 401
        
        data = request.get_json()
        website_url = data.get('websiteUrl')
        username = data.get('username')
        password = data.get('password')
        
        print(f"Received credentials for {website_url} from user {current_user}")
        
        if not all([website_url, username, password]):
            print("Missing required fields")
            return jsonify({'message': 'Missing required fields'}), 400
        
        # Encrypt password
        encrypted_password = cipher_suite.encrypt(password.encode()).decode()
        
        # Save credentials
        cred_file = get_user_credentials_file(current_user)
        print(f"Saving to file: {cred_file}")
        
        # Initialize file if it doesn't exist
        init_user_credentials(current_user)
        
        # Check if credentials already exist
        credentials_exist = False
        if os.path.exists(cred_file):
            with open(cred_file, 'r', newline='') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['website_url'] == website_url and row['username_or_email'] == username:
                        credentials_exist = True
                        break
        
        if not credentials_exist:
            with open(cred_file, 'a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([website_url, username, encrypted_password])
            print("Credentials saved successfully")
            return jsonify({'message': 'Credentials saved successfully'}), 201
        else:
            print("Credentials already exist")
            return jsonify({'message': 'Credentials already exist'}), 200
            
    except Exception as e:
        print(f"Error saving credentials: {str(e)}")
        return jsonify({'message': f'Error saving credentials: {str(e)}'}), 500

@app.route('/get_credentials', methods=['POST'])
def get_credentials():
    current_user = get_current_user()
    if not current_user:
        return jsonify({'message': 'Not logged in'}), 401
    
    data = request.get_json()
    website_url = data.get('websiteUrl')
    
    if not website_url:
        return jsonify({'message': 'Website URL is required'}), 400
    
    # Get credentials for website
    cred_file = get_user_credentials_file(current_user)
    if not os.path.exists(cred_file):
        return jsonify({'message': 'No credentials found'}), 404
    
    credentials = []
    with open(cred_file, 'r', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['website_url'] == website_url:
                decrypted_password = cipher_suite.decrypt(row['encrypted_password'].encode()).decode()
                credentials.append({
                    'username': row['username_or_email'],
                    'password': decrypted_password
                })
    
    if not credentials:
        return jsonify({'message': 'No credentials found for this website'}), 404
    
    return jsonify({'credentials': credentials}), 200

@app.route('/get_current_user', methods=['GET', 'OPTIONS'])
def get_current_user_status():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user = get_current_user()
        print(f"Checking current user status: {current_user}")
        return jsonify({
            'logged_in': current_user is not None,
            'email': current_user if current_user else None
        })
    except Exception as e:
        print(f"Error getting current user status: {str(e)}")
        return jsonify({'logged_in': False, 'email': None})

# Initialize required files
init_files()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 