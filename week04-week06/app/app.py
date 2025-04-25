from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

# Home Route
@app.route('/')
def home():
    return render_template('index.html')  # Home page template

# Register Route
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # Add logic for handling form submission here (e.g., saving user data)
        username = request.form['username']
        password = request.form['password']
        # For simplicity, we print the data here, but you would normally save it to a database
        print(f"Username: {username}, Password: {password}")
        return redirect(url_for('login'))  # Redirect to login page after registration
    return render_template('register.html')  # Registration page template

# Login Route
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Add login validation logic here (e.g., checking credentials)
        username = request.form['username']
        password = request.form['password']
        print(f"Login attempt - Username: {username}, Password: {password}")
        return redirect(url_for('home'))  # Redirect to home page after successful login
    return render_template('login.html')  # Login page template

if __name__ == '__main__':
    app.run(debug=True)
