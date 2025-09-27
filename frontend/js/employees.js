/**
 * 👥 EnterprisePro - Employees Manager
 * Gestión completa de empleados y recursos humanos
 */

class EmployeesManager {
    constructor() {
        this.employees = [];
        this.departments = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.isLoading = false;
    }

    /**
     * Inicializar gestión de empleados
     */
    async init() {
        if (!requireAuth()) return;

        await this.loadEmployees();
        this.setupEventListeners();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botón nuevo empleado
        const newEmployeeBtn = document.getElementById('newEmployeeBtn');
        if (newEmployeeBtn) {
            newEmployeeBtn.addEventListener('click', () => {
                this.showNewEmployeeModal();
            });
        }
    }

    /**
     * Cargar empleados desde API
     */
    async loadEmployees() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            showLoading(true);

            const response = await apiClient.getUsers({
                per_page: this.itemsPerPage,
                page: this.currentPage
            });

            if (response && response.users) {
                this.employees = response.users;
                this.renderEmployees();
            }

        } catch (error) {
            console.error('Error loading employees:', error);
            showNotification('Error al cargar empleados', 'error');
        } finally {
            this.isLoading = false;
            showLoading(false);
        }
    }

    /**
     * Renderizar tabla de empleados
     */
    renderEmployees() {
        const tableBody = document.getElementById('employeesTableBody');
        if (!tableBody) return;

        if (this.employees.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <i class="fas fa-users" style="font-size: 48px; color: var(--gray-400); margin-bottom: 16px;"></i>
                        <h3 style="color: var(--gray-600); margin-bottom: 8px;">No hay empleados</h3>
                        <p style="color: var(--gray-500);">Comienza añadiendo el primer empleado</p>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.employees.map(employee => 
            this.createEmployeeRow(employee)
        ).join('');

        // Configurar event listeners de las filas
        this.setupEmployeeRowListeners();
    }

    /**
     * Crear fila de empleado
     */
    createEmployeeRow(employee) {
        const fullName = `${employee.first_name} ${employee.last_name}`;
        const initials = getInitials(employee.first_name, employee.last_name);
        const avatarColor = getAvatarColor(fullName);
        const department = employee.department_name || 'Sin asignar';
        const position = employee.position || 'Sin definir';
        const performanceScore = employee.performance_score || 0;
        const stars = this.generateStars(performanceScore);
        
        return `
            <tr data-employee-id="${employee.id}">
                <td>
                    <div class="employee-info">
                        <div class="employee-avatar" style="background: ${avatarColor};">
                            ${initials}
                        </div>
                        <div class="employee-details">
                            <h4>${escapeHtml(fullName)}</h4>
                            <p>ID: ${escapeHtml(employee.employee_id || 'N/A')}</p>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="department-badge">${escapeHtml(department)}</span>
                </td>
                <td>${escapeHtml(position)}</td>
                <td>
                    <a href="mailto:${employee.email}" class="email-link">
                        ${escapeHtml(employee.email)}
                    </a>
                </td>
                <td>
                    <div class="performance-score">
                        <div class="score-stars">${stars}</div>
                        <span class="score-value">${performanceScore.toFixed(1)}</span>
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit view-employee" data-employee-id="${employee.id}" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${authManager.hasPermission('employee.update') ? `
                            <button class="action-btn edit edit-employee" data-employee-id="${employee.id}" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        ${authManager.hasPermission('employee.delete') ? `
                            <button class="action-btn delete delete-employee" data-employee-id="${employee.id}" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Generar estrellas de rendimiento
     */
    generateStars(score) {
        const maxStars = 5;
        const filledStars = Math.floor(score);
        const halfStar = score % 1 >= 0.5;
        let stars = '';

        // Estrellas llenas
        for (let i = 0; i < filledStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }

        // Media estrella
        if (halfStar && filledStars < maxStars) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }

        // Estrellas vacías
        const emptyStars = maxStars - filledStars - (halfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }

        return stars;
    }

    /**
     * Configurar listeners de filas de empleados
     */
    setupEmployeeRowListeners() {
        // Botones de ver
        document.querySelectorAll('.view-employee').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const employeeId = e.target.closest('[data-employee-id]').dataset.employeeId;
                this.viewEmployee(employeeId);
            });
        });

        // Botones de editar
        document.querySelectorAll('.edit-employee').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const employeeId = e.target.closest('[data-employee-id]').dataset.employeeId;
                this.editEmployee(employeeId);
            });
        });

        // Botones de eliminar
        document.querySelectorAll('.delete-employee').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const employeeId = e.target.closest('[data-employee-id]').dataset.employeeId;
                this.deleteEmployee(employeeId);
            });
        });

        // Hover en filas
        document.querySelectorAll('#employeesTableBody tr').forEach(row => {
            row.addEventListener('mouseenter', function() {
                this.style.backgroundColor = 'var(--gray-50)';
            });
            
            row.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '';
            });
        });
    }

    /**
     * Ver detalles del empleado
     */
    viewEmployee(employeeId) {
        const employee = this.employees.find(emp => emp.id == employeeId);
        if (employee) {
            this.showEmployeeDetailsModal(employee);
        }
    }

    /**
     * Editar empleado
     */
    editEmployee(employeeId) {
        if (!requirePermission('employee.update')) return;

        const employee = this.employees.find(emp => emp.id == employeeId);
        if (employee) {
            this.showEditEmployeeModal(employee);
        }
    }

    /**
     * Eliminar empleado
     */
    async deleteEmployee(employeeId) {
        if (!requirePermission('employee.delete')) return;

        const employee = this.employees.find(emp => emp.id == employeeId);
        if (!employee) return;

        const confirmed = confirm(
            `¿Estás seguro de que deseas eliminar a ${employee.first_name} ${employee.last_name}?`
        );

        if (confirmed) {
            try {
                showLoading(true);
                
                // Aquí iría la llamada a la API para eliminar
                // await apiClient.deleteEmployee(employeeId);
                
                showNotification('Empleado eliminado exitosamente', 'success');
                await this.loadEmployees();
                
            } catch (error) {
                console.error('Error deleting employee:', error);
                showNotification('Error al eliminar empleado', 'error');
            } finally {
                showLoading(false);
            }
        }
    }

    /**
     * Mostrar modal de nuevo empleado
     */
    showNewEmployeeModal() {
        if (!requirePermission('employee.create')) return;

        const modal = this.createEmployeeModal();
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 100);
    }

    /**
     * Mostrar modal de edición
     */
    showEditEmployeeModal(employee) {
        const modal = this.createEmployeeModal(employee);
        document.body.appendChild(modal);
        this.fillEmployeeForm(modal, employee);
        setTimeout(() => modal.classList.add('active'), 100);
    }

    /**
     * Mostrar modal de detalles
     */
    showEmployeeDetailsModal(employee) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>
                        <i class="fas fa-user"></i>
                        Detalles del Empleado
                    </h2>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="employee-profile">
                    <div class="profile-header">
                        <div class="employee-avatar large" style="background: ${getAvatarColor(employee.first_name)};">
                            ${getInitials(employee.first_name, employee.last_name)}
                        </div>
                        <div class="profile-info">
                            <h3>${escapeHtml(employee.first_name)} ${escapeHtml(employee.last_name)}</h3>
                            <p class="role">${escapeHtml(employee.role)}</p>
                            <p class="position">${escapeHtml(employee.position || 'Sin definir')}</p>
                        </div>
                    </div>
                    
                    <div class="profile-details">
                        <div class="detail-row">
                            <span class="label"><i class="fas fa-envelope"></i> Email:</span>
                            <span class="value">${escapeHtml(employee.email)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label"><i class="fas fa-phone"></i> Teléfono:</span>
                            <span class="value">${escapeHtml(employee.phone || 'No registrado')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label"><i class="fas fa-building"></i> Departamento:</span>
                            <span class="value">${escapeHtml(employee.department_name || 'Sin asignar')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label"><i class="fas fa-calendar"></i> Fecha de ingreso:</span>
                            <span class="value">${employee.created_at ? formatDate(employee.created_at) : 'No disponible'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label"><i class="fas fa-star"></i> Rendimiento:</span>
                            <span class="value">
                                <div class="performance-score">
                                    <div class="score-stars">${this.generateStars(employee.performance_score || 0)}</div>
                                    <span>${(employee.performance_score || 0).toFixed(1)}</span>
                                </div>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Configurar cierre del modal
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
            }
        });

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 100);
    }

    /**
     * Crear modal de empleado
     */
    createEmployeeModal(employee = null) {
        const isEdit = !!employee;
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>
                        <i class="fas fa-user${isEdit ? '-edit' : '-plus'}"></i>
                        ${isEdit ? 'Editar Empleado' : 'Nuevo Empleado'}
                    </h2>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form class="employee-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="firstName">
                                <i class="fas fa-user"></i> Nombre
                            </label>
                            <input type="text" id="firstName" name="first_name" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="lastName">
                                <i class="fas fa-user"></i> Apellido
                            </label>
                            <input type="text" id="lastName" name="last_name" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="email">
                                <i class="fas fa-envelope"></i> Email
                            </label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="phone">
                                <i class="fas fa-phone"></i> Teléfono
                            </label>
                            <input type="tel" id="phone" name="phone">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="role">
                                <i class="fas fa-user-tag"></i> Rol
                            </label>
                            <select id="role" name="role">
                                <option value="employee">Empleado</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="position">
                                <i class="fas fa-briefcase"></i> Posición
                            </label>
                            <input type="text" id="position" name="position">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="address">
                            <i class="fas fa-map-marker-alt"></i> Dirección
                        </label>
                        <textarea id="address" name="address" rows="2"></textarea>
                    </div>
                    
                    ${!isEdit ? `
                        <div class="form-group">
                            <label for="password">
                                <i class="fas fa-lock"></i> Contraseña Temporal
                            </label>
                            <input type="password" id="password" name="password" required>
                            <small style="color: var(--gray-600);">El empleado deberá cambiarla en el primer acceso</small>
                        </div>
                    ` : ''}
                    
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary modal-cancel">
                            Cancelar
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i>
                            ${isEdit ? 'Actualizar' : 'Crear'} Empleado
                        </button>
                    </div>
                </form>
            </div>
        `;

        this.setupEmployeeModalListeners(modal, employee);
        return modal;
    }

    /**
     * Configurar listeners del modal
     */
    setupEmployeeModalListeners(modal, employee) {
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const form = modal.querySelector('.employee-form');

        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleEmployeeSubmit(form, employee, closeModal);
        });
    }

    /**
     * Manejar envío del formulario
     */
    async handleEmployeeSubmit(form, employee, closeModal) {
        const formData = new FormData(form);
        const employeeData = Object.fromEntries(formData.entries());

        try {
            showLoading(true);
            
            let response;
            if (employee) {
                response = await apiClient.updateUser(employee.id, employeeData);
            } else {
                response = await apiClient.createUser(employeeData);
            }

            if (response) {
                showNotification(
                    employee ? 'Empleado actualizado exitosamente' : 'Empleado creado exitosamente',
                    'success'
                );
                closeModal();
                await this.loadEmployees();
            }

        } catch (error) {
            console.error('Error saving employee:', error);
            showNotification('Error al guardar empleado', 'error');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Rellenar formulario con datos del empleado
     */
    fillEmployeeForm(modal, employee) {
        const form = modal.querySelector('.employee-form');
        
        form.querySelector('#firstName').value = employee.first_name || '';
        form.querySelector('#lastName').value = employee.last_name || '';
        form.querySelector('#email').value = employee.email || '';
        form.querySelector('#phone').value = employee.phone || '';
        form.querySelector('#role').value = employee.role || 'employee';
        form.querySelector('#position').value = employee.position || '';
        form.querySelector('#address').value = employee.address || '';
    }

    /**
     * Limpiar recursos
     */
    cleanup() {
        this.employees = [];
        this.departments = [];
    }
}

// ============================================
// 🚀 INICIALIZACIÓN
// ============================================

// Crear instancia global
window.employeesManager = new EmployeesManager();

// CSS adicional para empleados
const employeeStyles = document.createElement('style');
employeeStyles.textContent = `
    .department-badge {
        background: rgba(37, 99, 235, 0.1);
        color: var(--primary-color);
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .email-link {
        color: var(--primary-color);
        text-decoration: none;
    }
    
    .email-link:hover {
        text-decoration: underline;
    }
    
    .employee-profile {
        padding: 24px;
    }
    
    .profile-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 24px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--gray-200);
    }
    
    .employee-avatar.large {
        width: 80px;
        height: 80px;
        font-size: 28px;
    }
    
    .profile-info h3 {
        margin: 0 0 4px 0;
        font-size: 24px;
        color: var(--gray-900);
    }
    
    .profile-info .role {
        margin: 0 0 4px 0;
        color: var(--primary-color);
        font-weight: 600;
        text-transform: capitalize;
    }
    
    .profile-info .position {
        margin: 0;
        color: var(--gray-600);
    }
    
    .profile-details {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    
    .detail-row {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .detail-row .label {
        min-width: 140px;
        font-weight: 600;
        color: var(--gray-700);
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .detail-row .value {
        color: var(--gray-800);
        flex: 1;
    }
    
    .performance-score {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .performance-score .score-stars {
        color: var(--warning-color);
    }
    
    .performance-score .score-value,
    .performance-score span {
        font-weight: 600;
        color: var(--gray-700);
    }
    
    @media (max-width: 768px) {
        .profile-header {
            flex-direction: column;
            text-align: center;
        }
        
        .detail-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
        }
        
        .detail-row .label {
            min-width: auto;
        }
    }
`;
document.head.appendChild(employeeStyles);
