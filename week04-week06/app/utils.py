from werkzeug.security import generate_password_hash, check_password_hash

# Function to hash the password
def hash_password(password):
    return generate_password_hash(password)

# Function to check the hashed password with the stored hash
def check_password(stored_hash, password):
    return check_password_hash(stored_hash, password)
