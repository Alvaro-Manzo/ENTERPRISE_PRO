/**
 * 🔐 EnterprisePro - Gestión de Autenticación
 * Manejo del login, logout y estado de autenticación
 */

class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.userPermissions = [];
        this.init();
    }

    /**
     * Inicializar gestión de autenticación
     */
    init() {
        // Verificar si existe token guardado
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user_data');

        if (token && userData) {
            this.isAuthenticated = true;
            this.currentUser = JSON.parse(userData);
            this.showMainApp();
        } else {
            this.showLoginModal();
        }
    }

    /**
     * Realizar login
     */
    async login(email, password) {
        try {
            const response = await apiClient.login(email, password);
            
            if (response) {
                this.isAuthenticated = true;
                this.currentUser = response.user;
                
                // Obtener permisos del usuario
                await this.loadUserPermissions();
                
                this.showMainApp();
                showNotification(`¡Bienvenido ${response.user.first_name}!`, 'success');
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Login error:', error);
            showNotification('Error al iniciar sesión. Verifica tus credenciales.', 'error');
            return false;
        }
    }

    /**
     * Cargar permisos del usuario
     */
    async loadUserPermissions() {
        try {
            const response = await apiClient.getUserPermissions();
            if (response) {
                this.userPermissions = response.permissions;
            }
        } catch (error) {
            console.error('Error loading permissions:', error);
        }
    }

    /**
     * Verificar si usuario tiene permiso específico
     */
    hasPermission(permission) {
        return this.userPermissions.includes(permission);
    }

    /**
     * Cerrar sesión
     */
    logout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.userPermissions = [];
        
        // Limpiar localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        
        // Mostrar login modal
        this.showLoginModal();
        
        showNotification('Sesión cerrada exitosamente', 'info');
    }

    /**
     * Mostrar modal de login
     */
    showLoginModal() {
        const loginModal = document.getElementById('loginModal');
        const mainApp = document.getElementById('mainApp');
        
        if (loginModal && mainApp) {
            loginModal.classList.add('active');
            mainApp.style.display = 'none';
        }
    }

    /**
     * Mostrar aplicación principal
     */
    showMainApp() {
        const loginModal = document.getElementById('loginModal');
        const mainApp = document.getElementById('mainApp');
        
        if (loginModal && mainApp) {
            loginModal.classList.remove('active');
            mainApp.style.display = 'block';
            
            // Actualizar información del usuario en el header
            this.updateUserInterface();
            
            // Cargar dashboard por defecto
            if (window.dashboardManager) {
                window.dashboardManager.loadDashboard();
            }
        }
    }

    /**
     * Actualizar interfaz con datos del usuario
     */
    updateUserInterface() {
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userName && this.currentUser) {
            userName.textContent = `${this.currentUser.first_name} ${this.currentUser.last_name}`;
        }

        if (userAvatar && this.currentUser) {
            const initials = getInitials(this.currentUser.first_name, this.currentUser.last_name);
            userAvatar.innerHTML = initials;
            userAvatar.style.background = getAvatarColor(this.currentUser.first_name);
        }

        // Actualizar elementos según permisos
        this.updateUIBasedOnPermissions();
    }

    /**
     * Actualizar UI basada en permisos
     */
    updateUIBasedOnPermissions() {
        // Botón de nuevo empleado
        const newEmployeeBtn = document.getElementById('newEmployeeBtn');
        if (newEmployeeBtn) {
            newEmployeeBtn.style.display = this.hasPermission('employee.create') ? 'block' : 'none';
        }

        // Botón de nuevo proyecto
        const newProjectBtn = document.getElementById('newProjectBtn');
        if (newProjectBtn) {
            newProjectBtn.style.display = this.hasPermission('project.create') ? 'block' : 'none';
        }

        // Ocultar secciones según rol
        this.updateMenuBasedOnRole();
    }

    /**
     * Actualizar menú según rol
     */
    updateMenuBasedOnRole() {
        const role = this.currentUser?.role;
        
        // Configurar visibilidad de elementos del menú
        const menuConfig = {
            'admin': ['dashboard', 'projects', 'employees', 'tasks', 'reports', 'settings'],
            'manager': ['dashboard', 'projects', 'employees', 'tasks', 'reports'],
            'employee': ['dashboard', 'projects', 'tasks']
        };

        const allowedSections = menuConfig[role] || [];
        
        document.querySelectorAll('.menu-item').forEach(item => {
            const section = item.dataset.section;
            if (section && !allowedSections.includes(section)) {
                item.style.display = 'none';
            }
        });
    }

    /**
     * Obtener rol del usuario actual
     */
    getUserRole() {
        return this.currentUser?.role || 'employee';
    }

    /**
     * Verificar si es admin
     */
    isAdmin() {
        return this.getUserRole() === 'admin';
    }

    /**
     * Verificar si es manager
     */
    isManager() {
        return this.getUserRole() === 'manager';
    }

    /**
     * Obtener datos del usuario actual
     */
    getCurrentUser() {
        return this.currentUser;
    }
}

// ============================================
// 🎭 FUNCIONES DE INICIALIZACIÓN
// ============================================

/**
 * Inicializar sistema de autenticación
 */
function initAuth() {
    // Crear instancia del gestor de autenticación
    window.authManager = new AuthManager();

    // Configurar eventos del formulario de login
    setupLoginForm();

    // Configurar botones demo
    setupDemoButtons();

    // Configurar botón de logout
    setupLogoutButton();
}

/**
 * Configurar formulario de login
 */
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showLoginError('Por favor completa todos los campos');
                return;
            }

            if (!isValidEmail(email)) {
                showLoginError('Por favor ingresa un email válido');
                return;
            }

            // Deshabilitar botón durante el login
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
            
            hideLoginError();

            try {
                const success = await authManager.login(email, password);
                
                if (!success) {
                    showLoginError('Email o contraseña incorrectos');
                }
            } catch (error) {
                showLoginError('Error de conexión. Intenta nuevamente.');
            } finally {
                // Restaurar botón
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
            }
        });
    }
}

/**
 * Configurar botones demo
 */
function setupDemoButtons() {
    const demoButtons = document.querySelectorAll('.demo-btn');
    
    demoButtons.forEach(button => {
        button.addEventListener('click', () => {
            const email = button.dataset.email;
            const password = button.dataset.password;
            
            if (email && password) {
                document.getElementById('email').value = email;
                document.getElementById('password').value = password;
                
                // Auto-login después de un breve delay
                setTimeout(() => {
                    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
                }, 300);
            }
        });
    });
}

/**
 * Configurar botón de logout
 */
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                authManager.logout();
            }
        });
    }
}

/**
 * Mostrar error en login
 */
function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto-hide después de 5 segundos
        setTimeout(hideLoginError, 5000);
    }
}

/**
 * Ocultar error en login
 */
function hideLoginError() {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

/**
 * Verificar autenticación antes de cargar páginas
 */
function requireAuth() {
    if (!authManager || !authManager.isAuthenticated) {
        authManager.showLoginModal();
        return false;
    }
    return true;
}

/**
 * Middleware para verificar permisos
 */
function requirePermission(permission) {
    if (!requireAuth()) return false;
    
    if (!authManager.hasPermission(permission)) {
        showNotification('No tienes permisos para realizar esta acción', 'warning');
        return false;
    }
    
    return true;
}

// ============================================
// 🚀 AUTO-INICIALIZACIÓN
// ============================================

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initAuth);
