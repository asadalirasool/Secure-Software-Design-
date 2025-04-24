from flask import Flask, request, jsonify 
from auth import hash_password, verify_password, generate_token

app = Flask(__name__)
users = {}

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get("username")
    password = hash_password(data.get("password"))
    users[username] = password
    return jsonify({"msg": "Registered Successfully"})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if username in users and verify_password(password, users[username]):
        token = generate_token(username)
        return jsonify({"token": token})
    else:
        return jsonify({"msg": "Invalid Credentials"}), 401

if __name__ == '__main__':
    app.run(debug=True)
