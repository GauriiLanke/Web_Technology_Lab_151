const API_URL = 'http://localhost:8080/api';

// Navigation Logic
function showView(viewId, title) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    
    document.getElementById(viewId).classList.add('active');
    document.getElementById('page-title').innerText = title;
    
    if(event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

function showDashboard(event) {
    showView('dashboard-view', 'Dashboard');
    loadDashboardStats();
}

function showEmployees(event) {
    showView('employees-view', 'Faculty Members');
    loadEmployees();
}

function showTasks(event) {
    showView('tasks-view', 'Task Management');
    loadTasks();
}

// Modal Logic
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// API Calls
async function loadDashboardStats() {
    try {
        const res = await fetch(`${API_URL}/tasks/stats`);
        const stats = await res.json();
        
        document.getElementById('stat-employees').innerText = stats.totalEmployees;
        document.getElementById('stat-tasks').innerText = stats.totalTasks;
        document.getElementById('stat-pending').innerText = stats.pendingTasks;
        document.getElementById('stat-completed').innerText = stats.completedTasks;
        
        // Load recent tasks for dashboard
        const tRes = await fetch(`${API_URL}/tasks`);
        const tasks = await tRes.json();
        const recentTasks = tasks.reverse().slice(0, 5); // Just show top 5 newest
        
        const tbody = document.getElementById('recent-tasks-body');
        tbody.innerHTML = '';
        recentTasks.forEach(task => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${task.title}</strong></td>
                    <td>${task.employee ? task.employee.name : 'Unassigned'}</td>
                    <td><span class="badge ${task.status.toLowerCase().replace('_', '')}">${formatEnum(task.status)}</span></td>
                    <td><span class="badge ${task.priority.toLowerCase()}">${formatEnum(task.priority)}</span></td>
                    <td>${task.dueDate || '-'}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Dashboard error:", err);
    }
}

async function loadEmployees() {
    try {
        const res = await fetch(`${API_URL}/employees`);
        const employees = await res.json();
        const tbody = document.getElementById('employees-body');
        tbody.innerHTML = '';
        
        employees.forEach(emp => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${emp.name}</strong></td>
                    <td>${emp.email}</td>
                    <td>${emp.department}</td>
                    <td>${emp.designation}</td>
                    <td class="action-btns">
                        <button class="btn-edit" onclick='editEmployee(${JSON.stringify(emp).replace(/'/g, "&apos;")})'><i class='bx bx-edit'></i></button>
                        <button class="btn-danger" onclick='deleteEmployee(${emp.id})'><i class='bx bx-trash'></i></button>
                    </td>
                </tr>
            `;
        });
        
        // Populate select in task form
        const taskEmpSelect = document.getElementById('task-emp');
        taskEmpSelect.innerHTML = '<option value="">Select Faculty...</option>';
        employees.forEach(emp => {
            taskEmpSelect.innerHTML += `<option value="${emp.id}">${emp.name} (${emp.department})</option>`;
        });
        
    } catch (err) {
        console.error("Employees Error:", err);
    }
}

async function loadTasks() {
    try {
        const res = await fetch(`${API_URL}/tasks`);
        const tasks = await res.json();
        const tbody = document.getElementById('tasks-body');
        tbody.innerHTML = '';
        
        tasks.forEach(task => {
            tbody.innerHTML += `
                <tr>
                    <td>
                        <strong>${task.title}</strong>
                        <div style="font-size: 0.8rem; color: #636e72; margin-top: 4px;">${task.description || ''}</div>
                    </td>
                    <td>${task.employee ? task.employee.name : '-'}</td>
                    <td><span class="badge ${task.status.toLowerCase().replace('_', '')}">${formatEnum(task.status)}</span></td>
                    <td><span class="badge ${task.priority.toLowerCase()}">${formatEnum(task.priority)}</span></td>
                    <td>${task.dueDate || '-'}</td>
                    <td class="action-btns">
                        <button class="btn-edit" onclick='editTask(${JSON.stringify(task).replace(/'/g, "&apos;")})'><i class='bx bx-edit'></i></button>
                        <button class="btn-danger" onclick='deleteTask(${task.id})'><i class='bx bx-trash'></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Task Error:", err);
    }
}

// Helpers
function formatEnum(val) {
    if (!val) return '';
    return val.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Employee Actions
function openEmployeeModal() {
    document.getElementById('employee-form').reset();
    document.getElementById('emp-id').value = '';
    document.getElementById('emp-modal-title').innerText = 'Add Faculty';
    openModal('employee-modal');
}

function editEmployee(emp) {
    document.getElementById('emp-id').value = emp.id;
    document.getElementById('emp-name').value = emp.name;
    document.getElementById('emp-email').value = emp.email;
    document.getElementById('emp-dept').value = emp.department;
    document.getElementById('emp-desig').value = emp.designation;
    document.getElementById('emp-modal-title').innerText = 'Edit Faculty';
    openModal('employee-modal');
}

async function saveEmployee(e) {
    e.preventDefault();
    const id = document.getElementById('emp-id').value;
    const isEdit = id !== '';
    
    const payload = {
        name: document.getElementById('emp-name').value,
        email: document.getElementById('emp-email').value,
        department: document.getElementById('emp-dept').value,
        designation: document.getElementById('emp-desig').value
    };
    
    try {
        const res = await fetch(isEdit ? `${API_URL}/employees/${id}` : `${API_URL}/employees`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if(res.ok) {
            closeModal('employee-modal');
            showToast(`Faculty ${isEdit ? 'updated' : 'added'} successfully!`);
            loadEmployees();
            loadDashboardStats();
        }
    } catch (err) {
        console.error(err);
        alert('Error saving faculty.');
    }
}

async function deleteEmployee(id) {
    if(confirm('Are you sure? This will delete all their tasks too.')) {
        try {
            await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
            showToast('Faculty deleted successfully!');
            loadEmployees();
            loadDashboardStats();
        } catch (err) {
            console.error(err);
        }
    }
}

// Task Actions
function openTaskModal() {
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = '';
    document.getElementById('task-modal-title').innerText = 'Assign Task';
    loadEmployees(); // ensure select is populated
    openModal('task-modal');
}

function editTask(task) {
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-desc').value = task.description;
    
    // Make sure options exist before setting
    loadEmployees().then(() => {
        document.getElementById('task-emp').value = task.employee ? task.employee.id : '';
    });
    
    document.getElementById('task-date').value = task.dueDate;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-status').value = task.status;
    document.getElementById('task-modal-title').innerText = 'Edit Task';
    openModal('task-modal');
}

async function saveTask(e) {
    e.preventDefault();
    const id = document.getElementById('task-id').value;
    const isEdit = id !== '';
    
    const payload = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-desc').value,
        dueDate: document.getElementById('task-date').value,
        priority: document.getElementById('task-priority').value,
        status: document.getElementById('task-status').value,
        employee: { id: document.getElementById('task-emp').value }
    };
    
    try {
        const res = await fetch(isEdit ? `${API_URL}/tasks/${id}` : `${API_URL}/tasks`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if(res.ok) {
            closeModal('task-modal');
            showToast(`Task ${isEdit ? 'updated' : 'assigned'} successfully!`);
            loadTasks();
            loadDashboardStats();
        }
    } catch (err) {
        console.error(err);
        alert('Error saving task.');
    }
}

async function deleteTask(id) {
    if(confirm('Are you sure you want to delete this task?')) {
        try {
            await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
            showToast('Task deleted successfully!');
            loadTasks();
            loadDashboardStats();
        } catch (err) {
            console.error(err);
        }
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    loadEmployees(); // Preload for the task dropdown
});
