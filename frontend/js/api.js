/**
 * 🌐 EnterprisePro - API Client
 * Cliente HTTP para interactuar con la API REST del backend
 */

class APIClient {
    constructor() {
        this.baseURL = window.location.origin + '/api';
        this.token = localStorage.getItem('access_token');
    }

    /**
     * Configurar token de autenticación
     */
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
    }

    /**
     * Obtener headers por defecto
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * Realizar petición HTTP genérica
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            showLoading(true);
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                // Token expirado, intentar renovar o redirigir a login
                await this.handleUnauthorized();
                return null;
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            showNotification(error.message, 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }

    /**
     * Manejar token no autorizado
     */
    async handleUnauthorized() {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken) {
            try {
                const response = await fetch(`${this.baseURL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken })
                });

                if (response.ok) {
                    const data = await response.json();
                    this.setToken(data.access_token);
                    localStorage.setItem('refresh_token', data.refresh_token);
                    return;
                }
            } catch (error) {
                console.error('Token refresh failed:', error);
            }
        }

        // Si no se puede renovar, cerrar sesión
        this.logout();
    }

    /**
     * Cerrar sesión
     */
    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        window.location.reload();
    }

    // ============================================
    // 🔐 ENDPOINTS DE AUTENTICACIÓN
    // ============================================

    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response) {
            this.setToken(response.tokens.access_token);
            localStorage.setItem('refresh_token', response.tokens.refresh_token);
            localStorage.setItem('user_data', JSON.stringify(response.user));
        }

        return response;
    }

    async getProfile() {
        return await this.request('/auth/profile');
    }

    async getUserPermissions() {
        return await this.request('/permissions');
    }

    // ============================================
    // 👥 ENDPOINTS DE USUARIOS
    // ============================================

    async getUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/users?${queryString}`);
    }

    async createUser(userData) {
        return await this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async updateUser(userId, userData) {
        return await this.request(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    // ============================================
    // 📋 ENDPOINTS DE PROYECTOS
    // ============================================

    async getProjects(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/projects?${queryString}`);
    }

    async getProject(projectId) {
        return await this.request(`/projects/${projectId}`);
    }

    async createProject(projectData) {
        return await this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    }

    async updateProjectProgress(projectId, progress) {
        return await this.request(`/projects/${projectId}/progress`, {
            method: 'PUT',
            body: JSON.stringify({ progress })
        });
    }

    // ============================================
    // 📊 ENDPOINTS DE MÉTRICAS
    // ============================================

    async getDashboardMetrics() {
        return await this.request('/dashboard/metrics');
    }

    // ============================================
    // 🔍 ENDPOINTS DE UTILIDAD
    // ============================================

    async healthCheck() {
        return await this.request('/health');
    }
}

// ============================================
// 🛠️ FUNCIONES DE UTILIDAD
// ============================================

/**
 * Mostrar/ocultar overlay de carga
 */
function showLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('active', show);
    }
}

/**
 * Mostrar notificación
 */
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Añadir estilos si no existen
    if (!document.querySelector('.notification-styles')) {
        const styles = document.createElement('style');
        styles.className = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                padding: 16px 20px;
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 1500;
                max-width: 400px;
                border-left: 4px solid;
                animation: slideInRight 0.3s ease;
            }
            .notification-success { border-color: #10b981; }
            .notification-error { border-color: #ef4444; }
            .notification-warning { border-color: #f59e0b; }
            .notification-info { border-color: #2563eb; }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1;
            }
            .notification-close {
                background: none;
                border: none;
                cursor: pointer;
                color: #6b7280;
                font-size: 14px;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
        `;
        document.head.appendChild(styles);
    }

    // Añadir al DOM
    document.body.appendChild(notification);

    // Auto remover después de 5 segundos
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);

    // Manejar click en cerrar
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    });
}

/**
 * Obtener icono para notificación
 */
function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

/**
 * Formatear moneda
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * Formatear fecha
 */
function formatDate(dateString) {
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(dateString));
}

/**
 * Formatear fecha relativa
 */
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
    
    return formatDate(dateString);
}

/**
 * Generar color para avatar
 */
function getAvatarColor(name) {
    const colors = [
        '#2563eb', '#7c3aed', '#dc2626', '#ea580c', 
        '#d97706', '#059669', '#0d9488', '#4338ca'
    ];
    const hash = name.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
}

/**
 * Obtener iniciales del nombre
 */
function getInitials(firstName, lastName) {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
}

/**
 * Escapar HTML para prevenir XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Debounce para búsquedas
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Validar email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Instancia global del cliente API
window.apiClient = new APIClient();
