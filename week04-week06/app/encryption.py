from Crypto.Cipher import AES
import base64
import os

key = os.environ.get("ENCRYPTION_KEY", "fallbackkey1234567890fallbackkey123456").encode("utf-8")[:32]

def encrypt(data):
    cipher = AES.new(key, AES.MODE_EAX)
    nonce = cipher.nonce
    ciphertext, tag = cipher.encrypt_and_digest(data.encode('utf-8'))
    return base64.b64encode(nonce + ciphertext).decode()

def decrypt(enc_data):
    raw = base64.b64decode(enc_data)
    nonce = raw[:16]
    ciphertext = raw[16:]
    cipher = AES.new(key, AES.MODE_EAX, nonce=nonce)
    return cipher.decrypt(ciphertext).decode()
