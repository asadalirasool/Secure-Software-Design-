# Secure Password Manager

## 📌 Project Overview
The **Secure Password Manager** is a **desktop/web-based application** designed to securely store, manage, and retrieve user credentials. It ensures **strong encryption, authentication, and access control**, helping users protect their sensitive information from cyber threats.

## 🚀 Features
- 🔑 **Secure Authentication** (Master Password with PBKDF2/Argon2 Hashing)
- 🔒 **AES-256 Encryption** for storing passwords
- 🔐 **Role-Based Access Control (RBAC)** for multi-user scenarios
- 🛡️ **Brute Force Protection** (Account Lockout Mechanism)
- 📝 **Password Generator** for strong passwords
- 📋 **Secure Clipboard Handling** to prevent keylogging attacks
- ⏳ **Auto Logout** after inactivity

## 🏗️ Tech Stack
### **Frontend:**
- 🖥️ **Desktop App:** Python (Tkinter/PyQt)
- 🌐 **Web App:** HTML, CSS, JavaScript (React.js optional)

### **Backend:**
- 🐍 **Python (Flask/Django)** or 🟢 **Node.js (Express.js)**

### **Database:**
- 🗄️ **SQLite/MySQL** (Encrypted Storage)

## 🔍 Security Measures
- **Strong Password Hashing:** PBKDF2 or Argon2 for master password
- **Data Encryption:** AES-256 encryption for secure storage
- **Secure API Endpoints:** JWT authentication for web access
- **Input Validation:** Protection against SQL Injection & XSS
- **Penetration Testing:** Using OWASP ZAP & Burp Suite

## 📂 Folder Structure
```
📦 Secure-Password-Manager
 ┣ 📂 backend
 ┃ ┣ 📜 app.py  # Flask/Node.js backend
 ┃ ┣ 📜 database.db  # SQLite database
 ┃ ┗ 📜 requirements.txt  # Dependencies
 ┣ 📂 frontend
 ┃ ┣ 📜 index.html  # UI
 ┃ ┣ 📜 style.css  # Styling
 ┃ ┣ 📜 script.js  # JS functionality
 ┃ ┗ 📜 main.py  # Tkinter/PyQt App
 ┣ 📜 README.md  # Documentation
 ┣ 📜 .gitignore  # Git Ignore file
 ┗ 📜 LICENSE  # License file
```

## 🛠️ Installation & Setup
### **1️⃣ Clone the Repository**
```bash
  git clone https://github.com/asadali.rasool/Secure-Password-Manager.git
  cd Secure-Password-Manager
```

### **2️⃣ Install Dependencies**
For Python (Flask Backend):
```bash
  pip install -r backend/requirements.txt
```

For Node.js (Express Backend):
```bash
  cd backend && npm install
```

### **3️⃣ Run the Application**
For Python Flask:
```bash
  python backend/app.py
```
For Node.js:
```bash
  node backend/app.js
```

### **4️⃣ Access the Web App**
```
http://localhost:5000
```

## 🧪 Testing & Security Analysis
Run security testing tools:
```bash
  owasp-zap-cli quick-scan http://localhost:5000
```

## 📜 License
This project is licensed under the **MIT License**.

## 🤝 Contributing
We welcome contributions! Follow these steps:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature-xyz`).
3. Commit your changes (`git commit -m 'Added new feature'`).
4. Push to your fork (`git push origin feature-xyz`).
5. Open a pull request.

## 📬 Contact
For any queries, reach out at [your email] or create an issue in the repository.

---
🔐 **Stay secure! Use strong passwords & encrypt your data!** 🚀

