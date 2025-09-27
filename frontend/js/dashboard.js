/**
 * 📊 EnterprisePro - Dashboard Manager
 * Gestión del dashboard ejecutivo con métricas en tiempo real
 */

class DashboardManager {
    constructor() {
        this.charts = {};
        this.refreshInterval = null;
        this.autoRefreshEnabled = true;
    }

    /**
     * Cargar dashboard completo
     */
    async loadDashboard() {
        if (!requireAuth()) return;

        try {
            showLoading(true);
            
            // Cargar métricas del dashboard
            const metrics = await apiClient.getDashboardMetrics();
            
            if (metrics) {
                this.updateKPICards(metrics);
                this.initializeCharts(metrics);
                this.updateActivityFeed();
                this.startAutoRefresh();
            }
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
            showNotification('Error al cargar el dashboard', 'error');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Actualizar tarjetas KPI
     */
    updateKPICards(metrics) {
        // Actualizar ingresos
        const revenueKpi = document.getElementById('revenueKpi');
        if (revenueKpi && metrics.financial) {
            const revenue = metrics.financial.find(m => m.metric_name === 'Revenue');
            if (revenue) {
                revenueKpi.textContent = formatCurrency(revenue.metric_value);
            }
        }

        // Actualizar proyectos
        const projectsKpi = document.getElementById('projectsKpi');
        if (projectsKpi && metrics.projects) {
            projectsKpi.textContent = metrics.projects.active_projects || 0;
        }

        // Actualizar empleados
        const employeesKpi = document.getElementById('employeesKpi');
        if (employeesKpi && metrics.employees) {
            employeesKpi.textContent = metrics.employees.total_employees || 0;
        }

        // Actualizar rendimiento
        const performanceKpi = document.getElementById('performanceKpi');
        if (performanceKpi && metrics.projects) {
            const avgProgress = metrics.projects.avg_progress || 0;
            performanceKpi.textContent = `${avgProgress.toFixed(1)}%`;
        }

        // Animar contadores
        this.animateCounters();
    }

    /**
     * Animar contadores KPI
     */
    animateCounters() {
        document.querySelectorAll('.kpi-card h3').forEach(element => {
            const finalValue = element.textContent;
            const numericValue = parseFloat(finalValue.replace(/[^0-9.-]+/g, ''));
            
            if (!isNaN(numericValue)) {
                this.animateValue(element, 0, numericValue, 1000, finalValue);
            }
        });
    }

    /**
     * Animar valor numérico
     */
    animateValue(element, start, end, duration, finalText) {
        const startTime = performance.now();
        const isPercentage = finalText.includes('%');
        const isCurrency = finalText.includes('$');
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = start + (end - start) * this.easeOutQuart(progress);
            
            let displayValue = Math.floor(current).toLocaleString();
            
            if (isCurrency) {
                displayValue = '$' + displayValue;
            } else if (isPercentage) {
                displayValue = current.toFixed(1) + '%';
            }
            
            element.textContent = displayValue;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = finalText;
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * Función de easing para animaciones
     */
    easeOutQuart(t) {
        return 1 - (--t) * t * t * t;
    }

    /**
     * Inicializar gráficos
     */
    initializeCharts(metrics) {
        this.createRevenueChart();
        this.createDepartmentChart();
    }

    /**
     * Crear gráfico de ingresos
     */
    createRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        // Destruir gráfico existente si existe
        if (this.charts.revenue) {
            this.charts.revenue.destroy();
        }

        // Datos simulados para demostración
        const data = {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            datasets: [{
                label: 'Ingresos',
                data: [850000, 920000, 1100000, 1050000, 1200000, 1250000, 1180000, 1320000, 1450000, 1380000, 1500000, 1420000],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#2563eb',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        };

        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000000).toFixed(1) + 'M';
                            }
                        },
                        grid: {
                            color: '#f1f5f9'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                elements: {
                    point: {
                        hoverBorderWidth: 3
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        };

        this.charts.revenue = new Chart(ctx, config);
    }

    /**
     * Crear gráfico de departamentos
     */
    createDepartmentChart() {
        const ctx = document.getElementById('departmentChart');
        if (!ctx) return;

        // Destruir gráfico existente si existe
        if (this.charts.department) {
            this.charts.department.destroy();
        }

        const data = {
            labels: ['Tecnología', 'Ventas', 'Marketing', 'RRHH', 'Operaciones'],
            datasets: [{
                data: [45, 25, 15, 8, 7],
                backgroundColor: [
                    '#2563eb',
                    '#06d6a0',
                    '#f59e0b',
                    '#ef4444',
                    '#8b5cf6'
                ],
                borderWidth: 0,
                hoverBorderWidth: 2,
                hoverBorderColor: '#ffffff'
            }]
        };

        const config = {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        };

        this.charts.department = new Chart(ctx, config);
    }

    /**
     * Actualizar feed de actividad
     */
    updateActivityFeed() {
        // Esta función actualizaría las actividades en tiempo real
        // Por ahora usa datos estáticos del HTML
        console.log('Activity feed updated');
    }

    /**
     * Iniciar actualización automática
     */
    startAutoRefresh() {
        if (!this.autoRefreshEnabled) return;

        // Refrescar cada 5 minutos
        this.refreshInterval = setInterval(() => {
            this.refreshMetrics();
        }, 5 * 60 * 1000);
    }

    /**
     * Detener actualización automática
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Refrescar métricas
     */
    async refreshMetrics() {
        try {
            const metrics = await apiClient.getDashboardMetrics();
            if (metrics) {
                this.updateKPICards(metrics);
                
                // Actualizar datos de gráficos si es necesario
                this.updateChartData(metrics);
            }
        } catch (error) {
            console.error('Error refreshing metrics:', error);
        }
    }

    /**
     * Actualizar datos de gráficos
     */
    updateChartData(metrics) {
        // Actualizar gráfico de ingresos con nuevos datos
        if (this.charts.revenue && metrics.financial) {
            // Implementar lógica de actualización de datos
            this.charts.revenue.update('none');
        }
    }

    /**
     * Limpiar dashboard
     */
    cleanup() {
        this.stopAutoRefresh();
        
        // Destruir gráficos
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        this.charts = {};
    }

    /**
     * Redimensionar gráficos
     */
    resize() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }
}

// ============================================
// 🎯 FUNCIONES DE UTILIDAD DEL DASHBOARD
// ============================================

/**
 * Actualizar progreso de proyecto en tiempo real
 */
function updateProjectProgress(projectId, newProgress) {
    const progressElements = document.querySelectorAll(`[data-project-id="${projectId}"] .progress-fill`);
    
    progressElements.forEach(element => {
        element.style.width = `${newProgress}%`;
        
        // Actualizar texto de porcentaje
        const progressText = element.parentElement.parentElement.querySelector('.progress-header span:last-child');
        if (progressText) {
            progressText.textContent = `${newProgress}%`;
        }
    });
}

/**
 * Añadir nueva actividad al feed
 */
function addActivityToFeed(activity) {
    const feedContainer = document.querySelector('.activity-feed');
    if (!feedContainer) return;

    const activityElement = document.createElement('div');
    activityElement.className = 'activity-item';
    activityElement.innerHTML = `
        <div class="activity-icon ${activity.type}">
            <i class="fas fa-${activity.icon}"></i>
        </div>
        <div class="activity-content">
            <p><strong>${escapeHtml(activity.title)}</strong> - ${escapeHtml(activity.description)}</p>
            <span class="activity-time">${formatRelativeTime(activity.timestamp)}</span>
        </div>
    `;

    // Insertar al principio
    feedContainer.insertBefore(activityElement, feedContainer.firstChild);

    // Limitar a 10 elementos
    const items = feedContainer.querySelectorAll('.activity-item');
    if (items.length > 10) {
        items[items.length - 1].remove();
    }

    // Animar entrada
    activityElement.style.opacity = '0';
    activityElement.style.transform = 'translateX(-20px)';
    
    setTimeout(() => {
        activityElement.style.transition = 'all 0.3s ease';
        activityElement.style.opacity = '1';
        activityElement.style.transform = 'translateX(0)';
    }, 100);
}

/**
 * Mostrar detalles de KPI en modal
 */
function showKPIDetails(kpiType) {
    // Implementar modal con detalles del KPI
    console.log(`Showing details for KPI: ${kpiType}`);
}

// ============================================
// 🚀 INICIALIZACIÓN
// ============================================

// Crear instancia global del dashboard manager
window.dashboardManager = new DashboardManager();

// Manejar redimensionado de ventana
window.addEventListener('resize', debounce(() => {
    if (window.dashboardManager) {
        window.dashboardManager.resize();
    }
}, 250));

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
    if (window.dashboardManager) {
        window.dashboardManager.cleanup();
    }
});
