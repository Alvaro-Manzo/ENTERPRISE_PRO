-- 🎭 Datos de ejemplo para EnterprisePro
-- Datos realistas para demostrar el sistema

-- ============================================
-- 👥 USUARIOS DEL SISTEMA
-- ============================================

-- Admin principal
INSERT INTO users (email, password_hash, first_name, last_name, role, phone, address) VALUES 
('jogobonito029@gmail.com', 'admin123', 'Jogo', 'Bonito', 'admin', '+1-555-0100', '100 Admin Street'),
('admin@enterprise.com', 'admin123', 'Carlos', 'Mendoza', 'admin', '+1-555-0101', '123 Executive Ave, Suite 100'),
('ceo@enterprise.com', 'admin123', 'Ana', 'Rodriguez', 'admin', '+1-555-0102', '456 Corporate Blvd');

-- Managers
INSERT INTO users (email, password_hash, first_name, last_name, role, phone, address) VALUES 
('manager.tech@enterprise.com', 'manager123', 'Roberto', 'Silva', 'manager', '+1-555-0201', '789 Tech Street'),
('manager.sales@enterprise.com', 'manager123', 'Maria', 'Garcia', 'manager', '+1-555-0202', '321 Sales Avenue'),
('manager.hr@enterprise.com', 'manager123', 'Luis', 'Martinez', 'manager', '+1-555-0203', '654 HR Plaza');

-- Empleados
INSERT INTO users (email, password_hash, first_name, last_name, role, phone, address) VALUES 
('developer1@enterprise.com', 'emp123', 'Sofia', 'Lopez', 'employee', '+1-555-0301', '111 Dev Street'),
('developer2@enterprise.com', 'emp123', 'Diego', 'Fernandez', 'employee', '+1-555-0302', '222 Code Lane'),
('designer@enterprise.com', 'emp123', 'Isabella', 'Torres', 'employee', '+1-555-0303', '333 Design Ave'),
('sales1@enterprise.com', 'emp123', 'Alejandro', 'Ramirez', 'employee', '+1-555-0401', '444 Sales Road'),
('sales2@enterprise.com', 'emp123', 'Camila', 'Herrera', 'employee', '+1-555-0402', '555 Client Street'),
('hr1@enterprise.com', 'emp123', 'Fernando', 'Cruz', 'employee', '+1-555-0501', '666 HR Boulevard');

-- ============================================
-- 🏬 DEPARTAMENTOS
-- ============================================

INSERT INTO departments (name, description, manager_id, budget) VALUES 
('Tecnología', 'Desarrollo de software y sistemas', 4, 500000.00),
('Ventas', 'Equipo comercial y relaciones con clientes', 5, 300000.00),
('Recursos Humanos', 'Gestión de talento y bienestar', 6, 150000.00),
('Marketing', 'Estrategia de marca y comunicación', 1, 200000.00);

-- ============================================
-- 👤 EMPLEADOS
-- ============================================

INSERT INTO employees (user_id, employee_id, department_id, position, salary, hire_date, manager_id, skills, performance_score) VALUES 
-- Admin y CEO
(1, 'EMP000', 1, 'Founder & CTO', 130000.00, '2019-01-01', NULL, '["Leadership", "Strategy", "Technology", "Innovation"]', 5.0),
(2, 'EMP001', 1, 'CTO', 120000.00, '2020-01-15', NULL, '["Leadership", "Strategy", "Technology"]', 4.8),
(3, 'EMP002', 4, 'CEO', 150000.00, '2019-06-01', NULL, '["Leadership", "Business", "Vision"]', 4.9),

-- Managers
(4, 'EMP101', 1, 'Tech Manager', 95000.00, '2021-03-10', 1, '["Leadership", "Python", "Architecture", "Team Management"]', 4.5),
(5, 'EMP201', 2, 'Sales Manager', 85000.00, '2021-05-20', 2, '["Leadership", "Sales", "CRM", "Negotiation"]', 4.4),
(6, 'EMP301', 3, 'HR Manager', 75000.00, '2021-08-15', 2, '["Leadership", "HR", "Recruiting", "Employee Relations"]', 4.3),

-- Empleados Tecnología
(7, 'EMP102', 1, 'Senior Developer', 80000.00, '2022-02-01', 4, '["Python", "JavaScript", "React", "Node.js", "SQL"]', 4.2),
(8, 'EMP103', 1, 'Full Stack Developer', 75000.00, '2022-04-15', 4, '["Python", "React", "PostgreSQL", "Docker"]', 4.1),
(9, 'EMP104', 1, 'UI/UX Designer', 70000.00, '2022-06-01', 4, '["Figma", "Adobe Creative", "User Research", "Prototyping"]', 4.0),

