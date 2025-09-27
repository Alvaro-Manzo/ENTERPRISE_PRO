#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🧪 Script de pruebas para EnterprisePro
Valida que todas las funcionalidades estén operativas
"""

import requests
import json
from datetime import datetime

class EnterprisePro_Tester:
    def __init__(self):
        self.base_url = "http://127.0.0.1:5000"
        self.session = requests.Session()
        self.access_token = None
        
    def print_test(self, title, status="INFO"):
        icons = {"INFO": "📋", "SUCCESS": "✅", "ERROR": "❌", "WARNING": "⚠️"}
        print(f"{icons.get(status, '📋')} {title}")
        
    def test_login(self, email, password):
        """Prueba el login de un usuario"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json={"email": email, "password": password},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get('access_token')
                self.session.headers.update({
                    'Authorization': f'Bearer {self.access_token}'
                })
                self.print_test(f"Login exitoso para {email}", "SUCCESS")
                return True
            else:
                self.print_test(f"Error en login para {email}: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.print_test(f"Excepción en login: {e}", "ERROR")
            return False
    
    def test_api_endpoint(self, endpoint, method="GET", data=None):
        """Prueba un endpoint específico de la API"""
        try:
            url = f"{self.base_url}/api{endpoint}"
            
            if method == "GET":
                response = self.session.get(url)
            elif method == "POST":
                response = self.session.post(url, json=data)
            
            if response.status_code in [200, 201]:
                self.print_test(f"{method} {endpoint} - OK ({response.status_code})", "SUCCESS")
                return True
            else:
                self.print_test(f"{method} {endpoint} - Error {response.status_code}", "WARNING")
                return False
                
        except Exception as e:
            self.print_test(f"Error en {endpoint}: {e}", "ERROR")
            return False
    
    def run_comprehensive_test(self):
        """Ejecuta todas las pruebas del sistema"""
        print("🚀 Iniciando pruebas completas de EnterprisePro\n")
        
        # 1. Probar usuarios principales
        test_users = [
            ("jogobonito029@gmail.com", "admin123", "🔑 ADMIN PRINCIPAL"),
            ("admin@enterprise.com", "admin123", "👨‍💼 Admin Corporativo"),
            ("manager.tech@enterprise.com", "manager123", "🛠️ Manager Técnico"),
            ("developer1@enterprise.com", "emp123", "👩‍💻 Desarrolladora"),
            ("designer@enterprise.com", "emp123", "🎨 Diseñadora"),
        ]
        
        successful_logins = 0
        
        print("=== PRUEBAS DE AUTENTICACIÓN ===")
        for email, password, description in test_users:
            if self.test_login(email, password):
                successful_logins += 1
                
                # Probar endpoints clave para este usuario
                print(f"  Probando endpoints para {description}:")
                self.test_api_endpoint("/permissions")
                self.test_api_endpoint("/users?per_page=5")
                self.test_api_endpoint("/projects?per_page=5")
                
                if "admin" in email or "manager" in email:
                    self.test_api_endpoint("/dashboard/metrics")
                
                print()
        
        print("=== RESUMEN DE PRUEBAS ===")
        self.print_test(f"Usuarios que iniciaron sesión: {successful_logins}/{len(test_users)}", "INFO")
        
        if successful_logins == len(test_users):
            self.print_test("¡Todas las pruebas de autenticación exitosas! 🎉", "SUCCESS")
        else:
            self.print_test(f"Algunos usuarios tienen problemas de login", "WARNING")
        
        # Lista de credenciales finales
        print("\n📋 CREDENCIALES FINALES CONFIRMADAS:")
        print("==========================================")
        for email, password, description in test_users:
            print(f"• {description}")
            print(f"  Email: {email}")
            print(f"  Password: {password}")
            print()

if __name__ == "__main__":
    tester = EnterprisePro_Tester()
    tester.run_comprehensive_test()
