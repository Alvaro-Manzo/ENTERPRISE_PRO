"""
🏢 EnterprisePro - Aplicación Principal Flask
API REST empresarial completa con autenticación JWT
Sistema escalable para gestión empresarial moderna
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime, date
import os
import json

# Importar nuestros módulos
from models import DatabaseManager, User, Employee, Project, CompanyMetrics
from auth import AuthManager, PermissionManager, AuditLogger, require_auth, require_permission, require_role, validate_input, sanitize_input

class EnterprisePro:
    """Aplicación principal EnterprisePro"""
    
    def __init__(self):
        self.app = Flask(__name__)
        self.setup_config()
        self.init_components()
        self.register_routes()
        self.setup_error_handlers()
    
    def setup_config(self):
        """Configuración de la aplicación"""
        self.app.config.update(
            SECRET_KEY=os.environ.get('SECRET_KEY', 'enterprise-pro-secret-key-2024'),
            DEBUG=os.environ.get('FLASK_DEBUG', 'True').lower() == 'true',
            JSONIFY_PRETTYPRINT_REGULAR=True
        )
        
        # Configurar CORS
        CORS(self.app, resources={
            r"/api/*": {
                "origins": ["http://localhost:3000", "http://127.0.0.1:5000"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"]
            }
        })
    
    def init_components(self):
        """Inicializar componentes del sistema"""
        self.db_manager = DatabaseManager()
        self.auth_manager = AuthManager(secret_key=self.app.config['SECRET_KEY'])
        self.audit_logger = AuditLogger(self.db_manager)
        
        # Modelos
        self.user_model = User(self.db_manager)
        self.employee_model = Employee(self.db_manager)
        self.project_model = Project(self.db_manager)
        self.metrics_model = CompanyMetrics(self.db_manager)
        
        # Hacer disponible el auth_manager en la app
        self.app.auth_manager = self.auth_manager
    
    def register_routes(self):
        """Registrar todas las rutas de la API"""
        
        # ============================================
        # 🔐 AUTENTICACIÓN
        # ============================================
        
        @self.app.route('/api/auth/login', methods=['POST'])
        def login():
            """Endpoint de login con JWT"""
            data = request.get_json()
            
            # Validar entrada
            valid, error = validate_input(data, ['email', 'password'])
            if not valid:
                return jsonify({'error': error}), 400
            
            email = sanitize_input(data['email'])
            password = data['password']
            
            # Autenticar usuario
            user = self.user_model.authenticate(email, password)
            if not user:
                self.audit_logger.log_action(
                    None, 'failed_login', 
                    ip_address=request.remote_addr,
                    user_agent=request.headers.get('User-Agent')
                )
                return jsonify({'error': 'Credenciales inválidas'}), 401
            
            # Generar tokens
            session = self.auth_manager.create_session(
                user, 
                request.remote_addr, 
                request.headers.get('User-Agent')
            )
            
            # Log successful login
            self.audit_logger.log_action(
                user['id'], 'successful_login',
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            
            return jsonify({
                'message': 'Login exitoso',
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'role': user['role']
                },
                'tokens': {
                    'access_token': session['access_token'],
                    'refresh_token': session['refresh_token'],
                    'token_type': session['token_type'],
                    'expires_in': session['expires_in']
                }
            }), 200
        
        @self.app.route('/api/auth/refresh', methods=['POST'])
        def refresh_token():
            """Renovar token de acceso"""
            data = request.get_json()
            refresh_token = data.get('refresh_token')
            
            if not refresh_token:
                return jsonify({'error': 'Refresh token requerido'}), 400
            
            new_tokens = self.auth_manager.refresh_access_token(refresh_token)
            if not new_tokens:
                return jsonify({'error': 'Refresh token inválido'}), 401
            
            return jsonify(new_tokens), 200
        
        @self.app.route('/api/auth/profile', methods=['GET'])
        @require_auth
        def get_profile():
            """Obtener perfil del usuario actual"""
            user_id = request.current_user['id']
            user = self.user_model.get_by_id(user_id)
            
            if not user:
                return jsonify({'error': 'Usuario no encontrado'}), 404
            
            # Obtener datos del empleado si existe
            employee = self.employee_model.get_employee_details(user_id)
            
            profile = {
                'user': user,
                'employee': employee
            }
            
            return jsonify(profile), 200
        
        # ============================================
        # 👥 GESTIÓN DE USUARIOS
        # ============================================
        
        @self.app.route('/api/users', methods=['GET'])
        @require_auth
        @require_permission('user.read')
        def get_users():
            """Listar usuarios con filtros y paginación"""
            page = request.args.get('page', 1, type=int)
            per_page = min(request.args.get('per_page', 20, type=int), 100)
            role = request.args.get('role')
            
            offset = (page - 1) * per_page
            
            users = self.user_model.get_all_users(
                limit=per_page,
                offset=offset,
                role=role
            )
            
            return jsonify({
                'users': users,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'has_more': len(users) == per_page
                }
            }), 200
        
        @self.app.route('/api/users', methods=['POST'])
        @require_auth
        @require_permission('user.create')
        def create_user():
            """Crear nuevo usuario"""
            data = request.get_json()
            
            # Validar entrada
            required_fields = ['email', 'password', 'first_name', 'last_name']
            valid, error = validate_input(data, required_fields)
            if not valid:
                return jsonify({'error': error}), 400
            
            # Sanitizar datos
            user_data = {
                'email': sanitize_input(data['email']),
                'first_name': sanitize_input(data['first_name']),
                'last_name': sanitize_input(data['last_name']),
                'role': data.get('role', 'employee'),
                'phone': sanitize_input(data.get('phone', '')),
                'address': sanitize_input(data.get('address', ''))
            }
            
            user_id = self.user_model.create_user(
                password=data['password'],
                **user_data
            )
            
            if not user_id:
                return jsonify({'error': 'Email ya existe o datos inválidos'}), 400
            
            # Log de auditoría
            self.audit_logger.log_action(
                request.current_user['id'],
                'user_created',
                'users',
                user_id,
                new_values=user_data,
                ip_address=request.remote_addr
            )
            
            return jsonify({
                'message': 'Usuario creado exitosamente',
                'user_id': user_id
            }), 201
        
        @self.app.route('/api/users/<int:user_id>', methods=['PUT'])
        @require_auth
        @require_permission('user.update')
        def update_user(user_id):
            """Actualizar usuario"""
            data = request.get_json()
            
            # Verificar permisos
            if not PermissionManager.can_access_user_data(
                request.current_user['role'], 
                user_id, 
                request.current_user['id']
            ):
                return jsonify({'error': 'No tienes permisos para modificar este usuario'}), 403
            
            # Filtrar campos actualizables
            updatable_fields = ['first_name', 'last_name', 'phone', 'address', 'role']
            update_data = {}
            
            for field in updatable_fields:
                if field in data:
                    update_data[field] = sanitize_input(str(data[field]))
            
            if not update_data:
                return jsonify({'error': 'No hay campos para actualizar'}), 400
            
            success = self.user_model.update_user(user_id, **update_data)
            
            if not success:
                return jsonify({'error': 'Usuario no encontrado'}), 404
            
            # Log de auditoría
            self.audit_logger.log_action(
                request.current_user['id'],
                'user_updated',
                'users',
                user_id,
                new_values=update_data,
                ip_address=request.remote_addr
            )
            
            return jsonify({'message': 'Usuario actualizado exitosamente'}), 200
        
        # ============================================
        # 📋 GESTIÓN DE PROYECTOS
        # ============================================
        
        @self.app.route('/api/projects', methods=['GET'])
        @require_auth
        @require_permission('project.read')
        def get_projects():
            """Listar proyectos con filtros"""
            page = request.args.get('page', 1, type=int)
            per_page = min(request.args.get('per_page', 20, type=int), 100)
            status = request.args.get('status')
            department_id = request.args.get('department_id', type=int)
            
            offset = (page - 1) * per_page
            
            projects = self.project_model.get_projects(
                status=status,
                department_id=department_id,
                limit=per_page,
                offset=offset
            )
            
            return jsonify({
                'projects': projects,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'has_more': len(projects) == per_page
                }
            }), 200
        
        @self.app.route('/api/projects', methods=['POST'])
        @require_auth
        @require_permission('project.create')
        def create_project():
            """Crear nuevo proyecto"""
            data = request.get_json()
            
            required_fields = ['name', 'description']
            valid, error = validate_input(data, required_fields)
            if not valid:
                return jsonify({'error': error}), 400
            
            project_data = {
                'name': sanitize_input(data['name']),
                'description': sanitize_input(data['description']),
                'status': data.get('status', 'planning'),
                'priority': data.get('priority', 'medium'),
                'budget': data.get('budget', 0),
                'department_id': data.get('department_id'),
                'assigned_to': data.get('assigned_to'),
                'client_name': sanitize_input(data.get('client_name', ''))
            }
            
            # Parsear fechas si existen
            for date_field in ['start_date', 'end_date', 'deadline']:
                if date_field in data and data[date_field]:
                    try:
                        project_data[date_field] = datetime.strptime(
                            data[date_field], '%Y-%m-%d'
                        ).date()
                    except ValueError:
                        return jsonify({
                            'error': f'Formato de fecha inválido para {date_field}. Use YYYY-MM-DD'
                        }), 400
            
            project_id = self.project_model.create_project(
                created_by=request.current_user['id'],
                **project_data
            )
            
            # Log de auditoría
            self.audit_logger.log_action(
                request.current_user['id'],
                'project_created',
                'projects',
                project_id,
                new_values=project_data,
                ip_address=request.remote_addr
            )
            
            return jsonify({
                'message': 'Proyecto creado exitosamente',
                'project_id': project_id
            }), 201
        
        @self.app.route('/api/projects/<int:project_id>', methods=['GET'])
        @require_auth
        @require_permission('project.read')
        def get_project(project_id):
            """Obtener detalles de proyecto"""
            project = self.project_model.get_project_by_id(project_id)
            
            if not project:
                return jsonify({'error': 'Proyecto no encontrado'}), 404
            
            return jsonify(project), 200
        
        @self.app.route('/api/projects/<int:project_id>/progress', methods=['PUT'])
        @require_auth
        @require_permission('project.update')
        def update_project_progress(project_id):
            """Actualizar progreso del proyecto"""
            data = request.get_json()
            progress = data.get('progress')
            
            if progress is None or not (0 <= progress <= 100):
                return jsonify({'error': 'Progreso debe estar entre 0 y 100'}), 400
            
            success = self.project_model.update_progress(project_id, progress)
            
            if not success:
                return jsonify({'error': 'Proyecto no encontrado'}), 404
            
            # Log de auditoría
            self.audit_logger.log_action(
                request.current_user['id'],
                'project_progress_updated',
                'projects',
                project_id,
                new_values={'progress': progress},
                ip_address=request.remote_addr
            )
            
            return jsonify({'message': 'Progreso actualizado exitosamente'}), 200
        
        # ============================================
        # 📊 DASHBOARD Y MÉTRICAS
        # ============================================
        
        @self.app.route('/api/dashboard/metrics', methods=['GET'])
        @require_auth
        @require_permission('metrics.read')
        def get_dashboard_metrics():
            """Obtener métricas principales para dashboard"""
            metrics = self.metrics_model.get_dashboard_metrics()
            
            # Añadir métricas calculadas en tiempo real
            current_time = datetime.now()
            
            enhanced_metrics = {
                **metrics,
                'system_info': {
                    'current_time': current_time.isoformat(),
                    'uptime': 'Sistema operativo',
                    'version': '1.0.0'
                },
                'quick_stats': {
                    'online_users': len([1, 2, 3]),  # Simulado
                    'pending_notifications': 5,  # Simulado
                    'critical_alerts': 0
                }
            }
            
            return jsonify(enhanced_metrics), 200
        
        # ============================================
        # 📁 ARCHIVOS ESTÁTICOS Y FRONTEND
        # ============================================
        
        @self.app.route('/')
        def serve_index():
            """Servir página principal"""
            return send_from_directory('../frontend', 'index.html')
        
        @self.app.route('/<path:filename>')
        def serve_static_files(filename):
            """Servir archivos estáticos del frontend"""
            return send_from_directory('../frontend', filename)
        
        # ============================================
        # 🔍 ENDPOINTS DE UTILIDAD
        # ============================================
        
        @self.app.route('/api/health', methods=['GET'])
        def health_check():
            """Health check del sistema"""
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'version': '1.0.0',
                'database': 'connected'
            }), 200
        
        @self.app.route('/api/permissions', methods=['GET'])
        @require_auth
        def get_user_permissions():
            """Obtener permisos del usuario actual"""
            role = request.current_user['role']
            permissions = PermissionManager.get_user_permissions(role)
            
            return jsonify({
                'role': role,
                'permissions': permissions
            }), 200
    
    def setup_error_handlers(self):
        """Configurar manejadores de errores"""
        
        @self.app.errorhandler(404)
        def not_found(error):
            return jsonify({'error': 'Recurso no encontrado'}), 404
        
        @self.app.errorhandler(500)
        def internal_error(error):
            return jsonify({'error': 'Error interno del servidor'}), 500
        
        @self.app.errorhandler(400)
        def bad_request(error):
            return jsonify({'error': 'Solicitud inválida'}), 400
    
    def run(self, host='127.0.0.1', port=5000, debug=None):
        """Ejecutar la aplicación"""
        if debug is None:
            debug = self.app.config['DEBUG']
        
        print(f"🏢 EnterprisePro iniciando en http://{host}:{port}")
        print(f"📊 Dashboard disponible en http://{host}:{port}")
        print(f"🔗 API endpoints en http://{host}:{port}/api/")
        
        self.app.run(host=host, port=port, debug=debug)

# Función para crear la aplicación
def create_app():
    """Factory function para crear la aplicación"""
    return EnterprisePro()

if __name__ == '__main__':
    # Ejecutar aplicación
    enterprise_app = create_app()
    enterprise_app.run()
