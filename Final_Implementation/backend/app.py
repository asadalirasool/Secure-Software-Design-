from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from auth import register_user, verify_user, save_website_credentials

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configuration
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
app.config['JWT_EXPIRATION_DELTA'] = timedelta(hours=1)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = data['username']
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    name = data.get('name')
    age = data.get('age')
    phone = data.get('phone')
    
    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400
    
    try:
        register_user(username, password, name, age, phone)
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': 'Missing username or password'}), 400
    
    try:
        if verify_user(username, password):
            token = jwt.encode({
                'username': username,
                'exp': datetime.utcnow() + app.config['JWT_EXPIRATION_DELTA']
            }, app.config['SECRET_KEY'])
            
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'showToast': True
            }), 200
        else:
            return jsonify({'message': 'Invalid credentials', 'showToast': True}), 401
    except Exception as e:
        return jsonify({'message': str(e), 'showToast': True}), 400

@app.route('/save_credentials', methods=['POST'])
def save_credentials():
    data = request.get_json()
    website_url = data.get('websiteUrl')
    username = data.get('username')
    password = data.get('password')
    
    if not all([website_url, username, password]):
        return jsonify({'message': 'Missing required fields'}), 400
    
    try:
        save_website_credentials(username, password, website_url)
        return jsonify({'message': 'Credentials saved successfully'}), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 