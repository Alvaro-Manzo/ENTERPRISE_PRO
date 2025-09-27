/**
 * 🏢 EnterprisePro - Main Application Controller
 * Controlador principal que coordina toda la aplicación
 */

class EnterprisePro {
    constructor() {
        this.currentSection = 'dashboard';
        this.sidebarCollapsed = false;
        this.managers = {};
        this.isInitialized = false;
    }

    /**
     * Inicializar aplicación completa
     */
    async init() {
        if (this.isInitialized) return;

        try {
            // Esperar a que se complete la autenticación
            await this.waitForAuth();

            // Configurar navegación
            this.setupNavigation();

            // Configurar sidebar
            this.setupSidebar();

            // Inicializar managers de secciones
            await this.initializeManagers();

            // Cargar sección inicial
            this.showSection('dashboard');

            // Configurar eventos globales
            this.setupGlobalEvents();

            this.isInitialized = true;
            console.log('✅ EnterprisePro inicializado correctamente');

        } catch (error) {
            console.error('❌ Error inicializando EnterprisePro:', error);
            showNotification('Error inicializando la aplicación', 'error');
        }
    }

    /**
     * Esperar a que la autenticación esté lista
     */
    async waitForAuth() {
        return new Promise((resolve) => {
            const checkAuth = () => {
                if (window.authManager && window.authManager.isAuthenticated) {
                    resolve();
                } else {
                    setTimeout(checkAuth, 100);
                }
            };
            checkAuth();
        });
    }

    /**
     * Inicializar managers de secciones
     */
    async initializeManagers() {
        try {
            // Dashboard Manager
            if (window.dashboardManager) {
                this.managers.dashboard = window.dashboardManager;
            }

            // Projects Manager
            if (window.projectsManager) {
                this.managers.projects = window.projectsManager;
                await this.managers.projects.init();
            }

            // Employees Manager
            if (window.employeesManager) {
                this.managers.employees = window.employeesManager;
                await this.managers.employees.init();
            }

            console.log('✅ Managers inicializados');
        } catch (error) {
            console.error('Error inicializando managers:', error);
        }
    }