-- Empleados Ventas
(10, 'EMP202', 2, 'Senior Sales Rep', 65000.00, '2022-01-10', 5, '["Salesforce", "Customer Relations", "Prospecting", "Closing"]', 4.3),
(11, 'EMP203', 2, 'Account Executive', 60000.00, '2022-03-20', 5, '["Account Management", "HubSpot", "Presentations", "Analytics"]', 4.1),

-- Empleados HR
(12, 'EMP302', 3, 'HR Specialist', 55000.00, '2022-07-01', 6, '["Recruiting", "Onboarding", "Performance Management", "Compliance"]', 3.9);

-- ============================================
-- 📋 PROYECTOS EMPRESARIALES
-- ============================================

INSERT INTO projects (name, description, status, priority, start_date, end_date, deadline, budget, spent_budget, progress, created_by, assigned_to, department_id, client_name) VALUES 
('Sistema CRM Avanzado', 'Desarrollo de plataforma CRM personalizada para mejorar gestión de clientes', 'active', 'high', '2024-01-15', NULL, '2024-06-30', 250000.00, 125000.00, 65.5, 1, 3, 1, 'TechCorp Solutions'),
('Campaña Digital Q1', 'Estrategia de marketing digital para primer trimestre', 'active', 'medium', '2024-02-01', NULL, '2024-03-31', 80000.00, 45000.00, 78.2, 2, 4, 4, 'Global Marketing Inc'),
('Migración a la Nube', 'Migración completa de infraestructura a AWS', 'planning', 'urgent', '2024-03-01', NULL, '2024-08-15', 180000.00, 15000.00, 12.0, 1, 3, 1, 'CloudTech Partners'),
('Sistema de Inventario', 'Plataforma de gestión de inventario en tiempo real', 'active', 'medium', '2024-01-20', NULL, '2024-05-20', 120000.00, 80000.00, 85.3, 3, 6, 1, 'RetailMax Corp'),
('Programa Capacitación', 'Implementación de programa de desarrollo profesional', 'completed', 'low', '2023-09-01', '2024-01-15', '2024-01-31', 50000.00, 48000.00, 100.0, 5, 11, 3, 'Internal');

-- ============================================
-- ✅ TAREAS DETALLADAS
-- ============================================

INSERT INTO tasks (project_id, title, description, status, priority, assigned_to, created_by, estimated_hours, actual_hours, start_date, due_date) VALUES 
-- Tareas CRM
(1, 'Diseño de Base de Datos', 'Crear esquema optimizado para CRM', 'completed', 'high', 6, 3, 40.0, 38.5, '2024-01-15', '2024-01-30'),
(1, 'API de Autenticación', 'Implementar sistema JWT seguro', 'completed', 'high', 6, 3, 32.0, 35.0, '2024-01-31', '2024-02-15'),
(1, 'Dashboard Principal', 'Crear interface principal del CRM', 'in_progress', 'medium', 7, 3, 45.0, 28.5, '2024-02-15', '2024-03-15'),
(1, 'Módulo de Contactos', 'CRUD completo para gestión de contactos', 'pending', 'medium', 6, 3, 35.0, 0.0, '2024-03-15', '2024-04-01'),
(1, 'Diseño UI/UX', 'Interfaces modernas y responsive', 'in_progress', 'medium', 8, 3, 50.0, 22.0, '2024-02-01', '2024-03-20'),

-- Tareas Campaña Digital
(2, 'Análisis de Mercado', 'Investigación de audiencia objetivo', 'completed', 'high', 9, 4, 25.0, 24.0, '2024-02-01', '2024-02-10'),
(2, 'Creación de Contenido', 'Desarrollo de materiales promocionales', 'in_progress', 'medium', 10, 4, 30.0, 18.5, '2024-02-10', '2024-02-25'),
(2, 'Configuración Analytics', 'Setup de tracking y métricas', 'pending', 'low', 9, 4, 15.0, 0.0, '2024-02-25', '2024-03-05'),

-- Tareas Migración Nube
(3, 'Auditoría Infraestructura', 'Análisis completo de sistemas actuales', 'completed', 'urgent', 6, 3, 60.0, 58.0, '2024-03-01', '2024-03-15'),
(3, 'Plan de Migración', 'Estrategia detallada de migración', 'in_progress', 'urgent', 3, 1, 40.0, 25.0, '2024-03-15', '2024-04-01'),

-- Tareas Inventario
(4, 'Prototipo Sistema', 'Versión inicial funcional', 'completed', 'high', 7, 6, 55.0, 52.0, '2024-01-20', '2024-02-15'),
(4, 'Integración APIs', 'Conectar con sistemas externos', 'completed', 'medium', 6, 3, 35.0, 38.0, '2024-02-15', '2024-03-10'),
(4, 'Testing y QA', 'Pruebas exhaustivas del sistema', 'in_progress', 'high', 7, 6, 40.0, 28.0, '2024-03-10', '2024-04-01');

-- ============================================
-- ⏰ REGISTROS DE TIEMPO
-- ============================================

