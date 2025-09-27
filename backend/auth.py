"""
🔐 EnterprisePro - Sistema de Autenticación JWT
Manejo seguro de autenticación, autorización y sesiones
"""

from functools import wraps
from datetime import datetime, timedelta
import jwt
import hashlib
import secrets
from typing import Optional, Dict, Any
import json

class AuthManager:
    """Gestor de autenticación con JWT y seguridad avanzada"""
    
    def __init__(self, secret_key: str = None, algorithm: str = 'HS256'):
        self.secret_key = secret_key or self._generate_secret_key()
        self.algorithm = algorithm
        self.token_expiration = timedelta(hours=8)  # 8 horas de sesión
        self.refresh_expiration = timedelta(days=7)  # 7 días para refresh
    
    def _generate_secret_key(self) -> str:
        """Genera clave secreta segura"""
        return secrets.token_urlsafe(32)
    
    def hash_password(self, password: str) -> str:
        """Hash seguro de contraseña usando PBKDF2"""
        salt = secrets.token_hex(32)
        pwdhash = hashlib.pbkdf2_hmac('sha256', 
                                     password.encode('utf-8'), 
                                     salt.encode('utf-8'), 
                                     100000)
        return f"{salt}${pwdhash.hex()}"
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verifica contraseña contra hash"""
        try:
            salt, stored_hash = password_hash.split('$')
            pwdhash = hashlib.pbkdf2_hmac('sha256',
                                         password.encode('utf-8'),
                                         salt.encode('utf-8'),
                                         100000)
            return pwdhash.hex() == stored_hash
        except:
            return False
    
    def generate_tokens(self, user_data: Dict) -> Dict[str, str]:
        """Genera tokens de acceso y refresh"""
        now = datetime.utcnow()
        
        # Token de acceso
        access_payload = {
            'user_id': user_data['id'],
            'email': user_data['email'],
            'role': user_data['role'],
            'exp': now + self.token_expiration,
            'iat': now,
            'type': 'access'
        }
        
        # Token de refresh
        refresh_payload = {
            'user_id': user_data['id'],
            'exp': now + self.refresh_expiration,
            'iat': now,
            'type': 'refresh'
        }
        
        access_token = jwt.encode(access_payload, self.secret_key, algorithm=self.algorithm)
        refresh_token = jwt.encode(refresh_payload, self.secret_key, algorithm=self.algorithm)
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'expires_in': int(self.token_expiration.total_seconds())
        }
    
    def verify_token(self, token: str) -> Optional[Dict]:
        """Verifica y decodifica token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def refresh_access_token(self, refresh_token: str) -> Optional[Dict[str, str]]:
        """Genera nuevo token de acceso usando refresh token"""
        payload = self.verify_token(refresh_token)
        
        if not payload or payload.get('type') != 'refresh':
            return None
        
        # Simular obtención de datos del usuario (en app real vendría de DB)
        user_data = {
            'id': payload['user_id'],
            'email': 'user@example.com',  # Obtener de DB
            'role': 'employee'  # Obtener de DB
        }
        
        return self.generate_tokens(user_data)
    
    def create_session(self, user_data: Dict, ip_address: str = None, 
                      user_agent: str = None) -> Dict:
        """Crea sesión completa con metadata"""
        tokens = self.generate_tokens(user_data)
        
        session_data = {
            'user_id': user_data['id'],
            'email': user_data['email'],
            'role': user_data['role'],
            'ip_address': ip_address,
            'user_agent': user_agent,
            'created_at': datetime.utcnow().isoformat(),
            **tokens
        }
        
        return session_data

class PermissionManager:
    """Gestor de permisos y roles empresariales"""
    
    # Definición de permisos por rol
    ROLE_PERMISSIONS = {
        'admin': [
            'user.create', 'user.read', 'user.update', 'user.delete',
            'employee.create', 'employee.read', 'employee.update', 'employee.delete',
            'project.create', 'project.read', 'project.update', 'project.delete',
            'task.create', 'task.read', 'task.update', 'task.delete',
            'department.create', 'department.read', 'department.update', 'department.delete',
            'metrics.read', 'reports.read', 'audit.read',
            'system.config', 'system.backup'
        ],
        'manager': [
            'user.read', 'user.update',
            'employee.read', 'employee.update',
            'project.create', 'project.read', 'project.update',
            'task.create', 'task.read', 'task.update', 'task.delete',
            'metrics.read', 'reports.read',
            'team.manage'
        ],
        'employee': [
            'user.read', 'user.update_own',
            'project.read', 'task.read', 'task.update_own',
            'timesheet.create', 'timesheet.read_own'
        ]
    }
    
    @classmethod
    def has_permission(cls, role: str, permission: str) -> bool:
        """Verifica si un rol tiene un permiso específico"""
        return permission in cls.ROLE_PERMISSIONS.get(role, [])
    
    @classmethod
    def get_user_permissions(cls, role: str) -> list:
        """Obtiene todos los permisos de un rol"""
        return cls.ROLE_PERMISSIONS.get(role, [])
    
    @classmethod
    def can_access_user_data(cls, user_role: str, target_user_id: int, 
                           current_user_id: int) -> bool:
        """Verifica si puede acceder a datos de otro usuario"""
        if user_role == 'admin':
            return True
        elif user_role == 'manager':
            return True  # Los managers pueden ver su equipo (simplificado)
        else:
            return target_user_id == current_user_id
    
    @classmethod
    def can_modify_project(cls, user_role: str, user_id: int, 
                          project_creator_id: int, project_assigned_id: int) -> bool:
        """Verifica permisos para modificar proyecto"""
        if user_role == 'admin':
            return True
        elif user_role == 'manager':
            return user_id in [project_creator_id, project_assigned_id]
        else:
            return user_id == project_assigned_id