    /**
     * Configurar navegación entre secciones
     */
    setupNavigation() {
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                if (section) {
                    this.showSection(section);
                }
            });
        });
    }

    /**
     * Configurar sidebar
     */
    setupSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');

        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                this.sidebarCollapsed = !this.sidebarCollapsed;
                sidebar.classList.toggle('collapsed', this.sidebarCollapsed);
                
                // Guardar estado en localStorage
                localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed);
            });

            // Restaurar estado del sidebar
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState === 'true') {
                this.sidebarCollapsed = true;
                sidebar.classList.add('collapsed');
            }
        }

        // Cerrar sidebar en móvil al hacer click fuera
        if (window.innerWidth <= 768) {
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            });
        }
    }

    /**
     * Mostrar sección específica
     */
    async showSection(sectionName) {
        // Verificar permisos
        if (!this.canAccessSection(sectionName)) {
            showNotification('No tienes permisos para acceder a esta sección', 'warning');
            return;
        }

        try {
            // Ocultar todas las secciones
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });

            // Remover clase active de todos los menu items
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });

            // Mostrar sección seleccionada
            const targetSection = document.getElementById(`${sectionName}Section`);
            const menuItem = document.querySelector(`[data-section="${sectionName}"]`);

            if (targetSection && menuItem) {
                targetSection.classList.add('active');
                menuItem.classList.add('active');
                
                this.currentSection = sectionName;

                // Cargar datos de la sección si es necesario
                await this.loadSectionData(sectionName);

                // Actualizar URL sin recargar
                this.updateURL(sectionName);

                // Actualizar título de la página
                this.updatePageTitle(sectionName);

                console.log(`📍 Navegando a: ${sectionName}`);
            }

        } catch (error) {
            console.error(`Error mostrando sección ${sectionName}:`, error);
            showNotification('Error cargando la sección', 'error');
        }
    }

    /**
     * Verificar si el usuario puede acceder a una sección
     */
    canAccessSection(sectionName) {
        if (!window.authManager || !window.authManager.isAuthenticated) {
            return false;
        }

        const userRole = window.authManager.getUserRole();
        
        // Configuración de acceso por rol
        const sectionAccess = {
            dashboard: ['admin', 'manager', 'employee'],
            projects: ['admin', 'manager', 'employee'],
            employees: ['admin', 'manager'],
            tasks: ['admin', 'manager', 'employee'],
            reports: ['admin', 'manager'],
            settings: ['admin']
        };

        const allowedRoles = sectionAccess[sectionName] || [];
        return allowedRoles.includes(userRole);
    }

    /**
     * Cargar datos específicos de la sección
     */
    async loadSectionData(sectionName) {
        const manager = this.managers[sectionName];
        
        if (manager && typeof manager.loadData === 'function') {
            await manager.loadData();
        } else if (sectionName === 'dashboard' && this.managers.dashboard) {
            await this.managers.dashboard.loadDashboard();
        }
    }

    /**
     * Actualizar URL
     */
    updateURL(sectionName) {
        const url = new URL(window.location);
        url.hash = sectionName;
        window.history.pushState(null, '', url);
    }

    /**
     * Actualizar título de la página
     */
    updatePageTitle(sectionName) {
        const sectionTitles = {
            dashboard: 'Dashboard',
            projects: 'Proyectos',
            employees: 'Empleados',
            tasks: 'Tareas',
            reports: 'Reportes',
            settings: 'Configuración'
        };

        const title = sectionTitles[sectionName] || 'EnterprisePro';
        document.title = `${title} - EnterprisePro`;
    }

    /**
     * Configurar eventos globales
     */
    setupGlobalEvents() {
        // Manejar navegación por hash
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            if (hash && this.canAccessSection(hash)) {
                this.showSection(hash);
            }
        });

        // Cargar sección desde hash inicial
        const initialHash = window.location.hash.substring(1);
        if (initialHash && this.canAccessSection(initialHash)) {
            this.showSection(initialHash);
        }

        // Atajos de teclado
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Manejo de redimensionado
        window.addEventListener('resize', debounce(() => {
            this.handleResize();
        }, 250));

        // Detectar inactividad
        this.setupInactivityDetection();

        // Configurar notificaciones de escritorio
        this.setupDesktopNotifications();
    }

    /**
     * Manejar atajos de teclado
     */
    handleKeyboardShortcuts(e) {
        // Alt + D = Dashboard
        if (e.altKey && e.key === 'd') {
            e.preventDefault();
            this.showSection('dashboard');
        }
        
        // Alt + P = Proyectos
        if (e.altKey && e.key === 'p') {
            e.preventDefault();
            this.showSection('projects');
        }
        
        // Alt + E = Empleados
        if (e.altKey && e.key === 'e') {
            e.preventDefault();
            if (this.canAccessSection('employees')) {
                this.showSection('employees');
            }
        }
        
        // Ctrl + / = Mostrar ayuda
        if (e.ctrlKey && e.key === '/') {
            e.preventDefault();
            this.showHelpModal();
        }
    }

    /**
     * Manejar redimensionado
     */
    handleResize() {
        const width = window.innerWidth;
        
        // Auto-colapsar sidebar en móvil
        if (width <= 768) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.add('collapsed');
            }
        }

        // Notificar a los managers sobre el redimensionado
        Object.values(this.managers).forEach(manager => {
            if (manager && typeof manager.handleResize === 'function') {
                manager.handleResize();
            }
        });
    }

    /**
     * Configurar detección de inactividad
     */
    setupInactivityDetection() {
        let inactivityTimer;
        const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutos

        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                this.handleInactivity();
            }, INACTIVITY_TIME);
        };

        // Eventos que resetean el timer
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });

        resetTimer();
    }

    /**
     * Manejar inactividad del usuario
     */
    handleInactivity() {
        const shouldLogout = confirm(
            '¿Has estado inactivo por un tiempo. ¿Deseas continuar tu sesión?'
        );

        if (!shouldLogout) {
            window.authManager.logout();
        }
    }

    /**
     * Configurar notificaciones de escritorio
     */
    setupDesktopNotifications() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    /**
     * Enviar notificación de escritorio
     */
    sendDesktopNotification(title, message, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                ...options
            });

            // Auto-cerrar después de 5 segundos
            setTimeout(() => notification.close(), 5000);
        }
    }

    /**
     * Mostrar modal de ayuda
     */
    showHelpModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2><i class="fas fa-question-circle"></i> Ayuda y Atajos</h2>
                    <button class="modal-close"><i class="fas fa-times"></i></button>
                </div>
                
                <div style="padding: 24px;">
                    <h3>Atajos de Teclado</h3>
                    <div class="shortcuts-list">
                        <div class="shortcut-item">
                            <kbd>Alt + D</kbd>
                            <span>Ir al Dashboard</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Alt + P</kbd>
                            <span>Ir a Proyectos</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Alt + E</kbd>
                            <span>Ir a Empleados</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl + /</kbd>
                            <span>Mostrar esta ayuda</span>
                        </div>
                    </div>
                    
                    <h3 style="margin-top: 24px;">Información del Sistema</h3>
                    <p>EnterprisePro v1.0.0</p>
                    <p>Usuario: ${window.authManager?.getCurrentUser()?.first_name} ${window.authManager?.getCurrentUser()?.last_name}</p>
                    <p>Rol: ${window.authManager?.getUserRole()}</p>
                </div>
            </div>
        `;

        // Configurar cierre
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 100);
    }

    /**
     * Obtener sección actual
     */
    getCurrentSection() {
        return this.currentSection;
    }

    /**
     * Limpiar recursos al cerrar
     */
    cleanup() {
        Object.values(this.managers).forEach(manager => {
            if (manager && typeof manager.cleanup === 'function') {
                manager.cleanup();
            }
        });
    }
}

// ============================================
// 🚀 INICIALIZACIÓN GLOBAL
// ============================================

// Crear instancia global de la aplicación
window.enterprisePro = new EnterprisePro();

// CSS para atajos de teclado
const keyboardStyles = document.createElement('style');
keyboardStyles.textContent = `
    .shortcuts-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .shortcut-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
    }
    
    kbd {
        background: var(--gray-100);
        border: 1px solid var(--gray-300);
        border-radius: 4px;
        padding: 4px 8px;
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--gray-700);
    }
`;
document.head.appendChild(keyboardStyles);

// Inicializar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Esperar un momento para que otros scripts se inicialicen
    setTimeout(() => {
        window.enterprisePro.init();
    }, 500);
});

// Limpiar recursos al cerrar la ventana
window.addEventListener('beforeunload', () => {
    if (window.enterprisePro) {
        window.enterprisePro.cleanup();
    }
});

// Manejar errores globales
window.addEventListener('error', (e) => {
    console.error('Error global:', e.error);
    showNotification('Ha ocurrido un error inesperado', 'error');
});

// Manejar promesas rechazadas
window.addEventListener('unhandledrejection', (e) => {
    console.error('Promesa rechazada:', e.reason);
    showNotification('Error de conexión o procesamiento', 'error');
});

console.log('🏢 EnterprisePro cargado y listo para inicializar');