INSERT INTO time_entries (user_id, project_id, task_id, description, hours, entry_date, billable) VALUES 
-- Semana actual
(6, 1, 3, 'Desarrollo de componentes React para dashboard', 8.0, '2024-03-18', 1),
(7, 1, 3, 'Integración de APIs y estado global', 7.5, '2024-03-18', 1),
(8, 1, 5, 'Diseño de wireframes y mockups', 6.0, '2024-03-18', 1),
(6, 4, 12, 'Debugging de integración con API externa', 4.5, '2024-03-18', 1),
(9, 2, 7, 'Creación de copy para campaña social media', 5.0, '2024-03-18', 1),

-- Días anteriores
(6, 1, 1, 'Optimización de queries de base de datos', 7.0, '2024-03-15', 1),
(7, 4, 11, 'Desarrollo de módulo de reportes', 8.0, '2024-03-15', 1),
(3, 3, 10, 'Revisión y planificación de arquitectura', 6.5, '2024-03-15', 0),
(10, 2, 6, 'Análisis de competencia y benchmarking', 4.0, '2024-03-14', 1),
(6, 1, 2, 'Implementación de middleware de seguridad', 7.5, '2024-03-13', 1);

-- ============================================
-- 📊 MÉTRICAS EMPRESARIALES
-- ============================================

INSERT INTO company_metrics (metric_name, metric_value, metric_type, period, recorded_date) VALUES 
-- Métricas financieras
('Revenue', 1250000.00, 'financial', 'monthly', '2024-02-28'),
('Revenue', 1180000.00, 'financial', 'monthly', '2024-01-31'),
('Expenses', 980000.00, 'financial', 'monthly', '2024-02-28'),
('Expenses', 920000.00, 'financial', 'monthly', '2024-01-31'),

-- Métricas de empleados
('Total Employees', 11, 'hr', 'monthly', '2024-03-01'),
('New Hires', 2, 'hr', 'monthly', '2024-02-28'),
('Employee Satisfaction', 4.2, 'hr', 'quarterly', '2024-01-01'),

-- Métricas de proyectos
('Active Projects', 4, 'projects', 'weekly', '2024-03-18'),
('Completed Tasks', 45, 'projects', 'weekly', '2024-03-18'),
('Project Success Rate', 92.5, 'projects', 'monthly', '2024-02-28'),

-- Métricas de productividad
('Hours Billed', 1240.5, 'productivity', 'monthly', '2024-02-28'),
('Client Satisfaction', 4.6, 'client', 'monthly', '2024-02-28'),
('Code Quality Score', 87.5, 'quality', 'weekly', '2024-03-18');

-- ============================================
-- 📝 COMENTARIOS Y NOTAS
-- ============================================

INSERT INTO comments (user_id, entity_type, entity_id, comment) VALUES 
(3, 'project', 1, 'El progreso va según lo planificado. Excelente trabajo del equipo en la optimización de la base de datos.'),
(6, 'task', 3, 'Dashboard principal está tomando más tiempo del esperado debido a cambios en los requerimientos del cliente.'),
(4, 'project', 2, 'Cliente muy satisfecho con los materiales creativos. Aprobación inmediata para siguiente fase.'),
(1, 'project', 3, 'Necesitamos acelerar la planificación. La migración es crítica para Q2.'),
(8, 'task', 5, 'Terminé los wireframes principales. Esperando feedback del cliente para continuar con prototipos.'),
(7, 'project', 4, 'Sistema de inventario funcionando perfectamente en ambiente de testing. Listo para producción.');

-- ============================================
-- 🔔 NOTIFICACIONES
-- ============================================

INSERT INTO notifications (user_id, title, message, type, action_url) VALUES 
(6, 'Nueva Tarea Asignada', 'Se te asignó la tarea "Módulo de Contactos" en el proyecto CRM', 'info', '/projects/1/tasks/4'),
(3, 'Deadline Próximo', 'El proyecto "Migración a la Nube" tiene deadline en 15 días', 'warning', '/projects/3'),
(7, 'Tarea Completada', 'Fernando Cruz completó "Testing y QA" en Sistema de Inventario', 'success', '/projects/4/tasks/12'),
(1, 'Presupuesto Actualizado', 'El proyecto CRM ha utilizado el 50% del presupuesto asignado', 'info', '/projects/1'),
(4, 'Cliente Satisfecho', 'TechCorp Solutions calificó el proyecto con 5 estrellas', 'success', '/projects/1'),
(11, 'Nueva Evaluación', 'Es tiempo de realizar tu evaluación trimestral', 'info', '/employee/performance'),
(2, 'Reporte Mensual', 'Los reportes financieros de febrero están disponibles', 'info', '/reports/financial'),
(8, 'Feedback Requerido', 'El cliente solicita revisión de los diseños UI/UX', 'warning', '/projects/1/tasks/5');