def require_auth(f):
    """Decorador para endpoints que requieren autenticación"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from flask import request, jsonify, current_app
        
        # Obtener token del header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Token de acceso requerido'}), 401
        
        token = auth_header.split(' ')[1]
        auth_manager = getattr(current_app, 'auth_manager', None)
        
        if not auth_manager:
            return jsonify({'error': 'Configuración de autenticación no encontrada'}), 500
        
        payload = auth_manager.verify_token(token)
        if not payload:
            return jsonify({'error': 'Token inválido o expirado'}), 401
        
        # Añadir datos del usuario al request
        request.current_user = {
            'id': payload['user_id'],
            'email': payload['email'],
            'role': payload['role']
        }
        
        return f(*args, **kwargs)
    
    return decorated_function

def require_permission(permission: str):
    """Decorador para endpoints que requieren permisos específicos"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import request, jsonify
            
            if not hasattr(request, 'current_user'):
                return jsonify({'error': 'Usuario no autenticado'}), 401
            
            user_role = request.current_user['role']
            
            if not PermissionManager.has_permission(user_role, permission):
                return jsonify({'error': 'Permisos insuficientes'}), 403
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def require_role(required_roles):
    """Decorador para endpoints que requieren roles específicos"""
    if isinstance(required_roles, str):
        required_roles = [required_roles]
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import request, jsonify
            
            if not hasattr(request, 'current_user'):
                return jsonify({'error': 'Usuario no autenticado'}), 401
            
            user_role = request.current_user['role']
            
            if user_role not in required_roles:
                return jsonify({
                    'error': f'Rol requerido: {", ".join(required_roles)}. Tu rol: {user_role}'
                }), 403
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

class AuditLogger:
    """Sistema de auditoría para acciones críticas"""
    
    def __init__(self, db_manager):
        self.db = db_manager
    
    def log_action(self, user_id: int, action: str, table_name: str = None,
                  record_id: int = None, old_values: Dict = None, 
                  new_values: Dict = None, ip_address: str = None,
                  user_agent: str = None):
        """Registra acción en log de auditoría"""
        conn = self.db.get_connection()
        
        try:
            conn.execute("""
                INSERT INTO audit_logs (user_id, action, table_name, record_id,
                                       old_values, new_values, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, action, table_name, record_id,
                 json.dumps(old_values) if old_values else None,
                 json.dumps(new_values) if new_values else None,
                 ip_address, user_agent))
            
            conn.commit()
        finally:
            conn.close()
    
    def get_user_activity(self, user_id: int, limit: int = 50) -> list:
        """Obtiene actividad reciente del usuario"""
        conn = self.db.get_connection()
        
        activities = conn.execute("""
            SELECT action, table_name, record_id, created_at
            FROM audit_logs
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        """, (user_id, limit)).fetchall()
        
        conn.close()
        
        return [dict(activity) for activity in activities]

# Función para validar entrada de datos
def validate_input(data: Dict, required_fields: list) -> tuple:
    """Valida que los campos requeridos estén presentes"""
    missing_fields = []
    
    for field in required_fields:
        if field not in data or not data[field]:
            missing_fields.append(field)
    
    if missing_fields:
        return False, f"Campos requeridos faltantes: {', '.join(missing_fields)}"
    
    return True, None

# Función para sanitizar entrada
def sanitize_input(value: str) -> str:
    """Sanitiza entrada de texto para prevenir inyecciones"""
    if not isinstance(value, str):
        return value
    
    # Remover caracteres peligrosos
    dangerous_chars = ['<', '>', '"', "'", '&', ';', '(', ')', '|', '*']
    
    for char in dangerous_chars:
        value = value.replace(char, '')
    
    return value.strip()

if __name__ == "__main__":
    # Ejemplo de uso
    auth = AuthManager()
    print("🔐 Sistema de autenticación inicializado")
    
    # Ejemplo de hash de contraseña
    password = "admin123"
    hashed = auth.hash_password(password)
    print(f"Contraseña hasheada: {hashed[:50]}...")
    
    # Verificar contraseña
    is_valid = auth.verify_password(password, hashed)
    print(f"Verificación: {'✅ Válida' if is_valid else '❌ Inválida'}")
