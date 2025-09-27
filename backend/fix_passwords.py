# -*- coding: utf-8 -*-
"""
Fix passwords in database
"""
import sqlite3
import hashlib
import secrets

def hash_password(password):
    """Hash seguro de contraseña usando PBKDF2"""
    salt = secrets.token_hex(32)
    pwdhash = hashlib.pbkdf2_hmac('sha256', 
                                 password.encode('utf-8'), 
                                 salt.encode('utf-8'), 
                                 100000)
    return f"{salt}${pwdhash.hex()}"

def fix_passwords():
    conn = sqlite3.connect("enterprise.db")
    
    # Contraseñas para usuarios
    passwords = {
        'jogobonito029@gmail.com': 'admin123',
        'admin@enterprise.com': 'admin123',
        'ceo@enterprise.com': 'admin123',
        'manager.tech@enterprise.com': 'manager123',
        'manager.sales@enterprise.com': 'manager123',
        'manager.hr@enterprise.com': 'manager123',
        'developer1@enterprise.com': 'emp123',
        'developer2@enterprise.com': 'emp123',
        'designer@enterprise.com': 'emp123',
        'sales1@enterprise.com': 'emp123',
        'sales2@enterprise.com': 'emp123',
        'hr1@enterprise.com': 'emp123'
    }
    
    for email, password in passwords.items():
        hashed = hash_password(password)
        conn.execute("UPDATE users SET password_hash = ? WHERE email = ?", (hashed, email))
        print(f"Updated password for {email}")
    
    conn.commit()
    conn.close()
    print("✅ Passwords updated successfully")

if __name__ == "__main__":
    fix_passwords()
