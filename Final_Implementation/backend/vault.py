import sqlite3
from typing import List, Dict, Any
from cryptography.fernet import Fernet
import os
from base64 import b64encode, b64decode

def get_db_connection():
    conn = sqlite3.connect('password_manager.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_vault():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Create credentials table
    c.execute('''
        CREATE TABLE IF NOT EXISTS credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            website_url TEXT NOT NULL,
            username TEXT NOT NULL,
            encrypted_password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def get_encryption_key(user_id: int) -> bytes:
    """
    Get or generate an encryption key for a user.
    The key is derived from the user's ID and a master key.
    """
    master_key = os.getenv('MASTER_KEY', 'your-master-key').encode()
    user_key = str(user_id).encode()
    return b64encode(user_key + master_key[:32 - len(user_key)])

def encrypt_password(password: str, user_id: int) -> str:
    """
    Encrypt a password using the user's encryption key.
    """
    key = get_encryption_key(user_id)
    f = Fernet(key)
    return f.encrypt(password.encode()).decode()

def decrypt_password(encrypted_password: str, user_id: int) -> str:
    """
    Decrypt a password using the user's encryption key.
    """
    key = get_encryption_key(user_id)
    f = Fernet(key)
    return f.decrypt(encrypted_password.encode()).decode()

def get_user_id(username: str) -> int:
    """
    Get a user's ID from their username.
    """
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        c.execute('SELECT id FROM users WHERE username = ?', (username,))
        result = c.fetchone()
        if result is None:
            raise Exception('User not found')
        return result['id']
    finally:
        conn.close()

def save_credentials(username: str, website_url: str, username_cred: str, password: str) -> None:
    """
    Save encrypted credentials for a user.
    """
    user_id = get_user_id(username)
    encrypted_password = encrypt_password(password, user_id)
    
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        c.execute(
            '''
            INSERT INTO credentials (user_id, website_url, username, encrypted_password)
            VALUES (?, ?, ?, ?)
            ''',
            (user_id, website_url, username_cred, encrypted_password)
        )
        conn.commit()
    finally:
        conn.close()

def get_credentials(username: str) -> List[Dict[str, Any]]:
    """
    Get all credentials for a user, with decrypted passwords.
    """
    user_id = get_user_id(username)
    
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        c.execute(
            'SELECT * FROM credentials WHERE user_id = ?',
            (user_id,)
        )
        credentials = c.fetchall()
        
        return [{
            'id': cred['id'],
            'websiteUrl': cred['website_url'],
            'username': cred['username'],
            'password': decrypt_password(cred['encrypted_password'], user_id)
        } for cred in credentials]
    finally:
        conn.close()

def delete_credentials(username: str, credential_id: int) -> None:
    """
    Delete a specific credential for a user.
    """
    user_id = get_user_id(username)
    
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        c.execute(
            'DELETE FROM credentials WHERE id = ? AND user_id = ?',
            (credential_id, user_id)
        )
        conn.commit()
    finally:
        conn.close()

 