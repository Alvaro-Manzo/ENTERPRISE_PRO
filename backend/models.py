# -*- coding: utf-8 -*-
"""
EnterprisePro - Modelos de Base de Datos
Sistema empresarial con SQLite y Flask-SQLAlchemy
Modelos optimizados para rendimiento empresarial
"""

import sqlite3
import os
from datetime import datetime, date
import json
# import bcrypt  # Se usa el hash personalizado en auth.py
from typing import Optional, List, Dict, Any
import hashlib
import secrets

class DatabaseManager:
    """Gestor principal de base de datos con operaciones optimizadas"""
    
    def __init__(self, db_path: str = "enterprise.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Inicializa la base de datos con esquemas y datos de ejemplo"""
        if not os.path.exists(self.db_path):
            self.create_tables()
            self.insert_sample_data()
    
    def get_connection(self):
        """Obtiene conexión a la base de datos con configuración optimizada"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Permite acceso por nombre de columna
        conn.execute("PRAGMA foreign_keys = ON")  # Habilita claves foráneas
        return conn
    
    def create_tables(self):
        """Crea todas las tablas del esquema"""
        schema_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'schema.sql')
        
        if os.path.exists(schema_path):
            with open(schema_path, 'r', encoding='utf-8') as f:
                schema_sql = f.read()
            
            conn = self.get_connection()
            conn.executescript(schema_sql)
            conn.commit()
            conn.close()
            print("✅ Base de datos creada exitosamente")
        else:
            print("❌ No se encontró el archivo schema.sql")
    
    def insert_sample_data(self):
        """Inserta datos de ejemplo"""
        sample_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'sample_data.sql')
        
        if os.path.exists(sample_path):
            with open(sample_path, 'r', encoding='utf-8') as f:
                sample_sql = f.read()
            
            conn = self.get_connection()
            conn.executescript(sample_sql)
            conn.commit()
            conn.close()
            print("✅ Datos de ejemplo insertados exitosamente")

class User:
    """Modelo para gestión de usuarios"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    def _hash_password(self, password: str) -> str:
        """Hash seguro de contraseña usando PBKDF2"""
        salt = secrets.token_hex(32)
        pwdhash = hashlib.pbkdf2_hmac('sha256', 
                                     password.encode('utf-8'), 
                                     salt.encode('utf-8'), 
                                     100000)
        return f"{salt}${pwdhash.hex()}"
    
    def _verify_password(self, password: str, password_hash: str) -> bool:
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
    
    def create_user(self, email: str, password: str, first_name: str, 
                   last_name: str, role: str = 'employee', **kwargs) -> Optional[int]:
        """Crea un nuevo usuario con contraseña encriptada"""
        password_hash = self._hash_password(password)
        
        conn = self.db.get_connection()
        try:
            cursor = conn.execute("""
                INSERT INTO users (email, password_hash, first_name, last_name, role, 
                                 phone, address, profile_image)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (email, password_hash, first_name, last_name, role,
                 kwargs.get('phone'), kwargs.get('address'), kwargs.get('profile_image')))
            
            conn.commit()
            return cursor.lastrowid
        except sqlite3.IntegrityError:
            return None
        finally:
            conn.close()
    
    def authenticate(self, email: str, password: str) -> Optional[Dict]:
        """Autentica usuario y actualiza last_login"""
        conn = self.db.get_connection()
        
        user = conn.execute(
            "SELECT * FROM users WHERE email = ? AND is_active = 1", 
            (email,)
        ).fetchone()
        
        if user and self._verify_password(password, user['password_hash']):
            # Actualizar último login
            conn.execute(
                "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
                (user['id'],)
            )
            conn.commit()
            conn.close()
            
            return dict(user)
        
        conn.close()
        return None
    
    def get_by_id(self, user_id: int) -> Optional[Dict]:
        """Obtiene usuario por ID"""
        conn = self.db.get_connection()
        user = conn.execute(
            "SELECT * FROM users WHERE id = ? AND is_active = 1",
            (user_id,)
        ).fetchone()
        conn.close()
        
        return dict(user) if user else None
    
    def get_all_users(self, limit: int = 50, offset: int = 0, role: str = None) -> List[Dict]:
        """Obtiene lista de usuarios con filtros y paginación"""
        conn = self.db.get_connection()
        
        query = """
            SELECT u.*, e.employee_id, e.position, d.name as department_name
            FROM users u
            LEFT JOIN employees e ON u.id = e.user_id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE u.is_active = 1
        """
        params = []
        
        if role:
            query += " AND u.role = ?"
            params.append(role)
        
        query += " ORDER BY u.created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        users = conn.execute(query, params).fetchall()
        conn.close()
        
        return [dict(user) for user in users]
    
    def update_user(self, user_id: int, **kwargs) -> bool:
        """Actualiza información del usuario"""
        if not kwargs:
            return False
        
        # Construir query dinámicamente
        set_clause = []
        params = []
        
        for key, value in kwargs.items():
            if key == 'password':
                set_clause.append("password_hash = ?")
                params.append(self._hash_password(value))
            else:
                set_clause.append(f"{key} = ?")
                params.append(value)
        
        set_clause.append("updated_at = CURRENT_TIMESTAMP")
        params.append(user_id)
        
        conn = self.db.get_connection()
        cursor = conn.execute(f"""
            UPDATE users SET {', '.join(set_clause)}
            WHERE id = ?
        """, params)
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return success

class Employee:
    """Modelo para gestión de empleados"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    def create_employee(self, user_id: int, employee_id: str, department_id: int,
                       position: str, salary: float, hire_date: date, **kwargs) -> Optional[int]:
        """Crea perfil de empleado"""
        conn = self.db.get_connection()
        
        try:
            cursor = conn.execute("""
                INSERT INTO employees (user_id, employee_id, department_id, position,
                                     salary, hire_date, manager_id, skills, performance_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, employee_id, department_id, position, salary, hire_date,
                 kwargs.get('manager_id'), json.dumps(kwargs.get('skills', [])),
                 kwargs.get('performance_score', 0.0)))
            
            conn.commit()
            return cursor.lastrowid
        except sqlite3.IntegrityError:
            return None
        finally:
            conn.close()
    
    def get_employee_details(self, user_id: int) -> Optional[Dict]:
        """Obtiene detalles completos del empleado"""
        conn = self.db.get_connection()
        
        employee = conn.execute("""
            SELECT e.*, u.first_name, u.last_name, u.email, u.phone,
                   d.name as department_name, 
                   m.first_name as manager_first_name,
                   m.last_name as manager_last_name
            FROM employees e
            JOIN users u ON e.user_id = u.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN employees me ON e.manager_id = me.id
            LEFT JOIN users m ON me.user_id = m.id
            WHERE e.user_id = ?
        """, (user_id,)).fetchone()
        
        conn.close()
        
        if employee:
            emp_dict = dict(employee)
            if emp_dict['skills']:
                emp_dict['skills'] = json.loads(emp_dict['skills'])
            return emp_dict
        
        return None
    
    def get_department_employees(self, department_id: int) -> List[Dict]:
        """Obtiene empleados de un departamento"""
        conn = self.db.get_connection()
        
        employees = conn.execute("""
            SELECT e.*, u.first_name, u.last_name, u.email
            FROM employees e
            JOIN users u ON e.user_id = u.id
            WHERE e.department_id = ? AND e.status = 'active'
            ORDER BY u.first_name, u.last_name
        """, (department_id,)).fetchall()
        
        conn.close()
        
        result = []
        for emp in employees:
            emp_dict = dict(emp)
            if emp_dict['skills']:
                emp_dict['skills'] = json.loads(emp_dict['skills'])
            result.append(emp_dict)
        
        return result

class Project:
    """Modelo para gestión de proyectos"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    def create_project(self, name: str, description: str, created_by: int, **kwargs) -> Optional[int]:
        """Crea un nuevo proyecto"""
        conn = self.db.get_connection()
        
        try:
            cursor = conn.execute("""
                INSERT INTO projects (name, description, status, priority, start_date,
                                    end_date, deadline, budget, created_by, assigned_to,
                                    department_id, client_name)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (name, description, kwargs.get('status', 'planning'),
                 kwargs.get('priority', 'medium'), kwargs.get('start_date'),
                 kwargs.get('end_date'), kwargs.get('deadline'),
                 kwargs.get('budget', 0), created_by, kwargs.get('assigned_to'),
                 kwargs.get('department_id'), kwargs.get('client_name')))
            
            conn.commit()
            return cursor.lastrowid
        finally:
            conn.close()
    
    def get_projects(self, status: str = None, department_id: int = None,
                    limit: int = 50, offset: int = 0) -> List[Dict]:
        """Obtiene lista de proyectos con filtros"""
        conn = self.db.get_connection()
        
        query = """
            SELECT p.*, 
                   u1.first_name as created_by_name, u1.last_name as created_by_lastname,
                   u2.first_name as assigned_to_name, u2.last_name as assigned_to_lastname,
                   d.name as department_name
            FROM projects p
            LEFT JOIN users u1 ON p.created_by = u1.id
            LEFT JOIN users u2 ON p.assigned_to = u2.id
            LEFT JOIN departments d ON p.department_id = d.id
            WHERE 1=1
        """
        params = []
        
        if status:
            query += " AND p.status = ?"
            params.append(status)
        
        if department_id:
            query += " AND p.department_id = ?"
            params.append(department_id)
        
        query += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        projects = conn.execute(query, params).fetchall()
        conn.close()
        
        return [dict(project) for project in projects]
    
    def get_project_by_id(self, project_id: int) -> Optional[Dict]:
        """Obtiene proyecto por ID con detalles completos"""
        conn = self.db.get_connection()
        
        project = conn.execute("""
            SELECT p.*, 
                   u1.first_name as created_by_name, u1.last_name as created_by_lastname,
                   u2.first_name as assigned_to_name, u2.last_name as assigned_to_lastname,
                   d.name as department_name,
                   COUNT(t.id) as total_tasks,
                   SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
            FROM projects p
            LEFT JOIN users u1 ON p.created_by = u1.id
            LEFT JOIN users u2 ON p.assigned_to = u2.id
            LEFT JOIN departments d ON p.department_id = d.id
            LEFT JOIN tasks t ON p.id = t.project_id
            WHERE p.id = ?
            GROUP BY p.id
        """, (project_id,)).fetchone()
        
        conn.close()
        
        return dict(project) if project else None
    
    def update_progress(self, project_id: int, progress: float) -> bool:
        """Actualiza el progreso del proyecto"""
        conn = self.db.get_connection()
        
        cursor = conn.execute("""
            UPDATE projects 
            SET progress = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (progress, project_id))
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return success

class CompanyMetrics:
    """Modelo para métricas empresariales"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    def add_metric(self, metric_name: str, metric_value: float, 
                  metric_type: str, period: str, recorded_date: date) -> int:
        """Añade nueva métrica"""
        conn = self.db.get_connection()
        
        cursor = conn.execute("""
            INSERT INTO company_metrics (metric_name, metric_value, metric_type, period, recorded_date)
            VALUES (?, ?, ?, ?, ?)
        """, (metric_name, metric_value, metric_type, period, recorded_date))
        
        conn.commit()
        conn.close()
        
        return cursor.lastrowid
    
    def get_dashboard_metrics(self) -> Dict[str, Any]:
        """Obtiene métricas principales para dashboard"""
        conn = self.db.get_connection()
        
        # Métricas financieras más recientes
        financial_metrics = conn.execute("""
            SELECT metric_name, metric_value, recorded_date
            FROM company_metrics 
            WHERE metric_type = 'financial' 
            AND recorded_date = (
                SELECT MAX(recorded_date) 
                FROM company_metrics 
                WHERE metric_type = 'financial'
            )
        """).fetchall()
        
        # Estadísticas de proyectos
        project_stats = conn.execute("""
            SELECT 
                COUNT(*) as total_projects,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_projects,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_projects,
                AVG(progress) as avg_progress
            FROM projects
        """).fetchone()
        
        # Estadísticas de empleados
        employee_stats = conn.execute("""
            SELECT 
                COUNT(*) as total_employees,
                AVG(performance_score) as avg_performance,
                COUNT(DISTINCT department_id) as departments
            FROM employees
            WHERE status = 'active'
        """).fetchone()
        
        # Tareas recientes
        recent_tasks = conn.execute("""
            SELECT COUNT(*) as completed_tasks
            FROM tasks
            WHERE status = 'completed' 
            AND completed_at >= date('now', '-7 days')
        """).fetchone()
        
        conn.close()
        
        return {
            'financial': [dict(m) for m in financial_metrics],
            'projects': dict(project_stats),
            'employees': dict(employee_stats),
            'recent_activity': dict(recent_tasks)
        }

# Función para inicializar la base de datos
def init_db():
    """Inicializa la base de datos al ejecutar el archivo"""
    db_manager = DatabaseManager()
    print("🏢 Base de datos EnterprisePro inicializada correctamente")
    return db_manager

if __name__ == "__main__":
    # Ejecutar si el archivo se llama directamente
    init_db()
