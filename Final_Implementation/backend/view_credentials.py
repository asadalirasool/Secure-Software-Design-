import sqlite3
from vault import decrypt_password, get_user_id

def view_credentials(username):
    conn = sqlite3.connect('password_manager.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # Get user ID and information
        cursor.execute('''
            SELECT id, username, name, age, phone 
            FROM users 
            WHERE username = ?
        ''', (username,))
        
        user = cursor.fetchone()
        if not user:
            print(f"No user found with username: {username}")
            return
            
        print("\nUser Information:")
        print("-" * 80)
        print(f"Username: {user['username']}")
        print(f"Name: {user['name']}")
        print(f"Age: {user['age']}")
        print(f"Phone: {user['phone']}")
        print("-" * 80)
        
        # Get all credentials for the user
        cursor.execute('''
            SELECT id, website_url, username, encrypted_password, created_at 
            FROM credentials 
            WHERE user_id = ?
        ''', (user['id'],))
        
        credentials = cursor.fetchall()
        
        if not credentials:
            print("No saved credentials found.")
            return
        
        print("\nSaved Credentials:")
        print("-" * 80)
        for cred in credentials:
            decrypted_password = decrypt_password(cred['encrypted_password'], user['id'])
            print(f"ID: {cred['id']}")
            print(f"Website: {cred['website_url']}")
            print(f"Username: {cred['username']}")
            print(f"Password: {decrypted_password}")
            print(f"Saved on: {cred['created_at']}")
            print("-" * 80)
            
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        conn.close()

if __name__ == "__main__":
    username = input("Enter your username to view credentials: ")
    view_credentials(username) 