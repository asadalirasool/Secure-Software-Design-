import sqlite3
import bcrypt
from typing import Optional
import csv
import os
from datetime import datetime

def get_db_connection():
    conn = sqlite3.connect('password_manager.db')
    conn.row_factory = sqlite3.Row
    return conn

def save_to_csv(username: str, password: str, name: str = None, age: int = None, phone: str = None, website_url: str = None) -> None:
    """
    Save user registration data or website credentials to a CSV file with encrypted password.
    """
    # Hash the password
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt)
    
    # Create users.csv if it doesn't exist
    csv_file = 'users.csv'
    file_exists = os.path.isfile(csv_file)
    
    with open(csv_file, mode='a', newline='') as file:
        writer = csv.writer(file)
        
        # Write header if file is new
        if not file_exists:
            writer.writerow(['Username', 'Password Hash', 'Name', 'Age', 'Phone', 'Website URL', 'Registration Date'])
        
        # Write user data
        writer.writerow([
            username,
            password_hash.decode('utf-8'),
            name,
            age,
            phone,
            website_url,
            datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ])

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Create users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT,
            age INTEGER,
            phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def register_user(username: str, password: str, name: str = None, age: int = None, phone: str = None) -> None:
    """
    Register a new user by saving their data to CSV file.
    """
    # Check if username already exists
    if os.path.exists('users.csv'):
        with open('users.csv', mode='r', newline='') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if row['Username'] == username and not row['Website URL']:  # Only check main user accounts
                    raise Exception('Username already exists')
    
    # Save to CSV file
    save_to_csv(username, password, name, age, phone)

def verify_user(username: str, password: str) -> bool:
    """
    Verify a user's credentials from CSV file.
    Returns True if the credentials are valid, False otherwise.
    """
    if not os.path.exists('users.csv'):
        return False
        
    with open('users.csv', mode='r', newline='') as file:
        reader = csv.DictReader(file)
        for row in reader:
            if row['Username'] == username and not row['Website URL']:  # Only check main user accounts
                stored_hash = row['Password Hash'].encode('utf-8')
                return bcrypt.checkpw(password.encode('utf-8'), stored_hash)
    return False

def get_user_by_username(username: str) -> Optional[dict]:
    """
    Get a user by their username.
    Returns None if the user doesn't exist.
    """
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        c.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = c.fetchone()
        
        if user is None:
            return None
        
        return dict(user)
    finally:
        conn.close()

def save_website_credentials(username: str, password: str, website_url: str) -> None:
    """
    Save website credentials to data.csv file.
    """
    # Hash the password
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt)
    
    # Create data.csv if it doesn't exist
    csv_file = 'data.csv'
    file_exists = os.path.exists(csv_file)
    
    with open(csv_file, mode='a', newline='') as file:
        writer = csv.writer(file)
        
        # Write header if file is new
        if not file_exists:
            writer.writerow(['Website URL', 'Username', 'Password Hash', 'Saved Date'])
        
        # Write website credentials
        writer.writerow([
            website_url,
            username,
            password_hash.decode('utf-8'),
            datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ])

# Initialize the database when the module is imported
init_db() 