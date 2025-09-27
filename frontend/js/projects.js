/**
 * 📋 EnterprisePro - Projects Manager
 * Gestión completa de proyectos empresariales
 */

class ProjectsManager {
    constructor() {
        this.projects = [];
        this.filteredProjects = [];
        this.currentFilters = {
            status: '',
            priority: '',
            search: ''
        };
        this.isLoading = false;
    }

    /**
     * Inicializar gestión de proyectos
     */
    async init() {
        if (!requireAuth()) return;

        this.setupEventListeners();
        await this.loadProjects();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Filtros
        const statusFilter = document.getElementById('projectStatusFilter');
        const priorityFilter = document.getElementById('projectPriorityFilter');
        const searchInput = document.getElementById('projectSearch');

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value;
                this.applyFilters();
            });
        }

        if (priorityFilter) {
            priorityFilter.addEventListener('change', (e) => {
                this.currentFilters.priority = e.target.value;
                this.applyFilters();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.currentFilters.search = e.target.value.toLowerCase();
                this.applyFilters();
            }, 300));
        }

        // Botón nuevo proyecto
        const newProjectBtn = document.getElementById('newProjectBtn');
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => {
                this.showNewProjectModal();
            });
        }
    }

    /**
     * Cargar proyectos desde API
     */
    async loadProjects() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            showLoading(true);

            const response = await apiClient.getProjects({
                per_page: 50,
                page: 1
            });

            if (response && response.projects) {
                this.projects = response.projects;
                this.filteredProjects = [...this.projects];
                this.renderProjects();
            }

        } catch (error) {
            console.error('Error loading projects:', error);
            showNotification('Error al cargar proyectos', 'error');
        } finally {
            this.isLoading = false;
            showLoading(false);
        }
    }

    /**
     * Aplicar filtros a los proyectos
     */
    applyFilters() {
        let filtered = [...this.projects];

        // Filtro por estado
        if (this.currentFilters.status) {
            filtered = filtered.filter(project => 
                project.status === this.currentFilters.status
            );
        }

        // Filtro por prioridad
        if (this.currentFilters.priority) {
            filtered = filtered.filter(project => 
                project.priority === this.currentFilters.priority
            );
        }

        // Filtro por búsqueda
        if (this.currentFilters.search) {
            filtered = filtered.filter(project =>
                project.name.toLowerCase().includes(this.currentFilters.search) ||
                project.description?.toLowerCase().includes(this.currentFilters.search) ||
                project.client_name?.toLowerCase().includes(this.currentFilters.search)
            );
        }

        this.filteredProjects = filtered;
        this.renderProjects();
    }

    /**
     * Renderizar proyectos en el DOM
     */
    renderProjects() {
        const projectsGrid = document.getElementById('projectsGrid');
        if (!projectsGrid) return;

        if (this.filteredProjects.length === 0) {
            projectsGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No se encontraron proyectos</h3>
                    <p>Intenta ajustar los filtros o crear un nuevo proyecto</p>
                </div>
            `;
            return;
        }

        projectsGrid.innerHTML = this.filteredProjects.map(project => 
            this.createProjectCard(project)
        ).join('');

        // Añadir event listeners a las tarjetas
        this.setupProjectCardListeners();
    }

    /**
     * Crear tarjeta de proyecto
     */
    createProjectCard(project) {
        const progress = Math.round(project.progress || 0);
        const budget = project.budget ? formatCurrency(project.budget) : 'No definido';
        const spentBudget = project.spent_budget ? formatCurrency(project.spent_budget) : '$0';
        const deadline = project.deadline ? formatDate(project.deadline) : 'Sin fecha límite';
        
        return `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-header">
                    <h3 class="project-title">${escapeHtml(project.name)}</h3>
                    <div class="project-meta">
                        <span class="project-status ${project.status}">${this.getStatusText(project.status)}</span>
                        <span class="project-priority ${project.priority}">${this.getPriorityText(project.priority)}</span>
                    </div>
                </div>
                
                <div class="project-body">
                    <p class="project-description">
                        ${escapeHtml(project.description || 'Sin descripción')}
                    </p>
                    
                    <div class="project-progress-section">
                        <div class="progress-header">
                            <span>Progreso del Proyecto</span>
                            <span>${progress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    
                    <div class="project-stats">
                        <div class="stat-item">
                            <div class="stat-value">${budget}</div>
                            <div class="stat-label">Presupuesto</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${spentBudget}</div>
                            <div class="stat-label">Gastado</div>
                        </div>
                    </div>
                    
                    <div class="project-meta-info">
                        <small><i class="fas fa-calendar"></i> ${deadline}</small>
                        ${project.client_name ? `<small><i class="fas fa-building"></i> ${escapeHtml(project.client_name)}</small>` : ''}
                        ${project.assigned_to_name ? `<small><i class="fas fa-user"></i> ${escapeHtml(project.assigned_to_name)} ${escapeHtml(project.assigned_to_lastname || '')}</small>` : ''}
                    </div>
                    
                    <div class="project-actions">
                        <button class="btn-small btn-outline view-project" data-project-id="${project.id}">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        ${authManager.hasPermission('project.update') ? `
                            <button class="btn-small btn-primary edit-project" data-project-id="${project.id}">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Configurar listeners de tarjetas de proyecto
     */
    setupProjectCardListeners() {
        // Botones de ver proyecto
        document.querySelectorAll('.view-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.target.closest('[data-project-id]').dataset.projectId;
                this.viewProject(projectId);
            });
        });

        // Botones de editar proyecto
        document.querySelectorAll('.edit-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.target.closest('[data-project-id]').dataset.projectId;
                this.editProject(projectId);
            });
        });

        // Añadir animación hover a las tarjetas
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-4px)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }

    /**
     * Ver detalles de proyecto
     */
    async viewProject(projectId) {
        try {
            showLoading(true);
            const project = await apiClient.getProject(projectId);
            
            if (project) {
                this.showProjectDetailsModal(project);
            }
        } catch (error) {
            console.error('Error loading project:', error);
            showNotification('Error al cargar proyecto', 'error');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Editar proyecto
     */
    editProject(projectId) {
        if (!requirePermission('project.update')) return;
        
        const project = this.projects.find(p => p.id == projectId);
        if (project) {
            this.showEditProjectModal(project);
        }
    }

    /**
     * Mostrar modal de nuevo proyecto
     */
    showNewProjectModal() {
        if (!requirePermission('project.create')) return;
        
        // Crear modal dinámicamente
        const modal = this.createProjectModal();
        document.body.appendChild(modal);
        
        // Mostrar modal
        setTimeout(() => modal.classList.add('active'), 100);
    }

    /**
     * Mostrar modal de edición de proyecto
     */
    showEditProjectModal(project) {
        const modal = this.createProjectModal(project);
        document.body.appendChild(modal);
        
        // Rellenar campos con datos del proyecto
        this.fillProjectForm(modal, project);
        
        setTimeout(() => modal.classList.add('active'), 100);
    }

    /**
     * Crear modal de proyecto
     */
    createProjectModal(project = null) {
        const isEdit = !!project;
        const modalId = `projectModal_${Date.now()}`;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = modalId;
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>
                        <i class="fas fa-project-diagram"></i>
                        ${isEdit ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                    </h2>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form class="project-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="projectName">
                                <i class="fas fa-tag"></i> Nombre del Proyecto
                            </label>
                            <input type="text" id="projectName" name="name" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="projectDescription">
                            <i class="fas fa-align-left"></i> Descripción
                        </label>
                        <textarea id="projectDescription" name="description" rows="3"></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="projectStatus">
                                <i class="fas fa-flag"></i> Estado
                            </label>
                            <select id="projectStatus" name="status">
                                <option value="planning">Planificación</option>
                                <option value="active">Activo</option>
                                <option value="completed">Completado</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="projectPriority">
                                <i class="fas fa-exclamation"></i> Prioridad
                            </label>
                            <select id="projectPriority" name="priority">
                                <option value="low">Baja</option>
                                <option value="medium">Media</option>
                                <option value="high">Alta</option>
                                <option value="urgent">Urgente</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="projectBudget">
                                <i class="fas fa-dollar-sign"></i> Presupuesto
                            </label>
                            <input type="number" id="projectBudget" name="budget" min="0" step="0.01">
                        </div>
                        
                        <div class="form-group">
                            <label for="projectDeadline">
                                <i class="fas fa-calendar"></i> Fecha Límite
                            </label>
                            <input type="date" id="projectDeadline" name="deadline">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="projectClient">
                            <i class="fas fa-building"></i> Cliente
                        </label>
                        <input type="text" id="projectClient" name="client_name">
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary modal-cancel">
                            Cancelar
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i>
                            ${isEdit ? 'Actualizar' : 'Crear'} Proyecto
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Event listeners del modal
        this.setupProjectModalListeners(modal, project);
        
        return modal;
    }

    /**
     * Configurar listeners del modal de proyecto
     */
    setupProjectModalListeners(modal, project) {
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const form = modal.querySelector('.project-form');

        // Cerrar modal
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        // Cerrar al hacer click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Submit del formulario
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleProjectSubmit(form, project, closeModal);
        });
    }

    /**
     * Manejar envío del formulario de proyecto
     */
    async handleProjectSubmit(form, project, closeModal) {
        const formData = new FormData(form);
        const projectData = Object.fromEntries(formData.entries());

        // Convertir valores numéricos
        if (projectData.budget) {
            projectData.budget = parseFloat(projectData.budget);
        }

        try {
            showLoading(true);
            
            let response;
            if (project) {
                // Actualizar proyecto existente
                response = await apiClient.updateProject(project.id, projectData);
            } else {
                // Crear nuevo proyecto
                response = await apiClient.createProject(projectData);
            }

            if (response) {
                showNotification(
                    project ? 'Proyecto actualizado exitosamente' : 'Proyecto creado exitosamente',
                    'success'
                );
                
                closeModal();
                await this.loadProjects(); // Recargar lista
            }

        } catch (error) {
            console.error('Error saving project:', error);
            showNotification('Error al guardar proyecto', 'error');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Rellenar formulario con datos del proyecto
     */
    fillProjectForm(modal, project) {
        const form = modal.querySelector('.project-form');
        
        form.querySelector('#projectName').value = project.name || '';
        form.querySelector('#projectDescription').value = project.description || '';
        form.querySelector('#projectStatus').value = project.status || 'planning';
        form.querySelector('#projectPriority').value = project.priority || 'medium';
        form.querySelector('#projectBudget').value = project.budget || '';
        form.querySelector('#projectClient').value = project.client_name || '';
        
        if (project.deadline) {
            const deadline = new Date(project.deadline).toISOString().split('T')[0];
            form.querySelector('#projectDeadline').value = deadline;
        }
    }

    /**
     * Mostrar modal de detalles de proyecto
     */
    showProjectDetailsModal(project) {
        // Implementar modal de detalles
        console.log('Showing project details:', project);
    }

    /**
     * Obtener texto del estado
     */
    getStatusText(status) {
        const statuses = {
            planning: 'Planificación',
            active: 'Activo',
            completed: 'Completado',
            cancelled: 'Cancelado'
        };
        return statuses[status] || status;
    }

    /**
     * Obtener texto de prioridad
     */
    getPriorityText(priority) {
        const priorities = {
            low: 'Baja',
            medium: 'Media',
            high: 'Alta',
            urgent: 'Urgente'
        };
        return priorities[priority] || priority;
    }

    /**
     * Limpiar recursos
     */
    cleanup() {
        // Remover event listeners si es necesario
        this.projects = [];
        this.filteredProjects = [];
    }
}

// ============================================
// 🚀 INICIALIZACIÓN
// ============================================

// Crear instancia global
window.projectsManager = new ProjectsManager();

// CSS adicional para modales de proyecto
const projectStyles = document.createElement('style');
projectStyles.textContent = `
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 24px 0;
        margin-bottom: 24px;
    }
    
    .modal-header h2 {
        margin: 0;
        color: var(--gray-900);
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 18px;
        color: var(--gray-500);
        cursor: pointer;
        padding: 8px;
        border-radius: 4px;
    }
    
    .modal-close:hover {
        background: var(--gray-100);
        color: var(--gray-700);
    }
    
    .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid var(--gray-200);
    }
    
    .project-meta-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 12px;
        font-size: 12px;
        color: var(--gray-600);
    }
    
    .project-meta-info small {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    
    .no-results {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        color: var(--gray-500);
    }
    
    .no-results i {
        font-size: 48px;
        margin-bottom: 16px;
        color: var(--gray-400);
    }
    
    .no-results h3 {
        margin-bottom: 8px;
        color: var(--gray-600);
    }
    
    @media (max-width: 768px) {
        .form-row {
            grid-template-columns: 1fr;
        }
        
        .modal-actions {
            flex-direction: column;
        }
    }
`;
document.head.appendChild(projectStyles);
