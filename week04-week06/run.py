from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')  # Ensure this template exists in the templates folder

@app.route('/login')
def login():
    return render_template('login.html')  # Ensure this template exists in the templates folder

@app.route('/register')
def register():
    return render_template('register.html')  # Ensure this template exists in the templates folder

if __name__ == '__main__':
    app.run(debug=True)
